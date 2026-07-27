# Contributing

Thanks for your interest in Win El Dhaw!

## How to Contribute

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Make your changes**
4. **Run the build**: `npm run build` (must pass)
5. **Commit** with a clear message
6. **Push** and open a **Pull Request**

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `TELEGRAM_BOT_TOKEN` — from @BotFather
- `ADMIN_PASSWORD` — for `/admin` dashboard access

### Database

Run `schema.sql` in the Supabase SQL Editor.

## Code Style

- Prettier for formatting
- ESLint (`next/core-web-vitals`) for linting
- TypeScript strict mode
- No commented-out code or `TODO` placeholders

## Pull Request Checklist

- [ ] Build passes (`npm run build`)
- [ ] TypeScript check passes (`npx tsc --noEmit`)  
- [ ] Lint passes (`npm run lint`)
- [ ] No new warnings
- [ ] Description of changes included
