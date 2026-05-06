-- ============================================================
-- Oshxona — Seed Data
-- 2 restaurants: Anor (Jinju) + Otash Qassob (Gimhae)
-- Run AFTER all migrations (0001, 0002, 0003)
-- ============================================================

-- Demo admin user
INSERT INTO users (id, phone, name, role, language)
VALUES ('00000000-0000-0000-0000-000000000001', '+821099999999', 'Admin', 'admin', 'uz')
ON CONFLICT (phone) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────
-- Restaurant 1: Anor — Jinju (진주시)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO users (id, phone, name, role, language)
VALUES ('00000000-0000-0000-0000-000000000010', '+821044444444', 'Anor Egasi', 'restaurant', 'uz')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO restaurants (
  id, owner_id, name_uz, name_en, description, address,
  location, phone, bank_name, bank_account_number, bank_account_holder,
  opening_time, closing_time, is_approved, is_active
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000010',
  'Anor',
  'Anor Restaurant',
  'Jinju shahridagi halol o''zbek oshxonasi. Tandirda pishirilgan somsa va kaboblar.',
  '경상남도 진주시 중앙로 100, Jinju',
  ST_MakePoint(128.1076, 35.1800)::geography,
  '+821044444444',
  '신한은행',
  '110-123-456789',
  'Anor Restaurant',
  '10:00',
  '21:00',
  true,
  true
);

INSERT INTO menu_items (restaurant_id, name_uz, name_en, description, category, price_krw, is_available)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Osh (Palov)',        'Uzbek Plov',       'An''anaviy o''zbek palovi. Sabzi, piyoz, mol go''shti va guruch.',        'osh',       12000, true),
  ('11111111-1111-1111-1111-111111111111', 'Shashlik',           'Shashlik',         'Qo''ychilik go''shtidan ko''mirda pishirilgan shashlik.',                  'kabob',     15000, true),
  ('11111111-1111-1111-1111-111111111111', 'Somsa',              'Samsa',            'Tandirda pishirilgan mol go''shtli somsa.',                               'somsa',      4000, true),
  ('11111111-1111-1111-1111-111111111111', 'Tovuq Kabob',        'Chicken Kebab',    'Baharatlangan tovuq, ko''mirda pishirilgan.',                             'tovuq',     13000, true),
  ('11111111-1111-1111-1111-111111111111', 'Lagmon',             'Lagman',           'Qo''lda tortilgan lagmon go''sht va sabzavotlar bilan.',                  'tovuq',     11000, true),
  ('11111111-1111-1111-1111-111111111111', 'Achichuk Salat',     'Achichuk Salad',   'Pomidor, bodring va piyozdan tayyorlangan o''zbek salati.',               'salat',      5000, true),
  ('11111111-1111-1111-1111-111111111111', 'Ko''k Choy',         'Green Tea',        'Yangi darvoza ko''k choy.',                                              'ichimlik',   2000, true),
  ('11111111-1111-1111-1111-111111111111', 'Halva',              'Halva',            'An''anaviy o''zbek halvasi yong''oq bilan.',                              'shirinlik',  3500, true);

-- ──────────────────────────────────────────────────────────────────
-- Restaurant 2: Otash Qassob — Gimhae (김해시)
-- ──────────────────────────────────────────────────────────────────
INSERT INTO users (id, phone, name, role, language)
VALUES ('00000000-0000-0000-0000-000000000020', '+821055555555', 'Otash Qassob Egasi', 'restaurant', 'uz')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO restaurants (
  id, owner_id, name_uz, name_en, description, address,
  location, phone, bank_name, bank_account_number, bank_account_holder,
  opening_time, closing_time, is_approved, is_active
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000020',
  'Otash Qassob',
  'Otash Qassob Grill',
  'Kimhe shahridagi eng yaxshi o''zbek kabob va go''shtli taomlar. Ochiq olovda pishirilgan.',
  '경상남도 김해시 가락로 55, Gimhae',
  ST_MakePoint(128.8897, 35.2285)::geography,
  '+821055555555',
  'KB국민은행',
  '004-12-345678',
  'Otash Qassob',
  '11:00',
  '22:00',
  true,
  true
);

INSERT INTO menu_items (restaurant_id, name_uz, name_en, description, category, price_krw, is_available)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'Qo''y Kabob',        'Lamb Kebab',       'Toza qo''ychilik go''shtidan ochiq olovda pishirilgan kabob.',            'kabob',     18000, true),
  ('22222222-2222-2222-2222-222222222222', 'Mol Kabob',          'Beef Kebab',       'Tanlab olingan mol go''shtdan tayyorlangan kabob.',                       'kabob',     16000, true),
  ('22222222-2222-2222-2222-222222222222', 'Lula Kabob',         'Lula Kebab',       'Qiyma qo''y go''shtdan tayyorlangan lula kabob.',                         'kabob',     15000, true),
  ('22222222-2222-2222-2222-222222222222', 'Tovuq Shashlik',     'Chicken Shashlik', 'Maxsus marinadda ushlangan tovuq shashlik.',                              'tovuq',     13000, true),
  ('22222222-2222-2222-2222-222222222222', 'Osh (Palov)',        'Uzbek Plov',       'Qo''ychilik go''shti bilan Fergʻona uslubidagi palov.',                   'osh',       13000, true),
  ('22222222-2222-2222-2222-222222222222', 'Tandir Non',         'Tandoor Bread',    'Tandirda pishirilgan yangi non — kabobga ajoyib qo''shiladi.',             'somsa',      2500, true),
  ('22222222-2222-2222-2222-222222222222', 'Ayraan',             'Ayran',            'Sovuq toza ayraan.',                                                     'ichimlik',   3000, true),
  ('22222222-2222-2222-2222-222222222222', 'Chak-chak',          'Chak-chak',        'Asal bilan qoplangan an''anaviy o''zbek shirinligi.',                     'shirinlik',  4000, true);
