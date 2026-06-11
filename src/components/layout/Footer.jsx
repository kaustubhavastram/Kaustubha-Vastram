import { useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();

  // Don't show footer on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <a href="/" className="nav__logo">
            Kaustubha <em>Vastram</em>
          </a>
          <p>Timeless dresses, made slowly and worn forever.</p>
        </div>
        <div className="footer__col">
          <h4>Shop</h4>
          <a href="#collection">All Dresses</a>
          <a href="#collection">New Arrivals</a>
          <a href="#collection">Evening</a>
        </div>
        <div className="footer__col">
          <h4>Help</h4>
          <a href="#">Shipping &amp; Returns</a>
          <a href="#">Size Guide</a>
          <a href="#">Contact</a>
        </div>
        <div className="footer__col">
          <h4>Follow</h4>
          <a href="#">Instagram</a>
          <a href="#">Pinterest</a>
          <a href="#">TikTok</a>
        </div>
      </div>
      <div className="footer__bottom">
        © 2026 Kaustubha Vastram — All rights reserved
      </div>
    </footer>
  );
}
