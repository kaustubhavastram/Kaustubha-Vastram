-- ============================================================
-- Update category check constraint for products
-- ============================================================

-- Drop the old constraint
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_category_check;

-- Add the new constraint with updated categories
ALTER TABLE public.products
  ADD CONSTRAINT products_category_check 
  CHECK (category IN ('saree', 'kurtha', 'lehenga'));
