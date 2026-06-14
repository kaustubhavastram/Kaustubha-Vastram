import { useCart } from '../../context/CartContext';
import AuthModal from '../auth/AuthModal';

/**
 * A global component that shows the AuthModal whenever an unauthenticated
 * user tries to add an item to the cart. Reads showLoginPrompt from CartContext.
 */
export default function LoginPrompt() {
  const { showLoginPrompt, dismissLoginPrompt } = useCart();

  return (
    <AuthModal
      isOpen={showLoginPrompt}
      onClose={dismissLoginPrompt}
      message="Please sign in to add items to your cart"
    />
  );
}
