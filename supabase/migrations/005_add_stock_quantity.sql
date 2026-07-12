-- 5. Add stock_quantity column for inventory management
-- NULL = unlimited stock (backwards compatible with existing products)
-- 0 = out of stock (automatically treated as unavailable)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL;
