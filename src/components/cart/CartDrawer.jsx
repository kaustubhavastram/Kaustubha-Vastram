import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import CartItem from './CartItem';

export default function CartDrawer() {
  const { items, isOpen, closeCart, cartTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') closeCart();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  function handleCheckout() {
    closeCart();
    navigate('/checkout');
  }

  return (
    <>
      <div
        className={`overlay${isOpen ? ' open' : ''}`}
        onClick={closeCart}
      />
      <aside
        className={`cart${isOpen ? ' open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="cart__head">
          <h3>Your Cart</h3>
          <button
            className="cart__close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            &times;
          </button>
        </div>

        <div className="cart__items" id="cartItems">
          {items.length === 0 ? (
            <p className="cart__empty">Your cart is empty — for now.</p>
          ) : (
            items.map((item) => <CartItem key={item.id} item={item} />)
          )}
        </div>

        <div className="cart__foot">
          <div className="cart__total">
            <span>Subtotal</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <p className="cart__note">
            Shipping &amp; taxes calculated at checkout
          </p>
          <button
            className="btn btn--dark btn--full"
            onClick={handleCheckout}
            disabled={items.length === 0}
          >
            Checkout
          </button>
        </div>
      </aside>
    </>
  );
}
