import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

export default function Header() {
  const { cartCount, openCart } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const location = useLocation();

  // Don't show main header on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  function handleCartClick() {
    openCart();
    setBump(true);
    setTimeout(() => setBump(false), 350);
  }

  function toggleMobile() {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.style.overflow = !mobileMenuOpen ? 'hidden' : '';
  }

  function closeMobile() {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  }

  return (
    <>
      <header className="header" id="header">
        <nav className="nav container">
          <button
            className="nav__toggle"
            onClick={toggleMobile}
            aria-label="Open menu"
          >
            <span></span><span></span><span></span>
          </button>

          <ul className={`nav__links${mobileMenuOpen ? ' open' : ''}`}>
            <li><a href="#collection" onClick={closeMobile}>Shop</a></li>
            <li><a href="#story" onClick={closeMobile}>Our Story</a></li>
            <li><a href="#lookbook" onClick={closeMobile}>Lookbook</a></li>
          </ul>

          <Link to="/" className="nav__logo">
            Kaustubha <em>Vastram</em>
          </Link>

          <div className="nav__actions">
            {user ? (
              <div className="nav__user-menu">
                <Link to="/profile" className="nav__action-link">
                  My Account
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="nav__action-link">
                    Admin
                  </Link>
                )}
                <button
                  className="nav__action-link"
                  onClick={signOut}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="nav__action-link"
                onClick={() => setAuthModalOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign In
              </button>
            )}
            <button
              className="cart-btn"
              onClick={handleCartClick}
              aria-label="Open cart"
            >
              Cart{' '}
              <span className={`cart-count${bump ? ' bump' : ''}`}>
                {cartCount}
              </span>
            </button>
          </div>
        </nav>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
