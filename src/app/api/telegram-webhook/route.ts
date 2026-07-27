/*
  TELEGRAM WEBHOOK SETUP:
  curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
    -H "Content-Type: application/json" \
    -d '{"url": "https://<domain>.vercel.app/api/telegram-webhook"}'
*/

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

const GOVS: { name: string; lat: number; lng: number }[] = [
  { name: 'Tunis', lat: 36.8065, lng: 10.1815 },
  { name: 'Ariana', lat: 36.8625, lng: 10.1956 },
  { name: 'Ben Arous', lat: 36.7531, lng: 10.222 },
  { name: 'Manouba', lat: 36.8078, lng: 10.1005 },
  { name: 'Nabeul', lat: 36.4524, lng: 10.7353 },
  { name: 'Zaghouan', lat: 36.4028, lng: 10.1428 },
  { name: 'Bizerte', lat: 37.2746, lng: 9.8639 },
  { name: 'Béja', lat: 36.7262, lng: 9.1866 },
  { name: 'Jendouba', lat: 36.5014, lng: 8.7808 },
  { name: 'Kef', lat: 36.1682, lng: 8.7034 },
  { name: 'Siliana', lat: 36.0844, lng: 9.3708 },
  { name: 'Kairouan', lat: 35.6781, lng: 10.0996 },
  { name: 'Kasserine', lat: 35.1681, lng: 8.8362 },
  { name: 'Sidi Bouzid', lat: 35.0383, lng: 9.487 },
  { name: 'Sousse', lat: 35.8264, lng: 10.6371 },
  { name: 'Monastir', lat: 35.7778, lng: 10.8311 },
  { name: 'Mahdia', lat: 35.5025, lng: 11.0622 },
  { name: 'Sfax', lat: 34.7407, lng: 10.7592 },
  { name: 'Gabès', lat: 33.8827, lng: 10.0998 },
  { name: 'Médenine', lat: 33.3549, lng: 10.5055 },
  { name: 'Tataouine', lat: 32.9297, lng: 10.4518 },
  { name: 'Gafsa', lat: 34.425, lng: 8.7842 },
  { name: 'Tozeur', lat: 33.9197, lng: 8.1335 },
  { name: 'Kebili', lat: 33.7047, lng: 8.969 },
]

function findGov(text: string) {
  const lower = text.toLowerCase()
  for (const g of GOVS) {
    const norm = g.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    if (lower.includes(g.name.toLowerCase()) || lower.includes(norm)) return g
  }
  return null
}

async function call(method: string, body: Record<string, unknown>) {
  await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function govKeyboard() {
  const rows = []
  for (let i = 0; i < GOVS.length; i += 3) {
    rows.push(GOVS.slice(i, i + 3).map(g => ({ text: g.name, callback_data: `gov_${g.name}` })))
  }
  return { inline_keyboard: rows }
}

async function insertReport(lat: number, lng: number, gov: string, delegation: string) {
  const { error } = await supabase.rpc('insert_outage_report', {
    p_latitude: lat,
    p_longitude: lng,
    p_governorate: gov,
    p_delegation: delegation,
    p_source: 'BOT',
  })
  if (error) {
    await supabase.from('outage_reports').insert({
      location: `SRID=4326;POINT(${lng} ${lat})`,
      governorate: gov,
      delegation,
      status: 'OFF',
      source: 'BOT',
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    const msg = update.message
    const cb = update.callback_query

    // Handle callback queries from inline keyboards
    if (cb) {
      const chatId = cb.message.chat.id
      const data = cb.data || ''

      if (data.startsWith('gov_')) {
        const name = data.slice(4)
        const g = GOVS.find(x => x.name === name)
        if (g) {
          await insertReport(g.lat, g.lng, g.name, '')
          await call('sendMessage', {
            chat_id: chatId,
            text: `✅ Merci. Signalement de coupure à *${g.name}* enregistré.\n\nشكرا. تم تسجيل انقطاع التيار في ${g.name}`,
            parse_mode: 'Markdown',
          })
        }
      }

      await call('answerCallbackQuery', { callback_query_id: cb.id })
      return NextResponse.json({ ok: true })
    }

    if (!msg) return NextResponse.json({ ok: true })

    const chatId = msg.chat.id
    const text = msg.text || ''

    // Location pin
    if (msg.location) {
      const { latitude, longitude } = msg.location
      let nearest = 'Unknown'
      let minDist = Infinity
      for (const g of GOVS) {
        const d = Math.sqrt(Math.pow(latitude - g.lat, 2) + Math.pow(longitude - g.lng, 2))
        if (d < minDist) {
          minDist = d
          nearest = g.name
        }
      }
      await insertReport(latitude, longitude, nearest, '')
      await call('sendMessage', {
        chat_id: chatId,
        text: `✅ Merci. Votre signalement à *${nearest}* a été enregistré.`,
        parse_mode: 'Markdown',
      })
      return NextResponse.json({ ok: true })
    }

    // /start
    if (text.startsWith('/start')) {
      await call('sendMessage', {
        chat_id: chatId,
        text: '🔌 *Win El Dhaw*\n\nSignalez une coupure :\n1. Envoyez votre *position* 📍\n2. Choisissez un gouvernorat 👇\n3. Écrivez un nom (ex: "Coupure Sfax")',
        parse_mode: 'Markdown',
        reply_markup: govKeyboard(),
      })
      return NextResponse.json({ ok: true })
    }

    // /status
    if (text.startsWith('/status')) {
      const { data } = await supabase.rpc('get_active_clusters', {
        radius_meters: 1500,
        time_window_minutes: 120,
      })
      const count = data?.metadata?.total_reports ?? 0
      const clusters = data?.metadata?.total_clusters ?? 0
      await call('sendMessage', {
        chat_id: chatId,
        text: `📊 *Statistiques*\n\nSignalements actifs: ${count}\nZones touchées: ${clusters}\n\nCarte: https://steg-tracker.vercel.app`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '📋 Choisir un gouvernorat', callback_data: 'show_govs' }]],
        },
      })
      return NextResponse.json({ ok: true })
    }

    // "show_govs" callback (when sent as text via keyboard)
    if (text === 'show_govs' || text === '/govs') {
      await call('sendMessage', {
        chat_id: chatId,
        text: 'Sélectionnez un gouvernorat :',
        reply_markup: govKeyboard(),
      })
      return NextResponse.json({ ok: true })
    }

    // Parse governorate from text
    const matched = findGov(text)
    if (matched) {
      await insertReport(matched.lat, matched.lng, matched.name, '')
      await call('sendMessage', {
        chat_id: chatId,
        text: `✅ Merci. Signalement de coupure à *${matched.name}* enregistré.\n\nشكرا. تم تسجيل انقطاع التيار في ${matched.name}`,
        parse_mode: 'Markdown',
      })
      return NextResponse.json({ ok: true })
    }

    // Unrecognized
    await call('sendMessage', {
      chat_id: chatId,
      text: '❌ Gouvernorat non reconnu.\n\nUtilisez le menu ci-dessous ou envoyez une localisation.',
      reply_markup: govKeyboard(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
