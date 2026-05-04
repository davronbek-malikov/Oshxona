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

## 2026-05-04 — Milestone 1B (Prompts 5–7)

### Session goal: Restaurant onboarding + Customer discovery + Cart + Checkout

#### Completed ✅:

**Prompt 5 — Restaurant onboarding + menu management:**
- [x] `src/middleware.ts` — restored auth middleware (re-exports from proxy.ts)
- [x] `src/store/cart.ts` — Zustand cart store with localStorage persistence; one cart per restaurant, prompts clear if switching
- [x] `src/hooks/useCurrentUser.ts` — hook to get Supabase auth user mapped to `users` table row
- [x] `src/app/(app)/role-picker/page.tsx` — first-login role picker (customer vs restaurant owner), saves to `users.role` + localStorage flag
- [x] `src/app/(restaurant)/layout.tsx` — restaurant shell: header "Restoran Panel" + bottom nav (Panel / Menyu / Buyurtmalar / Profil)
- [x] `src/app/(restaurant)/onboarding/page.tsx` — 5-step onboarding with progress bar:
  - Step 1: Basic info (name UZ+EN, description, hours, phone)
  - Step 2: Location — Nominatim geocoding + draggable Leaflet pin
  - Step 3: Halal certificate upload → Supabase Storage `certificates` bucket
  - Step 4: Korean bank info (KB국민, 신한, 하나, 우리, 농협, 카카오뱅크, 토스뱅크, etc.)
  - Step 5: Restaurant photos (up to 5) → Supabase Storage `restaurants` bucket
  - Step 6: Success screen → redirect to dashboard
- [x] `src/components/map/LocationPicker.tsx` — Leaflet map (dynamic import, no SSR), draggable pin + click-to-place
- [x] `src/app/(restaurant)/dashboard/page.tsx` — real dashboard: no-restaurant → onboarding CTA; pending approval → amber notice; approved → stats card + quick action buttons + recent orders
- [x] `src/app/(restaurant)/orders/page.tsx` — order inbox with state-aware action buttons: confirm payment → start cooking → ready → delivered; cancel with confirm dialog
- [x] `src/app/(restaurant)/menu/page.tsx` — menu list grouped by category; toggle `is_available` (green/grey chip); toggle `sold_out_today` (red chip); delete item
- [x] `src/app/(restaurant)/menu/add/page.tsx` — add item form: name UZ+EN, category dropdown, price, photo upload → Supabase Storage `menu` bucket
- [x] `src/app/(restaurant)/profile/page.tsx` — profile with sign-out
- [x] `src/app/api/restaurant/route.ts` — POST: create or update restaurant row (upsert), sets `users.role = restaurant` on create
- [x] `src/app/api/restaurant/menu/route.ts` — POST: create menu item
- [x] `src/app/api/restaurant/menu/[id]/route.ts` — PATCH: update menu item; DELETE: remove menu item

**Prompt 6 — Customer discovery:**
- [x] `src/app/(app)/menu/page.tsx` — updated: browser geolocation with 8s timeout + Seoul fallback; calls `restaurants_near()` RPC (30 km radius); text search filter; list/map toggle; role-picker redirect for new users (localStorage flag); restaurant-owner redirect to `/restaurant/dashboard`
- [x] `src/components/restaurant/RestaurantCard.tsx` — card with photo, name, distance (m/km), open/closed badge, description, address
- [x] `src/components/map/RestaurantMap.tsx` — Leaflet map (dynamic import): orange dot for user location, restaurant markers with popup + "Menyuni ko'rish" link
- [x] `src/app/(app)/menu/[restaurantId]/page.tsx` — restaurant menu detail: sticky back-header with open/close status; search bar; category chips (Hammasi / Tovuq / Kabob / Somsa / Osh / Salat / Ichimlik / Shirinlik); sold-out grey overlay; cross-restaurant cart clear prompt; floating cart button when items added
- [x] `src/components/restaurant/MenuItemCard.tsx` — card with photo, name EN/UZ, description, price, +button; sold-out / unavailable states

**Prompt 7 — Cart + bank-transfer checkout:**
- [x] `src/app/(app)/cart/page.tsx` — real cart: item cards with +/− qty and × remove, subtotals, total, checkout CTA; empty state with "Menyuga qaytish"
- [x] `src/app/(app)/checkout/page.tsx` — checkout: order summary; pickup/delivery radio; optional delivery address + note; bank info panel (bank name, account number + **copy** button, exact amount + **copy** button, Uz+En instructions); optional receipt screenshot upload → Supabase Storage `receipts` bucket; "Yubordim / I have sent" button → POST `/api/orders`
- [x] `src/app/api/orders/route.ts` — POST: validates input (Zod), creates `orders` row (status = `pending_payment`) + `order_items` rows; rolls back order if items insert fails
- [x] `src/app/(app)/orders/[id]/page.tsx` — order tracking: 6-step status stepper (pending_payment → payment_claimed → payment_confirmed → preparing → ready → delivered); restaurant phone + call button; bank info shown while pending; order items breakdown; 10s status polling
- [x] `src/app/(app)/orders/page.tsx` — real orders list from DB with status badges, restaurant name, date, total; links to detail page
- [x] `src/components/layout/BottomNav.tsx` — cart icon now shows live item count badge (from Zustand store)

#### Manual Supabase steps needed:
1. Create storage buckets in Supabase Dashboard → Storage:
   - `certificates` (private)
   - `restaurants` (public) — allow authenticated users to upload
   - `menu` (public) — allow authenticated users to upload
   - `receipts` (private) — allow authenticated users to upload
2. Add storage RLS policies for `restaurants` and `menu` buckets:
   ```sql
   CREATE POLICY "auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'restaurants');
   CREATE POLICY "auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'menu');
   ```
3. Verify PostGIS `restaurants_near()` function exists (from 0001_init.sql)
4. Test: flip `is_approved = true` on a restaurant row to test dashboard activation

---

## Next session: Start from Prompt 8 (Real-time order flow)
