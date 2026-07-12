-- Create trigger function to decrement product stock when an order is paid
CREATE OR REPLACE FUNCTION public.decrement_stock_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Trigger when order status transitions to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    FOR item IN 
      SELECT product_id, quantity 
      FROM public.order_items 
      WHERE order_id = NEW.id
    LOOP
      UPDATE public.products
      SET stock_quantity = GREATEST(0, stock_quantity - item.quantity)
      WHERE id = item.product_id AND stock_quantity IS NOT NULL;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS tr_decrement_stock_on_payment ON public.orders;
CREATE TRIGGER tr_decrement_stock_on_payment
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_stock_on_payment();
