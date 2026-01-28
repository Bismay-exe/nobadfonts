-- Run this in the Supabase Dashboard SQL Editor to remove broken fonts
DELETE FROM fonts WHERE id IN (
  '85934bf7-f1f9-41e1-ae07-1968b8a2ae92', -- Roboto
  '38e773d1-f1d4-4821-a778-b1371a0064f9', -- Playfair Display
  'af52fb5d-dfa8-4990-9ed8-2dfa0663c1cc', -- Oswald
  '7f336e33-2859-4dfe-94c0-d68976907292', -- Pacifico
  '16744708-553b-4866-9e10-c3839829a7dc', -- Skybold
  '88c2cbed-5774-45e9-9b70-33996e178cba', -- Skybold
  '61a54e74-0011-4993-b999-738cd5ce51b0', -- Skybold
  '2c2c145d-d26d-4275-910a-5155770de35f', -- Skybold
  'f94a6b3f-8ee7-450a-a9a7-96c9410bf5f6', -- Skybold
  '4222913d-cfc6-4a12-bab6-1dd85a7de002', -- Skybold
  '813eaa97-8fe0-4d39-a09a-fbf804eef95c', -- The Last Trunk
  '7128cffb-6bfe-446d-8dab-f7f708dd7c43', -- Gendy
  '8ce348a2-c644-497c-866f-9b983cd1b049'  -- SpaceMono
);
