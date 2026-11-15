-- BETina on Telegram: second round of selfies (tier 1) and special photos
-- (tier 2), generated with her Soul model and approved by Dejan on 2026-11-15.
-- Files: bucket telegram-photos; originals in marketing/telegram-fotos/runde2.

insert into public.telegram_photos (key, category, tier, note, path) values
  ('selfie-gym', 'selfie', 1, 'a selfie in the gym after your workout, lime green sports top, ponytail, a little flushed', 'selfie-gym.jpg'),
  ('selfie-buch', 'selfie', 1, 'you on the balcony holding an open book up in front of you, cream cardigan, only your smile showing above it', 'selfie-buch.jpg'),
  ('selfie-cafe', 'selfie', 1, 'a selfie at a street café, beige trench coat, cappuccino in your hand, sunglasses in your hair', 'selfie-cafe.jpg'),
  ('selfie-blazer', 'selfie', 1, 'a mirror selfie in a black blazer over a white top, ready for a meeting', 'selfie-blazer.jpg'),
  ('selfie-wein', 'selfie', 1, 'a selfie in your kitchen in the evening with a glass of red wine, grey blouse', 'selfie-wein.jpg'),
  ('selfie-laufen', 'selfie', 1, 'a selfie on your morning run in the park, black running jacket, earbuds in', 'selfie-laufen.jpg'),
  ('selfie-zug', 'selfie', 1, 'a selfie on the train by the window, beige turtleneck, head leaning on your hand', 'selfie-zug.jpg'),
  ('selfie-rooftop', 'selfie', 1, 'a selfie on a rooftop at dusk, dark green dress with thin straps, the city behind you', 'selfie-rooftop.jpg'),
  ('selfie-bademantel', 'selfie', 1, 'a selfie fresh out of the shower, white bathrobe, hair in a towel', 'selfie-bademantel.jpg'),
  ('selfie-nacht', 'selfie', 1, 'a late-night selfie on your bed, oversized white shirt, chin on your hand, bedside lamp on', 'selfie-nacht.jpg'),
  ('special-segeln', 'special', 2, 'a selfie on a sailing boat, white bikini top under an open checked shirt, sunglasses, the sea behind you', 'special-segeln.jpg'),
  ('special-liege', 'special', 2, 'a selfie on a sun lounger by the pool in a red bikini top, sunglasses in your hair', 'special-liege.jpg'),
  ('special-lagune', 'special', 2, 'a selfie standing in turquoise water in an emerald green bikini, wet hair', 'special-lagune.jpg'),
  ('special-strandbar', 'special', 2, 'you at a beach bar in a white bikini top and a colourful sarong, cocktail in your hand', 'special-strandbar.jpg'),
  ('special-handtuch', 'special', 2, 'you lying on a beach towel in a black bikini top, chin on your hand, sunglasses in your hair', 'special-handtuch.jpg'),
  ('special-infinity', 'special', 2, 'you in an infinity pool at sunset in a lime green bikini, looking back over your shoulder', 'special-infinity.jpg'),
  ('special-yacht', 'special', 2, 'a selfie on a yacht in a navy bikini top and a white captain cap', 'special-yacht.jpg'),
  ('special-haengematte', 'special', 2, 'you in a hammock under palm trees in a coral bikini top, one hand in your hair', 'special-haengematte.jpg'),
  ('special-meer', 'special', 2, 'you laughing in the sea in a white bikini top, wet hair', 'special-meer.jpg'),
  ('special-hotelbalkon', 'special', 2, 'you on a hotel balcony above the sea, black bikini top under an open white shirt, iced coffee in your hand, eyes closed in the sun', 'special-hotelbalkon.jpg')
on conflict (key) do nothing;
