# Oshxona — Master Plan

A Halal Uzbek food marketplace for the Uzbek diaspora in Korea. Connects customers with nearby Uzbek restaurants, supports bank-transfer payment, includes an AI search agent (text + voice) in Uzbek / Korean / English / Russian, and uses real-time menu availability sync.

---

## 1. Core Features (Revised)

### For Customers
- **Phone signup** with OTP (free via Telegram bot — see auth section)
- **Auto-detect location** → list + map of nearest Halal Uzbek restaurants
- **Browse menu** with photos, prices in ₩, categories (tovuq, kabob, somsa, osh, salat, ichimlik)
- **AI search agent** — type or speak in Uzbek/Korean/English/Russian: *"menga arzon palov toping"* → AI returns matching dishes from nearby restaurants
- **Real-time availability** — sold-out items grey out instantly without page refresh
- **Order flow with bank transfer** — see total + restaurant's bank account → transfer via their banking app → upload receipt screenshot or confirm "sent" → restaurant verifies and starts cooking
- **Track order status** live (pending payment → payment confirmed → cooking → ready → delivered)
- **Order history + ratings**
- **Language toggle** (Uzbek default, English secondary; Korean & Russian later)

### For Restaurants
- **Phone signup** with OTP
- **Profile setup** — name, address (map pin), photos, halal certificate upload, bank account info
- **Menu management** — add/edit/delete dishes, upload photos, set price, mark "available" or "sold out for today"
- **Daily auto-reset** — at midnight, all "sold out today" items reset to available (so they don't have to remember to toggle each day)
- **Order inbox** — receive orders with sound notification, see customer phone number
- **Payment verification flow** — customer claims they transferred → restaurant checks their bank app → marks "payment received" → starts cooking
- **Order timeline** — pending payment → confirmed → preparing → ready → delivered
- **Daily/weekly earnings summary**
- **Customer ratings + comments**

### For Admin (you)
- Approve/reject restaurant signups (verify halal certificate)
- Ban abusive users
- View platform-wide stats

### Phase 2 (Later)
- Your own delivery network with drivers
- Loyalty points / referral codes
- Group orders for offices
- Catering for events
- Promo codes

### Phase 3 (Later)
- More AI agents: menu translator, demand prediction, auto customer support
- iOS/Android native apps via Capacitor

---

## 2. Tech Stack — All FREE Tier

| Layer | Tool | Free Tier Limits | Notes |
|---|---|---|---|
| Frontend | Next.js 15 + TypeScript + Tailwind + shadcn/ui | unlimited | Single codebase, PWA installable on phones |
| Hosting | **Vercel** | 100 GB bandwidth/mo, unlimited deploys | Auto-deploy from GitHub, free SSL |
| Database + Auth + Storage | **Supabase** | 500 MB DB, 50K MAU, 1 GB storage, real-time included | Postgres + PostGIS for geo-queries |
| Phone OTP | **Telegram Bot** (custom) | UNLIMITED & FREE | Uzbeks heavily use Telegram. We build a bot that sends OTP codes. Bypasses Twilio costs. |
| Maps | **Leaflet + OpenStreetMap** | UNLIMITED & FREE | No API key needed, works globally |
| Geocoding | **Nominatim** (OSM) | Free with rate limit | Convert address ↔ lat/lng |
| AI Chat (search agent) | **Google Gemini API (Flash)** | Free tier: 1500 req/day, 1M tokens/min | Multilingual native, fast |
| Speech-to-Text | **Web Speech API** (browser built-in) | UNLIMITED & FREE | Supports Korean, English, Russian, partial Uzbek |
| Image storage | Supabase Storage | 1 GB free | Menu photos, receipt screenshots |
| Push notifications | **Web Push API** + service worker | FREE | Works on PWA without app store |
| Domain (optional) | `.vercel.app` subdomain | FREE | Custom domain ~$10/year if you want one later |

**Total monthly cost: $0** until you exceed free tiers (which happens around 5,000+ active users).

### Why Telegram bot for OTP
- Uzbeks in Korea use Telegram daily — natural channel
- Costs nothing vs Twilio's ~$0.05 per Korean SMS
- Two flows possible:
  1. User opens Telegram → starts our bot → bot returns a 6-digit code → user types in app
  2. User types phone → app sends Telegram bot deep-link → user clicks → auto-verifies
- We will use flow 2 for best UX

---

## 3. Database Schema (Supabase / Postgres)

```sql
-- Users (customers + restaurant owners)
users (
  id uuid PK,
  phone text UNIQUE,
  telegram_user_id bigint UNIQUE,
  name text,
  role text CHECK (role IN ('customer', 'restaurant', 'admin')),
  language text DEFAULT 'uz',
  created_at timestamptz DEFAULT now()
)

-- Restaurants
restaurants (
  id uuid PK,
  owner_id uuid FK -> users,
  name_uz text, name_en text,
  description text,
  address text,
  location geography(POINT),  -- PostGIS for "nearest" queries
  phone text,
  bank_name text,
  bank_account_number text,
  bank_account_holder text,
  halal_cert_url text,
  photos text[],
  opening_time time, closing_time time,
  is_approved bool DEFAULT false,
  is_active bool DEFAULT true,
  created_at timestamptz DEFAULT now()
)

-- Menu items
menu_items (
  id uuid PK,
  restaurant_id uuid FK,
  name_uz text, name_en text,
  description text,
  category text CHECK (category IN ('tovuq','kabob','somsa','osh','salat','ichimlik','shirinlik')),
  price_krw int,
  photo_url text,
  is_available bool DEFAULT true,  -- toggled by restaurant
  sold_out_today bool DEFAULT false,  -- auto-resets at midnight
  created_at timestamptz DEFAULT now()
)

-- Orders
orders (
  id uuid PK,
  customer_id uuid FK,
  restaurant_id uuid FK,
  status text CHECK (status IN (
    'pending_payment','payment_claimed','payment_confirmed',
    'preparing','ready','delivered','cancelled'
  )),
  total_krw int,
  delivery_type text CHECK (delivery_type IN ('pickup','delivery')),
  delivery_address text,
  delivery_lat float, delivery_lng float,
  customer_note text,
  payment_receipt_url text,  -- screenshot uploaded by customer
  created_at timestamptz DEFAULT now()
)

order_items (
  id uuid PK,
  order_id uuid FK,
  menu_item_id uuid FK,
  quantity int,
  price_at_order int  -- snapshot of price
)

ratings (
  id uuid PK,
  order_id uuid FK UNIQUE,
  customer_id uuid FK,
  restaurant_id uuid FK,
  stars int CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
)
```

**Important:** Enable Row-Level Security (RLS) so customers only see their own orders, restaurants only see orders for their own restaurant, etc.

---

## 4. Build Order — 12 Steps

Each step is independent and testable. Each has a ready-made prompt you can paste into Claude Code in VS Code.

| # | Step | Outcome |
|---|---|---|
| 1 | Project setup | Next.js + Tailwind + shadcn/ui running, GitHub connected |
| 2 | Supabase setup | Database, tables, RLS, seed data |
| 3 | Telegram OTP bot | Auth working without paying for SMS |
| 4 | App layout + navigation | Bottom nav working (Menu / Cart / Orders / Profile) |
| 5 | Restaurant onboarding | Owner can sign up, add restaurant, upload menu |
| 6 | Customer discovery | Location + nearby restaurants list + map |
| 7 | Cart + bank-transfer checkout | Place order, see bank info, upload receipt |
| 8 | Real-time order flow | Live status updates for customer + restaurant |
| 9 | Real-time menu availability | Sold-out syncs everywhere instantly |
| 10 | AI search agent (text + voice) | Multilingual food search via Gemini + Web Speech |
| 11 | i18n (Uzbek + English) | Language toggle working |
| 12 | Deploy to Vercel | Live PWA, custom domain optional |

---

## 5. Step-by-Step Prompts for Claude Code

> **How to use:** Open Claude Code in VS Code, paste the prompt for the step you're on. After it finishes, test it, then move to the next prompt. Each prompt is self-contained so the agent has full context.

### 📌 Prompt 0 — Bootstrap context (paste FIRST, once)

```
You are helping me build "Oshxona," a Halal Uzbek food marketplace for the Uzbek diaspora in Korea.

Read the file PLAN.md in the project root for full context — it contains the feature list, tech stack, database schema, and step-by-step build order. Refer to it as the source of truth.

Important constraints:
- Everything must use FREE tiers only (Vercel, Supabase free, Telegram bot for OTP, OpenStreetMap, Gemini free tier).
- Tech stack: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase.
- The app must be SIMPLE for non-technical users (elderly Uzbeks). Big buttons, big text, photos, minimal forms.
- Phone-only login, never email.
- Match the visual style of the Chicken House mock the user shared: orange accent (#F97316), white background, rounded cards, bottom nav with 4 items (Menyu / Savat / Buyurtmalar / Profil).

When in doubt, ask me a question instead of guessing. After each step, summarize what you did and what to test.
```

---

### 📌 Prompt 1 — Project setup

```
Goal: Initialize the Next.js project for Oshxona.

Tasks:
1. Create a fresh Next.js 15 project with TypeScript, Tailwind CSS, App Router, ESLint, src/ directory.
2. Install and configure shadcn/ui with the orange theme (primary color #F97316).
3. Install: @supabase/supabase-js, @supabase/ssr, lucide-react, react-leaflet, leaflet, zod, react-hook-form.
4. Set up folder structure:
   - src/app/ (pages)
   - src/components/ (reusable UI)
   - src/lib/ (supabase client, utils)
   - src/hooks/
   - src/types/
5. Create .env.local.example with placeholders for:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - TELEGRAM_BOT_TOKEN
   - GOOGLE_GEMINI_API_KEY
6. Add a basic global layout with the orange theme and the Inter font.
7. Initialize git, create .gitignore (include .env.local).
8. Commit: "chore: initial Next.js setup".

Acceptance: `npm run dev` opens a blank welcome page on http://localhost:3000 with no errors.
```

---

### 📌 Prompt 2 — Supabase setup

```
Goal: Set up the Supabase database for Oshxona.

Read PLAN.md section 3 (Database Schema) carefully. Create a SQL migration file at supabase/migrations/0001_init.sql that:

1. Enables the postgis extension.
2. Creates all tables exactly as specified in PLAN.md: users, restaurants, menu_items, orders, order_items, ratings.
3. Adds indexes:
   - GIST index on restaurants.location
   - btree index on menu_items.restaurant_id
   - btree index on orders.customer_id, orders.restaurant_id, orders.status
4. Enables Row-Level Security on all tables and adds policies:
   - users: a user can read/update their own row
   - restaurants: anyone can read approved+active rows; owner can update their own
   - menu_items: anyone can read items of approved restaurants; owner can CRUD their own
   - orders: customer can read/insert their own; restaurant owner can read/update orders for their restaurant
   - ratings: anyone can read; only the order's customer can insert (and only after delivered)
5. Creates a Postgres function `restaurants_near(lat float, lng float, radius_km int)` that returns approved+active restaurants ordered by distance.
6. Creates a daily cron (using pg_cron, available on Supabase) that resets all `menu_items.sold_out_today` to false at midnight Korea time (KST = UTC+9).

Also:
7. Create src/lib/supabase/client.ts (browser client) and src/lib/supabase/server.ts (server client) using @supabase/ssr.
8. Add seed data file supabase/seed.sql with 3 demo restaurants in Seoul (Ansan, Dongdaemun, Itaewon areas), each with 8 menu items in different categories.

Tell me clearly what manual steps I need to do in the Supabase dashboard (creating the project, running the migration, copying keys to .env.local).

Acceptance: I can run the migration, run the seed, and query restaurants_near(37.5665, 126.9780, 10) and get rows back.
```

---

### 📌 Prompt 3 — Telegram OTP bot

```
Goal: Build phone authentication using a free Telegram bot instead of paid SMS.

Architecture:
- User enters their phone number in our app.
- Our app generates a one-time code, stores it in a `phone_otps` table with phone + code + expires_at (5 min).
- App shows the user a "Open Telegram" button with a deep link: https://t.me/<our_bot>?start=<phone>
- User opens Telegram, hits Start, our bot replies "Your Oshxona code is: 123456".
- User types code into our app → we verify against the table → create/find a row in `users` and issue a Supabase session.

Tasks:
1. Add migration 0002_otps.sql:
   - phone_otps table (id, phone, code, expires_at, used bool, created_at)
   - clean up older than 1 hour automatically via a cron
2. Create the Telegram bot:
   - Tell me how to create one via @BotFather and where to put the token in .env.local
   - Build a webhook endpoint at src/app/api/telegram/webhook/route.ts that:
     - Listens for /start <phone> messages
     - Looks up the latest OTP for that phone, sends it to the user via the Telegram Bot API
     - Marks the OTP as "delivered"
3. Build src/app/(auth)/login/page.tsx — phone input with country picker (default +82 Korea, also +998 Uzbekistan), big buttons, Uzbek/English labels.
4. Build src/app/(auth)/verify/page.tsx — 6-digit code input with auto-submit, "Open Telegram" deep-link button, resend after 60s.
5. Build src/app/api/auth/request-otp/route.ts — POST { phone } → generate code, save row, return Telegram deep-link.
6. Build src/app/api/auth/verify-otp/route.ts — POST { phone, code } → verify, upsert user, create Supabase session via admin API.
7. Add an auth middleware that protects /app/* routes.

Acceptance: I can enter my phone, click "Open Telegram", get the code in our bot, type it back, and land on a home page logged in.

Tell me exactly what manual setup I need (create bot via BotFather, set webhook URL, etc).
```

---

### 📌 Prompt 4 — App layout and navigation

```
Goal: Build the main app shell that matches the Chicken House mock from the user's screenshots.

Visual reference (from user's screenshots):
- Header: small orange icon + "Oshxona" + tagline "Mazali halol taomlar" in grey
- Bottom nav: 4 tabs with icons + labels — Menyu (home), Savat (cart), Buyurtmalar (orders), Profil
- Active tab: orange icon and label
- Inactive tabs: grey
- Content area: white background, rounded cards, generous padding

Tasks:
1. Create src/components/layout/AppShell.tsx with the header + content slot + bottom nav.
2. Create src/components/layout/BottomNav.tsx using Next.js usePathname to highlight the active tab.
3. Create stub pages:
   - src/app/(app)/menu/page.tsx
   - src/app/(app)/cart/page.tsx
   - src/app/(app)/orders/page.tsx
   - src/app/(app)/profile/page.tsx
4. Create empty state components: EmptyCart, EmptyOrders that match the mock (centered icon, message, CTA button "Menyuga qaytish" / "Back to menu").
5. Build a top-level role router: after login, if user.role === 'restaurant' → redirect to /restaurant/dashboard; else show customer app.
6. Make everything responsive but mobile-first (max width 640px centered on desktop).
7. Use minimum 18px font size everywhere, 48px tap targets.

Acceptance: I can navigate between the 4 tabs, see the empty states correctly, and the design visually matches the user's mock screenshots.
```

---

### 📌 Prompt 5 — Restaurant onboarding

```
Goal: Let restaurant owners sign up and manage their restaurant + menu.

Tasks:
1. After login, if the user has no role yet, show a role-picker page: "Men mijozman / I'm a customer" or "Men restoran egasiman / I'm a restaurant owner". Save the choice to users.role.
2. If they pick restaurant owner, route them through onboarding:
   - Step A: Restaurant info — name (Uzbek + English), description, opening hours
   - Step B: Address — text input + map (Leaflet + OpenStreetMap) where they pin their location. Use Nominatim for geocoding the typed address as a starting point.
   - Step C: Halal certificate — upload image to Supabase Storage bucket "certificates" (private)
   - Step D: Bank info — bank name (dropdown of Korean banks: KB국민, 신한, 하나, 우리, 농협, 카카오뱅크, 토스뱅크), account number, account holder name
   - Step E: Photos — upload up to 5 restaurant photos to Storage bucket "restaurants" (public)
   - Step F: "Sent for approval" screen
3. Build src/app/(restaurant)/dashboard/page.tsx — shows pending approval message OR the dashboard if approved.
4. Build src/app/(restaurant)/menu/page.tsx — list of menu items with toggle for is_available, button to mark "Sold out today", and add/edit/delete actions.
5. Add-item form: name (Uz + En), description, category dropdown, price in ₩, photo upload.
6. All forms use react-hook-form + zod validation, with Uzbek error messages.

Acceptance:
- I can log in as a restaurant owner, fill out onboarding, see "pending approval".
- After I manually flip is_approved=true in Supabase, dashboard becomes visible.
- I can add 3 menu items with photos and they show in my menu list.
- I can toggle "Sold out today" and the database updates.
```

---

### 📌 Prompt 6 — Customer discovery (home + map + nearby)

```
Goal: Customer home page with nearest restaurants based on geolocation.

Tasks:
1. On /menu page, request browser geolocation. If denied, fall back to a default location (Seoul City Hall) and show a banner "Joylashuvga ruxsat bering / Please enable location".
2. Call the Postgres RPC restaurants_near(lat, lng, 10) and render restaurants as cards with: photo, name (Uz), distance in km, average rating.
3. Add a tab toggle at top: "Ro'yxat / List" and "Xarita / Map". Map view uses Leaflet + OpenStreetMap with a marker per restaurant + popup with name + "View menu" button.
4. Tapping a restaurant card → /menu/[restaurantId]/page.tsx → shows the restaurant header, opening status (open/closed based on current time), and full menu grouped by category with the same card style as the mock screenshot (image, name, description, price, + button).
5. Sold-out items appear greyed out with "Bugun tugagan / Sold out today" badge and the + button is disabled.
6. Search bar at top of the menu page (we'll wire AI later — for now, simple text filter on item name).
7. Category chips below search: Hammasi / Tovuq / Kabob / Somsa / Osh / Salat / Ichimlik (matching mock screenshot exactly).

Acceptance:
- I can see real seeded restaurants sorted by distance from my location.
- I can switch between list and map view.
- I can open a restaurant's menu and see all items with the right styling.
- Sold-out items are visually different.
```

---

### 📌 Prompt 7 — Cart + bank-transfer checkout

```
Goal: Customer can add items to cart, checkout, and submit a bank-transfer order.

Important: NO Stripe / no payment gateway. Pure bank transfer:
- Customer sees the restaurant's bank info on checkout page.
- Customer transfers via their banking app.
- Customer uploads receipt screenshot OR taps "I have transferred" button.
- Order goes to status "payment_claimed".
- Restaurant verifies in their bank app, marks "payment_confirmed", starts cooking.

Tasks:
1. Cart state: store in localStorage + Zustand (install zustand). One cart per restaurant — if customer adds items from a different restaurant, prompt to clear the existing cart.
2. /cart page: list items with quantity +/- and remove, total in ₩, "Buyurtma berish / Place order" button. If empty, show the EmptyCart empty state.
3. /checkout page:
   - Delivery type radio: "Olib ketish / Pickup" or "Yetkazib berish / Delivery"
   - If delivery, address input + map pin + customer note textarea
   - Show order summary
   - Show "Toleshov / Payment" section with restaurant's bank name, account number (with copy button), account holder name, and the EXACT amount (with copy button)
   - Show instructions in Uz + En: "1. Bank ilovasidan o'tkazma qiling. 2. Skrinshot yuklang yoki 'Yubordim' tugmasini bosing."
   - File upload (optional): payment receipt screenshot to Storage bucket "receipts"
   - Big "Yubordim / I have sent" button → creates the order with status='payment_claimed'
4. After order created → /orders/[id] page showing the order with current status.
5. Build the order creation API route at src/app/api/orders/route.ts that creates the order + order_items + uploads receipt.

Acceptance:
- I can add items, see the cart, go through checkout, see real bank info from the restaurant, upload a fake receipt, submit, and land on the order tracking page.
- Restaurant logged in on another browser sees the new order in their inbox.
```

---

### 📌 Prompt 8 — Real-time order flow

```
Goal: Both customer and restaurant see live order status updates without refresh.

Tasks:
1. Set up a Supabase real-time subscription helper at src/hooks/useRealtimeOrders.ts that subscribes to changes in the `orders` table for the current user (customer subscribes to orders.customer_id = me; restaurant subscribes to orders.restaurant_id = my_restaurant).
2. Customer side — /orders page lists active orders with a stepper showing the current status: pending_payment → payment_claimed → payment_confirmed → preparing → ready → delivered.
3. Customer order detail page shows the same stepper + estimated time + restaurant phone (so customer can call) + map showing restaurant location.
4. Restaurant side — /restaurant/orders page shows incoming orders sorted by created_at DESC. Each card shows customer name, phone, items list, total, and the action buttons relevant to current status:
   - payment_claimed → "View receipt" + "To'lov tasdiqlandi / Confirm payment"
   - payment_confirmed → "Tayyorlamoqda / Start cooking" (sets to preparing)
   - preparing → "Tayyor / Ready"
   - ready → "Yetkazildi / Delivered"
   - any active state → "Bekor qilish / Cancel" (with confirmation)
5. Browser sound notification when a new order arrives (use a small mp3 in public/sounds/).
6. Web Push notifications: register service worker, request permission on login, send push when new order arrives. Use the Web Push protocol (free, no third party).

Acceptance:
- Customer places order → restaurant sees it appear in their inbox within 1-2 seconds without refreshing.
- Restaurant clicks "Confirm payment" → customer's tracking page updates the stepper instantly.
- Sound plays + push notification fires for restaurant on new order.
```

---

### 📌 Prompt 9 — Real-time menu availability sync

```
Goal: When a restaurant marks an item sold out (or it auto-decrements to zero stock), all customers viewing that menu see it grey out instantly.

Tasks:
1. On the customer menu page (/menu/[restaurantId]), add a real-time subscription to changes in `menu_items` where restaurant_id matches.
2. When an UPDATE event fires, mutate the local React state to reflect new is_available / sold_out_today values.
3. Restaurant menu page already has the toggle from Prompt 5 — make sure it broadcasts via Supabase real-time (which happens automatically with RLS-permitted updates).
4. Add a small "Live" indicator (green dot) on the customer menu page to signal real-time is active.
5. Bonus: when a customer adds an item to cart, store a "tentative reservation" in a transient way (just a UI toast: "Tezroq bo'ling, faqat 3 ta qoldi" if you later want stock counts — out of scope for MVP, but leave a TODO comment).

Acceptance:
- I open customer menu in one browser, restaurant dashboard in another. I toggle "sold out" on an item. Within 1-2 seconds the customer browser greys it out. No refresh.
```

---

### 📌 Prompt 10 — AI search agent (text + voice)

```
Goal: A floating "AI yordamchi / AI helper" button. User clicks → opens chat. User types or speaks (in Uzbek, Korean, English, or Russian). AI returns matching dishes from nearby restaurants with deep-links to add to cart.

Tasks:
1. Add a floating action button on the menu page bottom-right: 🎤 icon, orange.
2. Tapping it opens a bottom sheet with a chat UI:
   - Mic button (uses Web Speech API: webkitSpeechRecognition / SpeechRecognition) — auto-detect language or let user pick from chips: 🇺🇿 / 🇰🇷 / 🇬🇧 / 🇷🇺
   - Text input alternative
   - Submit → call /api/ai/search
3. Build src/app/api/ai/search/route.ts:
   - Receives { query, language, location }
   - Fetches all available menu_items from approved restaurants within 10km of user's location (limit 200 items)
   - Calls Google Gemini Flash with a structured prompt:
     - System: "You are a food recommendation assistant for Oshxona, a Halal Uzbek food app. The user message may be in Uzbek, Korean, Russian, or English. Match their request to the menu items provided. Return JSON: { reply: string in user's language, recommendations: [{ menu_item_id, reason }] }"
     - User context: list of menu items as JSON
     - User query: their message
   - Validates the response with zod, returns to client
4. Render results: AI's text reply + a horizontal scrollable list of dish cards. Each card has a "Savatga qo'shish / Add to cart" button.
5. Handle errors gracefully — if Gemini fails, fall back to simple keyword search on the menu items.
6. Voice STT: use the browser's built-in Web Speech API. Free, no API key, works for ko-KR, en-US, ru-RU well; uz-UZ has limited support, fall back to typing if it fails.

Acceptance:
- I tap the AI button, say "shashlik топ / find me shashlik" (in any of 4 languages), and the AI replies in my language with a list of matching kabob dishes from nearby restaurants. I can add one to cart with one tap.
- Test all 4 languages with text input.
- The Gemini API stays within the free tier (1500 req/day).

Tell me how to get a free Gemini API key from Google AI Studio.
```

---

### 📌 Prompt 11 — Internationalization (Uzbek + English)

```
Goal: Full Uzbek + English support with a language toggle.

Tasks:
1. Install next-intl. Set up two locales: 'uz' (default) and 'en'.
2. Create messages/uz.json and messages/en.json with all UI strings used so far. Audit every component and replace hardcoded strings with t('key').
3. Add a language toggle in the Profile page: "O'zbekcha / English". Persist choice in users.language and in localStorage.
4. Auto-detect on first visit: if user's phone country code is +998, default to Uzbek; if +82, default to English (Korean Uzbeks often prefer English UI even if they speak Uzbek). Allow override.
5. Use the language preference when calling the AI agent so it knows what language to reply in.

Acceptance:
- I switch from Uzbek to English in profile and every screen instantly flips.
- New users default to Uzbek if their phone is +998.
- AI agent replies in the user's chosen language.
```

---

### 📌 Prompt 12 — Deploy to Vercel (free) + final polish

```
Goal: Get Oshxona live on the internet, free.

Tasks:
1. Push the repo to GitHub.
2. Create a Vercel account, import the repo, configure all environment variables from .env.local.
3. Set up the Supabase production project (separate from dev): run migrations, set storage bucket policies.
4. Update the Telegram bot webhook to point to https://<your-app>.vercel.app/api/telegram/webhook.
5. Add a manifest.json + service worker to make the app installable as a PWA on phones (so users can "Add to home screen").
6. Add app icons (512x512 + 192x192) — generate orange "Oshxona" icons.
7. Add SEO meta tags + OpenGraph image for sharing in Telegram/KakaoTalk.
8. Add a /admin route protected to admin role only with: list of pending restaurant approvals + button to approve/reject + view of platform stats.
9. Final accessibility pass: large fonts, keyboard navigation, color contrast.
10. Run lighthouse audit, fix any critical issues.

Tell me exactly what manual steps I need to do (Vercel signup, GitHub push, env setup, domain, etc).

Acceptance:
- The app is live at https://<my-project>.vercel.app
- I can install it as a PWA on my phone home screen
- A friend with a Korean phone number can sign up via Telegram OTP and place an order on a real seeded restaurant
- All free-tier limits respected
```

---

## 6. After-MVP Roadmap

Once the 12 steps are done and tested with real users, in order of impact:

1. **More AI agents:** menu translator (Uzbek menus auto-translated to Korean), customer support FAQ bot, daily demand prediction for restaurants
2. **Your own delivery network:** add a `drivers` table, driver app, dispatch logic, driver earnings
3. **Marketing tools:** promo codes, referral links, restaurant analytics dashboard
4. **Native apps:** wrap the PWA in Capacitor, publish to App Store + Play Store
5. **Russian + Korean i18n:** add the other two languages
6. **Group orders + catering**

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Bank transfer disputes (customer says they paid, didn't) | Receipt screenshot upload + restaurant manual verification + rating system penalizes fraud |
| Supabase free tier hits limit | Monitor usage in dashboard; optimize queries; upgrade only when revenue justifies |
| Telegram bot gets banned | Have a fallback: WhatsApp OTP via Twilio (paid, but only as backup) |
| Gemini free tier exhausted | Fall back to keyword search; or switch to Groq Llama (also free) |
| Few restaurants at launch | Personally onboard 5-10 restaurants in Ansan/Dongdaemun before public launch |
| Customers don't trust new app | Show halal certificates prominently, real photos, real ratings, easy refund policy |

---

## 8. Daily Workflow with Claude Code

1. Open VS Code, open the Oshxona folder
2. Open Claude Code panel
3. Paste **Prompt 0** once at start of each session (gives context)
4. Paste the prompt for the step you're on
5. When the agent is done, test the acceptance criteria
6. Commit to git: `git commit -m "step N: <what was built>"`
7. Move to next prompt

If something breaks, ask Claude Code: "Read PLAN.md, then investigate why X is broken in step N."

---

*Last updated: 2026-05-03*
