-- BETina on Telegram: the first selfies (tier 1) and special photos (tier 2),
-- generated with her Soul model and approved by Dejan on 2026-11-14.
-- Files: bucket telegram-photos; originals in marketing/telegram-fotos.

insert into public.telegram_photos (key, category, tier, note, path) values
  ('selfie-kaffee', 'selfie', 1, 'a selfie in your kitchen in the morning, lime green tee, coffee mug at your face', 'selfie-kaffee.jpg'),
  ('selfie-auto', 'selfie', 1, 'a selfie in the car, sunglasses pushed up in your hair, white tee', 'selfie-auto.jpg'),
  ('selfie-sofa', 'selfie', 1, 'a cosy selfie on the sofa in the evening, big grey sweater, hand in your hair', 'selfie-sofa.jpg'),
  ('selfie-bett', 'selfie', 1, 'a good-morning selfie from bed, white tee, messy hair on the pillow', 'selfie-bett.jpg'),
  ('selfie-abend', 'selfie', 1, 'a selfie on the street in the evening, black top, ready to go out', 'selfie-abend.jpg'),
  ('selfie-balkon', 'selfie', 1, 'a selfie on the balcony at sunset, summer dress, cold drink in your hand', 'selfie-balkon.jpg'),
  ('special-strand', 'special', 2, 'a beach selfie in a black bikini top, the turquoise sea behind you', 'special-strand.jpg'),
  ('special-pool', 'special', 2, 'you in the pool in a lime green bikini, arms folded on the edge, wet hair', 'special-pool.jpg'),
  ('special-sonnenhut', 'special', 2, 'you sitting on the beach in a black bikini and a straw sun hat', 'special-sonnenhut.jpg'),
  ('special-sonnenuntergang', 'special', 2, 'you at the beach at sunset in a bikini top, looking back over your shoulder', 'special-sonnenuntergang.jpg')
on conflict (key) do nothing;
