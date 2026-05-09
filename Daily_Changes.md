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

## 2026-05-04 — Milestone 1B (Prompts 5–7)

### Session goal: Restaurant onboarding + Customer discovery + Cart + Checkout

#### Completed ✅:

**Prompt 5 — Restaurant onboarding + menu management:**
- [x] `src/store/cart.ts` — Zustand cart store with localStorage persistence
- [x] `src/hooks/useCurrentUser.ts` — maps Supabase auth user to users table row
- [x] `src/app/(app)/role-picker/page.tsx` — first-login role picker (customer vs restaurant owner)
- [x] `src/app/restaurant/onboarding/page.tsx` — 5-step wizard: basic info, location (Leaflet), halal cert, bank account, photos
- [x] `src/components/map/LocationPicker.tsx` — draggable Leaflet pin + Nominatim geocoding
- [x] `src/app/restaurant/dashboard/page.tsx` — pending/approved states, stats, quick actions
- [x] `src/app/restaurant/orders/page.tsx` — order inbox with status progression buttons
- [x] `src/app/restaurant/menu/page.tsx` — menu list with availability toggles and delete
- [x] `src/app/restaurant/menu/add/page.tsx` — add menu item form with photo upload
- [x] API routes: /api/restaurant, /api/restaurant/menu, /api/restaurant/menu/[id]

**Prompt 6 — Customer discovery:**
- [x] `src/app/(app)/menu/page.tsx` — geolocation, restaurants_near() RPC, search, list/map toggle
- [x] `src/components/restaurant/RestaurantCard.tsx` — photo, name, distance, open/closed badge
- [x] `src/components/map/RestaurantMap.tsx` — Leaflet map with restaurant markers
- [x] `src/app/(app)/menu/[restaurantId]/page.tsx` — menu detail with category chips, search, cart integration

**Prompt 7 — Cart + checkout:**
- [x] `src/app/(app)/cart/page.tsx` — qty controls, subtotals, checkout CTA
- [x] `src/app/(app)/checkout/page.tsx` — bank transfer flow, receipt upload, order creation
- [x] `src/app/api/orders/route.ts` — Zod validation, creates order + order_items with rollback
- [x] `src/app/(app)/orders/[id]/page.tsx` — 6-step status stepper, bank info, items breakdown
- [x] `src/app/(app)/orders/page.tsx` — order history list with status badges

---

## 2026-05-05 — Milestone 1C (Real-time + Security)

### Completed ✅:

**Real-time order tracking:**
- [x] Supabase Realtime subscriptions on orders table (customer side — live status updates)
- [x] Supabase Realtime subscriptions on orders table (restaurant side — new order alerts)
- [x] Supabase Realtime on menu_items (sold-out/availability sync across sessions)
- [x] Audio alert (Web Audio API) when new order arrives on restaurant panel
- [x] `supabase/migrations/0003_realtime.sql` — enable realtime publications

**Security hardening:**
- [x] Orders API: prices verified server-side from menu_items (never trust client price)
- [x] Orders API: customer_id derived from auth session (never trust client body)
- [x] Orders API: delivery_address validated server-side when delivery_type = delivery
- [x] Menu item PATCH/DELETE: added restaurant ownership check (3-step: item → restaurant → user)
- [x] Restaurant profile POST: owner_id derived from session, not request body
- [x] OTP verify: 5-attempt lockout with 15-min cooldown + constant-time code comparison
- [x] Telegram webhook: X-Telegram-Bot-Api-Secret-Token header validation
- [x] AI search route: requires authenticated session
- [x] New API route: PATCH /api/restaurant/orders/[id] — ownership check + valid forward-only status transitions
- [x] ConfirmModal component — replaces window.confirm() (broken in PWA standalone mode)
- [x] Restaurant orders page: status updates go through new API route instead of direct Supabase client
- [x] tsconfig.json: exclude mobile/ directory from TypeScript compilation

**Admin panel:**
- [x] `src/app/admin/restaurants/page.tsx` — approve/reject pending restaurants
- [x] `src/app/api/admin/restaurants/[id]/route.ts` — admin-only PATCH endpoint

**Bug fixes:**
- [x] Restaurant pages stuck on "Yuklanmoqda": added userLoading to useEffect dependencies
- [x] ConfirmModal z-index raised to z-[62] (was z-50, same as BottomNav — buttons hidden)
- [x] Clear cart modal z-index fixed same way
- [x] AI search panel z-index fixed (backdrop z-[60], panel z-[61])

