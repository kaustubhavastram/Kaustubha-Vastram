-- ============================================================
-- Add product_code column to products table
-- A unique, admin-assigned identifier for each product
-- ============================================================

-- Add the column (nullable initially so existing rows aren't broken)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_code TEXT;

-- Create a unique index on product_code (NULLs are allowed but non-null values must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_code
  ON public.products (product_code)
  WHERE product_code IS NOT NULL;
