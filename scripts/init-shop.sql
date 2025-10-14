-- Initialize default shop for BMS uploads
-- Run this in your Supabase SQL Editor

-- Insert default shop
INSERT INTO shops (
  shop_id,
  name,
  address,
  city,
  state,
  postal_code,
  country,
  phone,
  email,
  website,
  is_active,
  created_at,
  updated_at
) VALUES (
  '8c1e007e-06c0-44d8-93ab-c4e91f39769e',
  'Default Collision Shop',
  '123 Main Street',
  'Vancouver',
  'BC',
  'V6B 1A1',
  'Canada',
  '604-555-1234',
  'info@collisionshop.com',
  'https://collisionshop.com',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (shop_id) DO NOTHING;

-- Also insert the development shop ID
INSERT INTO shops (
  shop_id,
  name,
  address,
  city,
  state,
  postal_code,
  country,
  phone,
  email,
  website,
  is_active,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Development Shop',
  '456 Dev Avenue',
  'Vancouver',
  'BC',
  'V6B 2B2',
  'Canada',
  '604-555-5678',
  'dev@collisionos.com',
  'https://dev.collisionos.com',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (shop_id) DO NOTHING;

-- Verify the shops were created
SELECT shop_id, name, city, is_active FROM shops;