---

## 2026-05-06 — Milestone 1D (AI Search + i18n + PWA + Deploy)

### Completed ✅:

**AI Search Agent:**
- [x] `src/app/api/ai/search/route.ts` — auto-detects GROQ_API_KEY (Llama 3.3, free) or GOOGLE_GEMINI_API_KEY; structured JSON response with restaurant/menu matches
- [x] `src/components/ai/AISearchButton.tsx` — floating button, slide-up panel, text + voice input (Web Speech API), result cards
- [x] AI search added to /menu (restaurant list) and /menu/[restaurantId] (menu items)
- [x] Groq (console.groq.com) added as primary free AI provider; Gemini as fallback

**Uzbek/English i18n:**
- [x] `src/i18n/uz.ts` + `src/i18n/en.ts` — complete dictionaries (nav, shell, menu, cart, checkout, orders, profile, auth, ai)
- [x] `src/context/LanguageContext.tsx` — LanguageProvider + useLanguage() hook with t("dot.path") resolver
- [x] Language persisted to localStorage + synced to Supabase users.language
- [x] All customer pages updated to use t() translations
- [x] AppShell, BottomNav, orders, profile pages — fully translated

**PWA:**
- [x] `src/app/manifest.ts` — Next.js built-in PWA manifest served at /manifest.webmanifest
- [x] `public/sw.js` — service worker with stale-while-revalidate caching, push event handling
- [x] vercel.json — security headers, sw.js no-cache header

**Deployment:**
- [x] Deployed to Vercel: https://oshxona-fawn.vercel.app
- [x] All 11 env vars configured in Vercel
- [x] Telegram webhook registered with live URL + secret token
- [x] Auto-deploy on every git push to main ✅

---

## 2026-05-07 — Web Push Notifications + Order Status Toast

### Completed ✅:

**In-app Order Status Toast:**
- [x] `src/components/orders/OrderStatusToast.tsx` — gradient card slides up above nav on status change
- [x] Subscribes to all user's active orders via Supabase Realtime
- [x] Shows status emoji, restaurant name, order code, progress bar (5 steps)
- [x] Auto-dismisses after 6 seconds, tap navigates to order detail
- [x] Added to AppShell (visible on every page)

**Web Push Notifications:**
- [x] VAPID key pair generated and stored in env
- [x] `src/app/api/push/subscribe/route.ts` + `src/app/api/push/unsubscribe/route.ts`
- [x] `supabase/migrations/0005_push_subscriptions.sql` — push_subscriptions table
- [x] `src/lib/push.ts` — sendOrderStatusPush() utility using web-push
- [x] `src/hooks/usePushNotifications.ts` — subscribe/unsubscribe hook with permission states
- [x] Restaurant orders route sends push to customer after every status change
- [x] Profile page: toggle switch to enable/disable push notifications
- [x] Service worker updated: handles push events, shows notification, handles notificationclick

---

## 2026-05-08 — UI Redesign + Auth Flow

### Completed ✅:

