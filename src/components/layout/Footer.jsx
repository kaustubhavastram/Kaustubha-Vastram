import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();

  // Don't show footer on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/" className="nav__logo">
            Kaustubha <em>Vastram</em>
          </Link>
          <p>Every pleats holds a story within</p>
        </div>
        <div className="footer__col">
          <h4>Shop</h4>
          <a href="#collection">All Dresses</a>
          <a href="#collection">New Arrivals</a>
          <a href="#collection">Evening</a>
        </div>
        <div className="footer__col">
          <h4>Help</h4>
          <Link to="/shipping-returns">Shipping &amp; Returns</Link>
          <Link to="/size-guide">Size Guide</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="footer__col">
          <h4>Follow</h4>
          <a href="https://www.instagram.com/kaustubha_vastram/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="#">Pinterest</a>
          <a href="https://www.facebook.com/p/Kaustubha-Vastram-61591106364491/" target="_blank" rel="noopener noreferrer">Facebook</a>
        </div>
      </div>
      <div className="footer__bottom">
        © 2026 Kaustubha Vastram — All rights reserved
      </div>
    </footer>
  );
}
