#!/usr/bin/env python3
"""STEG outage scraper — parses Tunisian news RSS feeds for outage keywords."""

import os
import re
import sys
import json
import time
import requests
from datetime import datetime

GOVERNORATE_COORDS: dict[str, tuple[float, float]] = {
    'tunis': (36.8065, 10.1815),
    'ariana': (36.8625, 10.1956),
    'ben arous': (36.7531, 10.2220),
    'manouba': (36.8078, 10.1005),
    'nabeul': (36.4524, 10.7353),
    'zaghouan': (36.4028, 10.1428),
    'bizerte': (37.2746, 9.8639),
    'beja': (36.7262, 9.1866),
    'béja': (36.7262, 9.1866),
    'jendouba': (36.5014, 8.7808),
    'kef': (36.1682, 8.7034),
    'le kef': (36.1682, 8.7034),
    'siliana': (36.0844, 9.3708),
    'kairouan': (35.6781, 10.0996),
    'kasserine': (35.1681, 8.8362),
    'sidi bouzid': (35.0383, 9.4870),
    'sousse': (35.8264, 10.6371),
    'monastir': (35.7778, 10.8311),
    'mahdia': (35.5025, 11.0622),
    'sfax': (34.7407, 10.7592),
    'gabes': (33.8827, 10.0998),
    'gabès': (33.8827, 10.0998),
    'médenine': (33.3549, 10.5055),
    'medenine': (33.3549, 10.5055),
    'tataouine': (32.9297, 10.4518),
    'gafsa': (34.4250, 8.7842),
    'tozeur': (33.9197, 8.1335),
    'kebili': (33.7047, 8.9690),
}

PROPER_NAMES: dict[str, str] = {
    'ben arous': 'Ben Arous',
    'le kef': 'Kef',
    'béja': 'Béja',
    'beja': 'Béja',
    'gabes': 'Gabès',
    'gabès': 'Gabès',
    'medenine': 'Médenine',
    'médenine': 'Médenine',
}

SOURCES = [
    {
        'name': 'Mosaique FM',
        'url': 'https://www.mosaiquefm.net/feed',
    },
    {
        'name': 'Tunisie Numerique',
        'url': 'https://www.tunisienumerique.com/feed',
    },
]

OUTAGE_KEYWORDS = [
    'coupure', 'électricité', 'electricite', 'électrique', 'electrique',
    'panne', 'courant', 'steg', 'délestage', 'delestage',
    'coupure de courant', "coupure d'électricité",
    'انقطاع', 'تيار', 'كهرباء',
    'maintenance', 'réseau', 'reseau', 'basse tension',
    'pénurie', 'penurie',
]


def fetch_rss(url: str) -> str | None:
    headers = {
        'User-Agent': 'STEG-Cut-Tracker-Scraper/1.0 (Tunisia)'
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        return resp.text
    except requests.RequestException as e:
        print(f"[{datetime.utcnow().isoformat()}] RSS fetch error {url}: {e}", file=sys.stderr)
        return None


def parse_rss_items(xml: str) -> list[str]:
    items = re.findall(r'<item>(.*?)</item>', xml, re.DOTALL)
    results = []
    for item in items:
        title_m = re.search(r'<title><!\[CDATA\[(.*?)\]\]></title>', item)
        desc_m = re.search(r'<description><!\[CDATA\[(.*?)\]\]></description>', item)
        title = title_m.group(1) if title_m else ''
        desc = desc_m.group(1) if desc_m else ''
        results.append(f"{title} {desc}")
    return results


def is_outage_related(text: str) -> bool:
    lower = text.lower()
    for kw in OUTAGE_KEYWORDS:
        if kw in lower:
            return True
    return False


def find_governorate(text: str) -> tuple[str | None, float | None, float | None]:
    lower = text.lower()
    for key, (lat, lng) in GOVERNORATE_COORDS.items():
        if key in lower:
            name = PROPER_NAMES.get(key, key.title())
            return name, lat, lng
    return None, None, None


def main():
    target = os.environ.get(
        'SCRAPER_TARGET_URL',
        'https://steg-tracker.vercel.app/api/scraper-trigger'
    )

    for source in SOURCES:
        xml = fetch_rss(source['url'])
        if not xml:
            continue

        items = parse_rss_items(xml)
        reported = 0

        for item_text in items:
            if not is_outage_related(item_text):
                continue

            gov_name, lat, lng = find_governorate(item_text)
            if not gov_name:
                continue

            payload = {
                'latitude': str(lat),
                'longitude': str(lng),
                'governorate': gov_name,
                'delegation': '',
                'source': 'SCRAPER',
            }

            try:
                resp = requests.post(target, json=payload, timeout=10)
                if resp.ok:
                    reported += 1
                time.sleep(0.5)
            except requests.RequestException:
                continue

        print(
            f"[{datetime.utcnow().isoformat()}] {source['name']}: {reported} new reports"
        )


if __name__ == '__main__':
    main()
