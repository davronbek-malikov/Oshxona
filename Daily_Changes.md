# Oshxona — Daily Changes Log

---

## 2026-05-03

### Session goal: Milestone 1A — Prompts 0–4 (Project scaffold + Auth + App shell)

#### Completed ✅:
- [x] Prompt 1: Next.js 16 project init (TypeScript, Tailwind 4, App Router, src/)
- [x] Prompt 1: All dependencies installed (@supabase/supabase-js, @supabase/ssr, react-leaflet, leaflet, zod, react-hook-form, @hookform/resolvers, zustand, lucide-react, clsx, tailwind-merge, @radix-ui/react-slot)
- [x] Prompt 1: Folder structure created (components/layout, components/ui, lib/supabase, hooks, types, store)
- [x] Prompt 1: .env.local.example created with all placeholder keys
- [x] Prompt 1: Orange theme (#F97316) in globals.css + Inter font in layout.tsx + mobile-first max-width 640px
- [x] Prompt 1: components.json for shadcn + custom Button, Input, Card components
- [x] Prompt 2: supabase/migrations/0001_init.sql — all tables (users, restaurants, menu_items, orders, order_items, ratings), PostGIS, indexes, RLS policies, restaurants_near() function, pg_cron midnight reset
- [x] Prompt 2: supabase/migrations/0002_otps.sql — phone_otps table + hourly cleanup cron
- [x] Prompt 2: src/lib/supabase/client.ts + server.ts (browser + server Supabase clients with SSR cookies)
- [x] Prompt 2: src/types/database.ts — full typed Database interface (all 7 tables + Relationships + Views)
- [x] Prompt 2: supabase/seed.sql — 3 demo restaurants in Korea (Ansan, Dongdaemun, Itaewon) + 8 menu items each
- [x] Prompt 3: src/app/api/telegram/webhook/route.ts — receives /start <phone>, looks up OTP, sends code via Telegram Bot API
- [x] Prompt 3: src/app/api/auth/request-otp/route.ts — generates 6-digit code, saves to phone_otps, returns Telegram deep-link
- [x] Prompt 3: src/app/api/auth/verify-otp/route.ts — verifies code, upserts user, generates Supabase magic link session
- [x] Prompt 3: src/app/(auth)/login/page.tsx — phone + country picker (+82 Korea, +998 Uzbekistan, +7 Russia)
- [x] Prompt 3: src/app/(auth)/verify/page.tsx — 6-digit code inputs + Telegram deep-link button + 60s resend timer
- [x] Prompt 3: src/middleware.ts — protects /app/* routes, redirects unauthenticated → /login
- [x] Prompt 4: src/components/layout/AppShell.tsx — sticky header + content slot + bottom nav wrapper
- [x] Prompt 4: src/components/layout/BottomNav.tsx — 4 tabs (Menyu/Savat/Buyurtmalar/Profil), active tab = orange
- [x] Prompt 4: Stub pages: /menu, /cart, /orders, /profile, /dashboard (restaurant)
- [x] Prompt 4: EmptyCart + EmptyOrders components
- [x] Prompt 4: Profile page with language toggle + sign-out button
- [x] TypeScript: 0 errors, production build passing (14 routes)

---

### Manual steps YOU must do before testing:

1. **Create Supabase project** → https://supabase.com → New project
   - Copy `URL`, `anon key`, `service_role key` → paste into `.env.local` (copy from `.env.local.example`)
2. **Run migrations** in Supabase Dashboard → SQL Editor:
   - Paste and run `supabase/migrations/0001_init.sql`
   - Paste and run `supabase/migrations/0002_otps.sql`
3. **Run seed data** in Supabase SQL Editor:
   - Paste and run `supabase/seed.sql`
4. **Create Telegram bot**:
   - Open Telegram → search `@BotFather` → send `/newbot`
   - Choose a name (e.g. `OshxonaBot`) and username (e.g. `OshxonaKoreaBot`)
   - Copy the token → paste as `TELEGRAM_BOT_TOKEN` in `.env.local`
   - Also set `TELEGRAM_BOT_USERNAME` to your bot username (without @)
5. **Copy `.env.local.example` → `.env.local`** and fill in all values
6. **Start dev server**: `npm run dev` → open http://localhost:3000

### Telegram webhook setup (after Vercel deploy in Prompt 12):
```
https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://<your-app>.vercel.app/api/telegram/webhook
```
For local testing, use ngrok: `ngrok http 3000` then set webhook to the ngrok URL.

---

## Next session: Start from Prompt 5 (Restaurant onboarding)

### Prompt 5 checklist:
- Role picker page (customer vs restaurant owner)
- Multi-step restaurant onboarding (info → address/map → halal cert → bank info → photos → pending)
- /restaurant/dashboard (pending approval OR actual dashboard)
- /restaurant/menu page (CRUD menu items, toggle availability)
- react-hook-form + zod validation with Uzbek error messages
