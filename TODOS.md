# STEG Cut Tracker Tunisia — Project Tracker

## Project Structure
```
steg-outage-tracker/
├── .env.local                      # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.mjs
├── postcss.config.mjs
├── schema.sql                      # Full PostGIS + Supabase schema
├── scraper.py                      # Automated STEG news scraper
├── TODOS.md                        # This file
├── .github/workflows/
│   └── steg_scraper.yml            # Cron: every 30 min
└── src/
    ├── app/
    │   ├── globals.css             # Tailwind v4 + Leaflet styles
    │   ├── layout.tsx              # Root layout
    │   ├── page.tsx                # Dashboard map + report button
    │   └── api/
    │       ├── report/route.ts     # POST: submit outage report
    │       ├── outages/route.ts    # GET: GeoJSON clusters
    │       ├── telegram-webhook/route.ts  # POST: Telegram bot
    │       └── scraper-trigger/route.ts   # POST: ingest scraped data
    ├── components/
    │   ├── OutageMap.tsx           # Leaflet map (client-side only)
    │   ├── ReportModal.tsx         # Report power cut modal
    │   └── LiveStatsHeader.tsx     # Live counter header
    └── lib/
        ├── supabaseClient.ts       # Supabase init
        └── locationUtils.ts        # Tunisian geo data & helpers
```

## Status

- [x] Project config files (package.json, tsconfig, next.config, postcss, .gitignore, .env.local)
- [x] schema.sql — PostGIS, outage_reports table, GIST index, ST_ClusterDBSCAN function, RLS
- [x] src/lib/supabaseClient.ts
- [x] src/lib/locationUtils.ts — Tunisian governorates, delegations, keywords
- [x] src/components/OutageMap.tsx — Leaflet map with cluster circles & individual markers
- [x] src/components/ReportModal.tsx — Location picker (GPS or manual selector)
- [x] src/components/LiveStatsHeader.tsx — Real-time active reports counter
- [x] src/app/globals.css — Tailwind v4 imports
- [x] src/app/layout.tsx
- [x] src/app/page.tsx — Dashboard with map, peak-hour warning, report button
- [x] src/app/api/report/route.ts — POST endpoint for outage reports
- [x] src/app/api/outages/route.ts — GET endpoint returning GeoJSON clusters
- [x] src/app/api/telegram-webhook/route.ts — Telegram bot handler
- [x] src/app/api/scraper-trigger/route.ts — Scraper ingestion relay
- [x] scraper.py — Python RSS scraper with governorate keyword matching
- [x] .github/workflows/steg_scraper.yml — GitHub Actions cron (every 30 min)

## Deployment Checklist

- [ ] 1. Create Supabase free project → run schema.sql in SQL Editor
- [ ] 2. Enable Realtime on `outage_reports` table in Supabase Dashboard > Database > Replication
- [ ] 3. Copy Supabase URL & anon key → paste into Vercel env vars
- [ ] 4. Create Telegram bot via @BotFather → set TELEGRAM_BOT_TOKEN
- [ ] 5. Set ADMIN_PASSWORD for admin dashboard access
- [ ] 6. Push to GitHub → import into Vercel → deploy
- [ ] 7. Run curl to set Telegram webhook (see route.ts header)
- [ ] 8. Enable GitHub Actions → scraper runs automatically
