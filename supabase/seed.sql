-- ============================================================
-- Oshxona — Seed Data
-- 3 demo restaurants in Korea + 8 menu items each
-- Run AFTER 0001_init.sql and 0002_otps.sql
-- ============================================================

-- Seed a demo admin user (update phone to your real number)
INSERT INTO users (id, phone, name, role, language)
VALUES
  ('00000000-0000-0000-0000-000000000001', '+821099999999', 'Admin', 'admin', 'uz')
ON CONFLICT (phone) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- Restaurant 1: Ansan (large Uzbek community area)
-- ──────────────────────────────────────────────────────────
INSERT INTO users (id, phone, name, role, language)
VALUES ('00000000-0000-0000-0000-000000000010', '+821011111111', 'Ansan Restoran Egasi', 'restaurant', 'uz')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO restaurants (id, owner_id, name_uz, name_en, description, address,
  location, phone, bank_name, bank_account_number, bank_account_holder,
  opening_time, closing_time, is_approved, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000010',
  'Toshkent Oshxonasi',
  'Tashkent Kitchen',
  'Ansan shahridagi eng mashhur halol o''zbek oshxonasi. Tandirda pishirilgan taomlar.',
  '안산시 단원구 원곡동 793, Gyeonggi-do',
  ST_MakePoint(126.8117, 37.3219)::geography,
  '+821011111111',
  'KB국민은행',
  '1234567890',
  'Kim Uzbek',
  '10:00',
  '22:00',
  true,
  true
);

INSERT INTO menu_items (restaurant_id, name_uz, name_en, description, category, price_krw)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Osh (Palov)', 'Uzbek Plov', 'An''anaviy o''zbek palovi. Sabzi, piyoz, go''sht va guruch.', 'osh', 12000),
  ('11111111-1111-1111-1111-111111111111', 'Kabob', 'Kebab', 'Qo''lda tayyorlangan kabob, ko''mirda pishirilgan.', 'kabob', 15000),
  ('11111111-1111-1111-1111-111111111111', 'Somsa', 'Samsa', 'Tandirda pishirilgan go''shtli somsa.', 'somsa', 4000),
  ('11111111-1111-1111-1111-111111111111', 'Tovuq Shashlik', 'Chicken Shashlik', 'Tovuq go''shtidan tayyorlangan shashlik.', 'tovuq', 13000),
  ('11111111-1111-1111-1111-111111111111', 'Achichuk Salat', 'Achichuk Salad', 'Pomidor, piyoz va ziravorlardan tayyorlangan salat.', 'salat', 5000),
  ('11111111-1111-1111-1111-111111111111', 'Choy', 'Green Tea', 'Ko''k choy yoki qora choy.', 'ichimlik', 2000),
  ('11111111-1111-1111-1111-111111111111', 'Lagmon', 'Lagman', 'Qo''lda tayyorlangan lagmon qozon go''sht bilan.', 'tovuq', 11000),
  ('11111111-1111-1111-1111-111111111111', 'Halva', 'Halva', 'An''anaviy o''zbek halvasi.', 'shirinlik', 3000);

-- ──────────────────────────────────────────────────────────
-- Restaurant 2: Dongdaemun (Seoul city center)
-- ──────────────────────────────────────────────────────────
INSERT INTO users (id, phone, name, role, language)
VALUES ('00000000-0000-0000-0000-000000000020', '+821022222222', 'Seoul Restoran Egasi', 'restaurant', 'uz')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO restaurants (id, owner_id, name_uz, name_en, description, address,
  location, phone, bank_name, bank_account_number, bank_account_holder,
  opening_time, closing_time, is_approved, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000020',
  'Samarqand Taomi',
  'Samarkand Foods',
  'Seul markazida halol o''zbek taomlari. Samarqand uslubidagi palov va kaboblar.',
  'Dongdaemun-gu, Seoul',
  ST_MakePoint(127.0397, 37.5744)::geography,
  '+821022222222',
  '신한은행',
  '9876543210',
  'Park Uzbek',
  '11:00',
  '23:00',
  true,
  true
);

