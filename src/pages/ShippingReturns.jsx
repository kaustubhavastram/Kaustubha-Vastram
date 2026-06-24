import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function ShippingReturns() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="info-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="info-page__breadcrumb">
          <Link to="/">Home</Link>
          <span className="info-page__breadcrumb-sep">›</span>
          <span>Shipping &amp; Returns</span>
        </nav>

        <header className="info-page__header">
          <p className="section__eyebrow">Policy</p>
          <h1 className="info-page__title">Shipping &amp; Returns</h1>
          <p className="info-page__subtitle">
            Everything you need to know about receiving your order.
          </p>
        </header>

        {/* Shipping Section */}
        <section className="info-page__section">
          <div className="info-page__icon-header">
            <span className="info-page__icon">📦</span>
            <h2>Shipping Information</h2>
          </div>
          <div className="info-page__card">
            <div className="info-page__grid-two">
              <div>
                <h3>Domestic Shipping</h3>
                <ul className="info-page__list">
                  <li>
                    <strong>Standard Delivery:</strong> 5–7 business days
                  </li>
                  <li>
                    <strong>Express Delivery:</strong> 2–3 business days
                  </li>
                  <li>
                    <strong>Free shipping</strong> on orders above ₹999
                  </li>
                </ul>
              </div>
              <div>
                <h3>Order Processing</h3>
                <ul className="info-page__list">
                  <li>Orders are processed within 1–2 business days</li>
                  <li>
                    You will receive a tracking number via email once shipped
                  </li>
                  <li>Deliveries are handled by our trusted courier partners</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* No Returns Policy */}
        <section className="info-page__section">
          <div className="info-page__icon-header">
            <span className="info-page__icon">🚫</span>
            <h2>Return &amp; Exchange Policy</h2>
          </div>
          <div className="info-page__card info-page__card--highlight">
            <div className="info-page__policy-badge">No Returns</div>
            <h3>All Sales Are Final</h3>
            <p>
              At Kaustubha Vastram, every garment is crafted with care and
              attention to detail. Due to the handcrafted nature of our products
              and to maintain the highest standards of hygiene and quality, we
              follow a <strong>strict no-return, no-exchange policy</strong>.
            </p>
            <p>
              We kindly request that you review the product details, size guide,
              and images carefully before placing your order.
            </p>
          </div>
        </section>

        {/* Exceptions */}
        <section className="info-page__section">
          <div className="info-page__icon-header">
            <span className="info-page__icon">⚠️</span>
            <h2>Exceptions</h2>
          </div>
          <div className="info-page__card">
            <p>
              While we do not accept returns or exchanges, we stand behind the
              quality of our products. In the rare event of the following, please
              contact us within <strong>48 hours</strong> of delivery:
            </p>
            <ul className="info-page__list info-page__list--spaced">
              <li>
                <strong>Damaged Product:</strong> If you receive a garment that
                is physically damaged or defective.
              </li>
              <li>
                <strong>Wrong Item:</strong> If the product delivered does not
                match what you ordered.
              </li>
              <li>
                <strong>Missing Items:</strong> If any items from your order are
                missing upon delivery.
              </li>
            </ul>
            <p className="info-page__note">
              Please include your order number, a clear photo of the issue, and a
              brief description when reaching out. We will review each case
              individually and work towards a fair resolution.
            </p>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="info-page__cta">
          <p>Have a question about your order?</p>
          <Link to="/contact" className="btn btn--dark">
            Contact Us
          </Link>
        </section>
      </div>
    </main>
  );
}
