import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../auth/AuthModal";
import logo from "../../logo/logo3.png";

export default function Header() {
  const { cartCount, openCart } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const location = useLocation();

  // Don't show main header on admin pages
  if (location.pathname.startsWith("/admin")) return null;

  function handleCartClick() {
    openCart();
    setBump(true);
    setTimeout(() => setBump(false), 350);
  }

  function toggleMobile() {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.style.overflow = !mobileMenuOpen ? "hidden" : "";
  }

  function closeMobile() {
    setMobileMenuOpen(false);
    document.body.style.overflow = "";
  }

  return (
    <>
      <header className="header" id="header">
        <nav className="nav container">
          {/* Hamburger — mobile only */}
          <button
            className="nav__toggle"
            onClick={toggleMobile}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          {/* Desktop nav links — hidden on mobile via CSS */}
          <ul className="nav__links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/#collection">Shop</Link>
            </li>
            <li>
              <Link to="/#story">Our Story</Link>
            </li>
            <li>
              <Link to="/#lookbook">Lookbook</Link>
            </li>
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
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="nav__action-link"
                onClick={() => setAuthModalOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
            )}
            {!isAdmin && (
              <button
                className="cart-btn"
                onClick={handleCartClick}
                aria-label="Open cart"
              >
                Cart{" "}
                <span className={`cart-count${bump ? " bump" : ""}`}>
                  {cartCount}
                </span>
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile slide-out menu — fully separate from header grid */}
      <div
        className={`mobile-menu${mobileMenuOpen ? " mobile-menu--open" : ""}`}
      >
        <div className="mobile-menu__backdrop" onClick={closeMobile} />
        <div className="mobile-menu__panel">
          <button
            className="mobile-menu__close"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            ✕
          </button>
          <div className="mobile-menu__brand">
            <img src={logo} alt="Kaustubha Vastram" className="mobile-menu__logo" />
            <span className="mobile-menu__brand-name">
              Kaustubha <em>Vastram</em>
            </span>
          </div>
          <ul className="mobile-menu__links">
            <li>
              <Link to="/" onClick={closeMobile}>Home</Link>
            </li>
            <li>
              <Link to="/#collection" onClick={closeMobile}>Shop</Link>
            </li>
            <li>
              <Link to="/#story" onClick={closeMobile}>Our Story</Link>
            </li>
            <li>
              <Link to="/#lookbook" onClick={closeMobile}>Lookbook</Link>
            </li>
          </ul>
          <div className="mobile-menu__divider" />
          <ul className="mobile-menu__links">
            {user ? (
              <>
                <li>
                  <Link to="/profile" onClick={closeMobile}>My Account</Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/admin" onClick={closeMobile}>Admin</Link>
                  </li>
                )}
                <li>
                  <button onClick={() => { signOut(); closeMobile(); }}>
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button onClick={() => { setAuthModalOpen(true); closeMobile(); }}>
                  Sign In
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
