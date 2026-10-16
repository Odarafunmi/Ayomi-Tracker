# Ayomi Tracker

A warm, feminine cycle and hormone-phase tracking web app: it predicts your period,
flags irregularities gently, and explains what to expect emotionally and physically in
each phase.

Built with **Next.js (App Router)**, **Tailwind CSS** and **Framer Motion**, styled to
the *Ayomi v2 Burgundy & Cream* design system. The prediction and phase engine is pure,
fully unit-tested TypeScript that runs entirely in the frontend.

---

## Features

| # | Feature | Where |
|---|---------|-------|
| 1 | Sign up & onboarding (last period, cycle length, NDPA consent) | `/onboarding` |
| 2 | One-tap period logging + calendar history | `/calendar`, `/today` |
| 3 | Cycle prediction (next period + fertile window) | hero dial, calendar |
| 4 | Hormonal phase tracker (cycle day + current phase) | `/today` |
| 5 | Phase insights (mood, energy, body + energy chart) | `/insights`, insight card |
| 6 | Email reminders (period, ovulation, phase change) | settings + edge function |
| 7 | Irregularity alerts (short / long / variable / late cycles) | calm banner + cycle health |

Plus: JSON data export, one-tap full data deletion, NDPA-compliant consent record and
privacy policy, medical disclaimers on all insight surfaces, `prefers-reduced-motion`
support throughout.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 24 unit tests for the prediction engine
npm run build      # production build
```

On first run the app guides you through onboarding — or hit **“Try the demo”** to
explore with realistic sample data (a few logged cycles, including one longer cycle so
you can see how gently Ayomi flags irregularity).

### Demo mode vs. Supabase mode

The app works out of the box with **no configuration**: a `LocalStore` keeps data
privately in the browser (`localStorage`). To enable accounts, cross-device sync and
real email reminders, configure Supabase (below); `createStore()` switches
automatically when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are
present (see `.env.example`).

## The prediction engine

`lib/cycle/engine.ts` is a set of pure functions (every one takes `today` explicitly):

- **Phase boundaries** — ovulation ≈ 14 days before cycle end (clamped for very
  short/long cycles); menstrual = logged bleeding length; fertile window = ovulation −5 → +1.
- **Learning** — effective cycle/period length is the average of the last ≤ 4 logged
  cycles, falling back to the user's onboarding answers.
- **Predictions** — next 3 periods and their ovulations, for the calendar and countdown.
- **Irregularity detection** — flags cycles outside 21–35 days, high variance
  (recent range > 8 days), and periods 7+ days late, always with calm copy and a
  soft suggestion to see a doctor if the pattern persists.

Covered by 24 unit tests in `lib/cycle/engine.test.ts` (`npm test`).

## Design system (v2 — Burgundy & Cream)

60 % cream canvas · 30 % burgundy anchor · 10 % interactive phase colours.
Tokens live in `tailwind.config.ts`; glass-tile gradients, striped progress and
reduced-motion rules in `app/globals.css`.

| Token | Hex | Use |
|---|---|---|
| `cream` | `#F8F0E3` | canvas |
| `blush` | `#F2D6CF` | canvas gradient end |
| `surface` | `#FFFBF5` | pills, cards, inputs |
| `burgundy` / `deep` / `soft` | `#6D1A36` / `#3A0C1C` / `#9A3355` | brand, CTAs, anchor cards |
| `phase.menstrual` / `follicular` / `ovulation` / `luteal` | `#D6336C` / `#2BB3A3` / `#F2A33A` / `#9B7EDE` | tiles, calendar, dial |

Type: **Plus Jakarta Sans** (UI + tabular big numbers) with **Fraunces** for editorial
headings, loaded locally via Fontsource so the app never phones out for fonts. In a
networked environment you can swap to `next/font/google` in `app/layout.tsx`.

Signature components: semicircle **cycle dial** (tick marks, rose→amber arc, counting
cycle day), **2×2 glass phase tiles** (current phase enlarged, ringed, drifting glow),
**burgundy anchor insight card** with cream energy chart, **striped amber progress
bar**, **floating cream nav pill**, and calm pill **alert banners**. Motion follows the
guide — staggered fade-ups (60 ms / 500 ms, `cubic-bezier(.22,1,.36,1)`), 1.2 s dial
sweep, press → 0.97, and ambient loops disabled under `prefers-reduced-motion`.

## Supabase setup (accounts, sync, email reminders)

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (creates `profiles` +
   `cycles` with Row Level Security policies).
3. Copy `.env.example` → `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy the reminder function and schedule it daily (see the header comment in
   `supabase/functions/send-reminders/index.ts` for the `pg_cron` snippet). Set the
   `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` and `REMINDER_FROM_EMAIL` secrets.

## Deployment

The app is a static-friendly Next.js build; deploy to Vercel with the default
settings. Add the env vars above in the project settings to enable Supabase mode.

## Project structure

```
app/                  routes: /, /onboarding, /today, /calendar, /insights, /settings, /privacy
components/           dial, tiles, insight card, calendar, nav pill, alerts, chart, UI kit
lib/cycle/            pure prediction engine + phase content (unit-tested)
lib/store/            DataStore interface · LocalStore (demo) · SupabaseStore (RLS)
supabase/             migration + scheduled reminder edge function
```

## Notes & limitations

- Insights are educational only — a medical disclaimer is shown in onboarding and on
  every insight surface.
- In demo mode, reminder preferences are saved but no emails are sent (no backend).
- No symptom journaling, pregnancy mode, push notifications or payments — by design,
  per the v1 scope.