**Complete UI redesign — Option A "Bold Clean":**
- [x] Theme color: orange (#F97316) → emerald green (#059669) throughout
- [x] Navigation: bottom bar → left sidebar (SideNav component, 68px wide)
- [x] Menu items: individual white cards → single white container with dividers (minimalistic)
- [x] Restaurant cards: text overlaid on photo with gradient, badges on image
- [x] Category filter: pill buttons → underline tab style (like YouTube/Baemin)
- [x] AI button: bigger 64×64px purple gradient square (not orange)
- [x] Search bar: borderless with soft shadow
- [x] Muted text: #AAAAAA (lighter, cleaner)
- [x] Background: #FAFAFA (near-white, not pure white)
- [x] Next.js "N" dev indicator hidden (devIndicators: false)

**Sign Up / Sign In flow:**
- [x] Login page redesigned: proper welcome screen with "Kirish" + "Ro'yxatdan o'tish" buttons
- [x] Verify page: smart redirect — new users → /setup-profile, returning users → /menu
- [x] New `src/app/(auth)/setup-profile/page.tsx` — name + language selection for new users
- [x] Progress indicator on setup-profile (3 steps visual)

---

## 2026-05-09 — Telegram OTP Fix + Deployment

### Completed ✅:

**Telegram OTP auto-send:**
- [x] Telegram webhook now saves telegram_user_id to users table on first /start
- [x] request-otp route checks for stored telegram_user_id → sends code directly to DM (automatic)
- [x] First login: user opens bot once → taps START → code arrives, Telegram ID saved
- [x] All logins after: code sent directly to Telegram DM, no user action needed

**Critical bug fix — Telegram deep link:**
- [x] Root cause: `+` in phone numbers was encoded as `%2B` by encodeURIComponent()
- [x] Telegram rejects `%` in start parameters — phone never reached the bot
- [x] Fix: strip `+` from phone in buildTelegramDeepLink(), restore in webhook handler
- [x] Verify page: shows green banner when code auto-sent, shows Telegram button + hint for first-timers

**Deployment finalized:**
- [x] Live URL: https://oshxona-fawn.vercel.app
- [x] NEXT_PUBLIC_APP_URL updated to live URL
- [x] Telegram webhook registered: {"ok":true,"result":true}
- [x] Auto-deploy working: every git push → Vercel deploys in ~1 min

---

## 2026-05-09 — Part 2: UX Improvements, UI Fixes, Logo, Deployment

### Completed ✅:

**Profile page — complete rewrite:**
- [x] Profile name editing was silently failing (RLS blocked direct Supabase update from client)
- [x] Created new `PATCH /api/user/profile` route using admin client — bypasses RLS
- [x] Added `displayName` local state — UI updates immediately after save without re-fetching
- [x] Language toggle: removed "uz" / "GB" text prefixes (Windows Chrome renders flag emoji as letter codes)
- [x] Language now shows plain "O'zbek" / "English" buttons — works on all platforms
- [x] Language change also persists to server via `/api/user/profile`
- [x] Avatar shows user's first initial letter instead of generic icon

**Buyurtmalar (Orders) empty state — smart recommendations:**
- [x] Created `SmartEmptyOrders` component with time + weather-based food suggestions
- [x] Uses Open-Meteo API (free, no API key) for real temperature data
- [x] Night time: warns about late eating, suggests light food (Mastava)
- [x] Cold weather (<10°C): recommends hot Osh, Somsa, Lag'mon
- [x] Hot weather (>25°C): recommends salads and drinks
- [x] Time-based defaults: morning → Somsa/Lag'mon, lunch → Osh/Kabob, evening → dinner suggestions
- [x] Fixed Buyurtmalar stuck on "Yuklanmoqda..." bug (missing `userLoading` guard in useEffect)

**Checkout page — 3 major improvements:**
- [x] Minimum order ₩15,000 for delivery (no minimum for pickup) — button disabled + warning shown
- [x] Yubordim button: requires receipt upload OR payment confirmation checkbox (no more silent submit)
- [x] Delivery address map: Nominatim geocodes address after 800ms pause, shows Leaflet mini-map
- [x] Created `DeliveryMap` component (dynamic import, no SSR)

**Navigation redesign — Coupang style:**
- [x] Removed left sidebar (SideNav) — replaced with bottom navigation
- [x] New BottomNav with custom SVG icons (HomeIcon, CartIcon, OrdersIcon, ProfileIcon)
- [x] Each icon has filled (active) and outline (inactive) variants
- [x] 62px height, subtle top shadow — matches Coupang Eats aesthetic
- [x] Renamed "Menyu" tab to "Oshxonalar" (Restaurants)
- [x] AppShell updated: uses BottomNav, pb-[78px] to clear nav, full-width content

**Restaurant onboarding fix:**
- [x] Yuborish button was silently failing — `user` null due to RLS mismatch on users table
- [x] Removed `if (!user) return` silent guard
- [x] Removed `owner_id` from client body (API derives from auth session server-side)
- [x] Added inline red error box below Yuborish button — shows exact API error if fails
- [x] `POST /api/restaurant`: completely rewrote to derive owner from session, removed owner_id from schema

**Restaurant cards redesign:**
- [x] Replaced tall gradient-overlay cards with compact horizontal list style
- [x] 88×88px thumbnail on left, restaurant info on right
- [x] Open/closed badge top-right, distance below name
- [x] Light green gradient placeholder when no photo (matches app theme)
- [x] Much more compact: shows 5-6 restaurants on screen vs 2 before
- [x] View toggle redesigned: cleaner pill-style tabs

**Logo integration:**
- [x] AppShell header: logo slot (56×56px, rounded-2xl, orange glow shadow)
- [x] Login welcome screen: large 144px logo centered, visible immediately on first visit
- [x] Loads `/new_logo.png` (uploaded by developer) with SVG + emoji fallback chain
- [x] Text visibility fixed: subtitle #888 (was #BBBBBB), description #666
- [x] Login page buttons: h-56px, border-2 inputs, better error display (red box)

**Deployment:**
- [x] GitHub repo changed from private → public (was blocking Vercel deployments)
- [x] All builds now deploy successfully: 35 routes, 0 TypeScript errors
- [x] Triggered redeploy after repo made public
- [x] Live at: https://oshxona-fawn.vercel.app ✅

---

## Current State (2026-05-09 — End of Day)

### Live at: https://oshxona-fawn.vercel.app

### Working features ✅:
- Phone OTP login via Telegram (automatic after first use — telegram_user_id saved)
- Sign Up / Sign In flow with profile setup page for new users
- Profile name editing (server-side via /api/user/profile — RLS bypassed)
- Restaurant discovery with compact horizontal cards (list + map view)
- Menu browsing with underline category filter tabs
- AI Search with voice input (Groq Llama 3.3, free)
- Add to cart, checkout with bank transfer + receipt or checkbox confirmation
- Minimum order ₩15,000 for delivery (no minimum for pickup)
- Delivery address mini-map (Nominatim geocoding + Leaflet)
- Real-time order tracking (Supabase Realtime)
- In-app order status toast banner (above bottom nav)
- Web Push Notifications (HTTPS only — works on Vercel)
- Restaurant owner dashboard, order management (via secure API route), menu CRUD
- Restaurant onboarding: Yuborish button fixed (owner_id server-side, error shown inline)
- Admin restaurant approval panel (/admin/restaurants)
- Uzbek/English language switching (persisted to DB + localStorage)
- PWA installable on mobile home screen
- Coupang-style bottom navigation (SVG icons, 4 tabs)
- Smart empty orders: time + weather-based food recommendations
- Custom Oshxona logo (new_logo.png) in header and login screen

### Environment variables (all set in Vercel):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN          = @mazali_oshxonabot
TELEGRAM_BOT_USERNAME
TELEGRAM_WEBHOOK_SECRET     = (generated)
GROQ_API_KEY                = (free AI search)
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
OTP_DELIVERY                = telegram
NEXT_PUBLIC_APP_URL         = https://oshxona-fawn.vercel.app
```

### Supabase (project: oknohxorqzwdhskvrhpu):
- Migrations run: 0001_init, 0002_otps, 0003_realtime, 0005_push_subscriptions
- Storage buckets: receipts (private), restaurants (public), certificates (private), menu (public)
- Storage policies: allow_auth_upload, allow_public_read, allow_auth_read_private
- Seed data: 2 test restaurants (Anor in Jinju, Otash Qassob in Gimhae)

### Known limitations / next improvements:
- Telegram OTP: first login requires user to open bot once (Telegram platform limitation)
- SMS fallback ready (Solapi integration built, needs API key + OTP_DELIVERY=sms)
- Push notifications: HTTPS only (works on Vercel, not localhost)
- PWA icons (icon-192.png, icon-512.png): placeholder only
- No pagination on admin restaurants or orders lists
- No commission/billing system (manually approve paying restaurants)
- Restaurant menu page: delete uses confirm() — should use ConfirmModal

### Git log (recent commits):
```
04bb9f7 ci: trigger redeploy — repo is now public
dae0dca feat: use new_logo.png as app logo in header and login screen
2c10676 feat: bigger logo in header, logo on login screen, fix text visibility
23ecdfc fix: compact horizontal restaurant cards + logo.png support
1f98f31 fix: restaurant card redesign — clean info below photo, no dark overlay
bd1f4b4 fix: onboarding Yuborish silent failure
d80530b feat: Coupang nav, logo, onboarding fix, smart orders, profile fix
c3d1b17 docs: update Daily_Changes.md
8eb832a fix: Telegram deep link + sign breaking OTP delivery
43866f8 feat: auto-send OTP directly to Telegram DM
8a944c9 feat: UI redesign, Sign Up/In flow, Groq AI, sidebar nav, green theme
0ef81c6 feat: live order status notifications (in-app banner + Web Push)
de0cba4 feat: Milestone 1C+1D — real-time orders, AI search, i18n, PWA, security hardening
```
