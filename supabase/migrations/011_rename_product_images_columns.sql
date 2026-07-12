-- ============================================================
-- Rename columns in product_images to match frontend code
-- ============================================================

ALTER TABLE public.product_images 
  RENAME COLUMN url TO image_url;

ALTER TABLE public.product_images 
  RENAME COLUMN display_order TO sort_order;
