# Cairn

Bookkeeping and CRA set-aside tracking for Canadian self-employed people. Cairn records income and
expenses in form T2125 categories, tracks GST/HST, and estimates income tax and CPP/QPP owing as you
go, so freelancers know how much of each payment to put away.

## What's in this version

- **Set-aside estimate**: 2026 federal and provincial brackets, CPP or QPP for the self-employed, and GST/HST owing
- **Entries**: income and expenses with T2125 lines, business-use %, and the 50% meals rule
- **Receipt reading**: describe a purchase or upload a photo; Claude fills in the form for review
- **Home office and equipment**: business-use-of-home with carry-forward, and capital cost allowance (CCA) by class
- **GST/HST**: regular and quick methods, the $30,000 registration meter, and a quick-method savings hint
- **Tax time**: T2125 and GST/HST return summaries, CRA deadlines, and a CSV export for an accountant
- **Privacy**: every table and the receipts bucket are protected by Postgres row-level security

## Stack

Next.js 15 (App Router, server actions) · Supabase (Postgres, auth, storage) · Claude API for receipts ·
Tailwind CSS 4 · Vitest. Bank feeds (Flinks) and billing (Stripe) are planned; see [docs/ROADMAP.md](docs/ROADMAP.md).

## Getting started

1. Create a Supabase project, then apply the schema:
   ```bash
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   ```
   Or paste `supabase/migrations/0001_init.sql` into the SQL editor and run it. `0002_receipts_storage.sql`
   is optional for now (photo storage is not used yet).
2. In Supabase → Authentication → URL configuration, add `http://localhost:3000/auth/callback` as a redirect URL.
3. Configure the app:
   ```bash
   cp .env.example .env.local   # fill in the Supabase URL and anon key, and an Anthropic API key
   npm install
   npm run dev
   ```
4. Open http://localhost:3000 and sign in with a magic link.

Receipt reading is hidden when `ANTHROPIC_API_KEY` is not set.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests for the tax engine and receipt schema |
| `npm run test:db` | Applies the migrations to an in-memory Postgres and checks row-level security |
| `npm run typecheck` | TypeScript check |

## Project layout

```
src/lib/tax/          Pure tax engine: rates, brackets, CPP/QPP, GST/HST, CCA, summaries, deadlines
src/lib/data.ts       Loads a user's books from Supabase and maps rows to tax-engine types
src/app/(app)/        Signed-in screens and their server actions
src/app/api/receipts  Claude receipt extraction (structured output)
src/app/api/export    Accountant CSV
supabase/migrations   Schema and row-level security policies
```

The tax engine has no I/O, so it can be tested on its own and reused in a mobile app.

## Tax figures

The 2026 reference figures live in `src/lib/tax/reference.ts`. Some provincial figures are still
estimates; [docs/TAX_REFERENCE.md](docs/TAX_REFERENCE.md) lists what has been checked and what has not.
Cairn gives estimates for planning and is not tax advice.