INSERT INTO menu_items (restaurant_id, name_uz, name_en, description, category, price_krw)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Samarqand Palovi', 'Samarkand Plov', 'Samarqand uslubida pishirilgan maxsus palov.', 'osh', 13000),
  ('22222222-2222-2222-2222-222222222222', 'Lula Kabob', 'Lula Kebab', 'Qiyma go''shtdan tayyorlangan lula kabob.', 'kabob', 16000),
  ('22222222-2222-2222-2222-222222222222', 'Tandir Non', 'Tandoor Bread', 'Tandirda pishirilgan yangi non.', 'somsa', 2000),
  ('22222222-2222-2222-2222-222222222222', 'Tovuq Kabob', 'Chicken Kebab', 'Baharatli tovuq kabob.', 'tovuq', 14000),
  ('22222222-2222-2222-2222-222222222222', 'Toshkent Salati', 'Tashkent Salad', 'Mol go''shti va qovurilgan tuxum bilan salat.', 'salat', 7000),
  ('22222222-2222-2222-2222-222222222222', 'Limonad', 'Lemonade', 'Tabiiy limondan tayyorlangan limonad.', 'ichimlik', 4000),
  ('22222222-2222-2222-2222-222222222222', 'Manti', 'Manti Dumplings', 'Go''shtli manti, qaymaq bilan.', 'tovuq', 12000),
  ('22222222-2222-2222-2222-222222222222', 'Chak-chak', 'Chak-chak', 'Asal bilan qoplab tayyorlangan chak-chak.', 'shirinlik', 5000);

-- ──────────────────────────────────────────────────────────
-- Restaurant 3: Itaewon (international district Seoul)
-- ──────────────────────────────────────────────────────────
INSERT INTO users (id, phone, name, role, language)
VALUES ('00000000-0000-0000-0000-000000000030', '+821033333333', 'Itaewon Restoran Egasi', 'restaurant', 'uz')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO restaurants (id, owner_id, name_uz, name_en, description, address,
  location, phone, bank_name, bank_account_number, bank_account_holder,
  opening_time, closing_time, is_approved, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000030',
  'O''rta Osiyo Halol Oshxona',
  'Central Asia Halal Kitchen',
  'Itaewon halol hududida joylashgan o''zbek va o''rta osiyo taomlari restoran.',
  'Itaewon-dong, Yongsan-gu, Seoul',
  ST_MakePoint(126.9944, 37.5340)::geography,
  '+821033333333',
  '하나은행',
  '5555555555',
  'Lee Uzbek',
  '12:00',
  '22:30',
  true,
  true
);

INSERT INTO menu_items (restaurant_id, name_uz, name_en, description, category, price_krw)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'Qozon Kabob', 'Kazan Kebab', 'Qozonda pishirilgan go''shtli kabob sabzavotlar bilan.', 'kabob', 18000),
  ('33333333-3333-3333-3333-333333333333', 'Fergʻona Palovi', 'Fergana Plov', 'Anʼanaviy Fergʻona uslubidagi qoʻychilik go''shti bilan palov.', 'osh', 14000),
  ('33333333-3333-3333-3333-333333333333', 'Patir Somsa', 'Patir Samsa', 'Patir non ichiga go''sht solingan somsa.', 'somsa', 5000),
  ('33333333-3333-3333-3333-333333333333', 'Tovuq Palov', 'Chicken Plov', 'Tovuq go''shti bilan yengil palov.', 'tovuq', 11000),
  ('33333333-3333-3333-3333-333333333333', 'Vinegret', 'Vinaigrette Salad', 'Lavlagi, kartoshka va sabzavotlardan salat.', 'salat', 6000),
  ('33333333-3333-3333-3333-333333333333', 'Qimiz', 'Kumiss', 'An''anaviy fermentlangan qimiz (bayram ichimlik).', 'ichimlik', 6000),
  ('33333333-3333-3333-3333-333333333333', 'Dimlama', 'Dimlama Stew', 'Go''sht va sabzavotlardan qozon dimlama.', 'kabob', 13000),
  ('33333333-3333-3333-3333-333333333333', 'Nisholda', 'Nisholla', 'Tuxum oqi va sharbatdan tayyorlangan o''zbek dessert.', 'shirinlik', 4000);
