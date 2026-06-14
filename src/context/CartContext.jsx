import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_PREFIX = 'kv_cart_';

const CartContext = createContext(null);

function getStorageKey(userId) {
  return userId ? `${STORAGE_PREFIX}${userId}` : null;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const prevUserIdRef = useRef(user?.id ?? null);

  const [items, setItems] = useState(() => {
    if (!user?.id) return [];
    try {
      const saved = localStorage.getItem(getStorageKey(user.id));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  // State for triggering the login prompt
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // When user changes (login/logout/switch account), load that user's cart or clear
  useEffect(() => {
    const prevUserId = prevUserIdRef.current;
    const currentUserId = user?.id ?? null;

    if (prevUserId !== currentUserId) {
      prevUserIdRef.current = currentUserId;

      if (currentUserId) {
        // User logged in — load their cart from localStorage
        try {
          const saved = localStorage.getItem(getStorageKey(currentUserId));
          setItems(saved ? JSON.parse(saved) : []);
        } catch {
          setItems([]);
        }
      } else {
        // User logged out — clear cart in memory
        setItems([]);
      }
    }
  }, [user]);

  // Persist to localStorage (only if user is logged in)
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(getStorageKey(user.id), JSON.stringify(items));
    }
  }, [items, user]);

  // Clean up old generic cart key from before this change
  useEffect(() => {
    localStorage.removeItem('me_cart_26');
  }, []);

  const addItem = useCallback((product) => {
    if (!user) {
      // Not logged in — show login prompt
      setShowLoginPrompt(true);
      return;
    }

    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const maxStock = product.stock_quantity;
      if (existing) {
        // Don't exceed stock limit
        if (maxStock != null && existing.qty >= maxStock) return prev;
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      // Don't add if stock is 0
      if (maxStock != null && maxStock <= 0) return prev;
      return [...prev, { ...product, qty: 1 }];
    });
  }, [user]);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQty = useCallback((id, delta) => {
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = item.qty + delta;
        if (newQty <= 0) return null;
        // Don't exceed stock limit
        const maxStock = item.stock_quantity;
        if (maxStock != null && newQty > maxStock) return item;
        return { ...item, qty: newQty };
      }).filter(Boolean);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const dismissLoginPrompt = useCallback(() => setShowLoginPrompt(false), []);

  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const value = {
    items,
    isOpen,
    cartCount,
    cartTotal,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    openCart,
    closeCart,
    showLoginPrompt,
    dismissLoginPrompt,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
