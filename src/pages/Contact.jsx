import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sendContactEmail } from "../lib/emailService";

/* ================================================================
   EDITABLE CONTACT INFORMATION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Update the values below to change what appears on the contact page.
   All fields are optional — set any to "" or null to hide that item.
   ================================================================ */

const CONTACT_INFO = {
  phone: "+91 98765 43210",
  email: "hello@kaustubhavastram.com",
  whatsapp: "+91 98765 43210", // WhatsApp number (set to "" to hide)
  address: {
    line1: "Kaustubha Vastram",
    line2: "123, Silk Bazaar Road",
    city: "Kanchipuram",
    state: "Tamil Nadu",
    pincode: "631501",
    country: "India",
  },
  // Set any social link to "" to hide it
  socials: {
    instagram: "https://instagram.com/kaustubhavastram",
    pinterest: "",
    facebook: "",
  },
  businessHours: {
    weekdays: "10:00 AM – 7:00 PM",
    saturday: "10:00 AM – 5:00 PM",
    sunday: "Closed",
  },
  // A short note shown below contact details
  note: "We typically respond within 24 hours. For urgent queries, please reach out via WhatsApp.",
};

/* ================================================================ */

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSending(true);

    try {
      await sendContactEmail(formData);
      setSubmitted(true);
    } catch (err) {
      console.error("Contact form error:", err);
      setError("Failed to send your message. Please try again or contact us directly via email.");
    } finally {
      setSending(false);
    }
  }

  const addr = CONTACT_INFO.address;
  const fullAddress = [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.pincode}`, addr.country]
    .filter(Boolean)
    .join("\n");

  return (
    <main className="info-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="info-page__breadcrumb">
          <Link to="/">Home</Link>
          <span className="info-page__breadcrumb-sep">›</span>
          <span>Contact</span>
        </nav>

        <header className="info-page__header">
          <p className="section__eyebrow">Get in Touch</p>
          <h1 className="info-page__title">Contact Us</h1>
          <p className="info-page__subtitle">
            We'd love to hear from you. Reach out with questions, feedback, or
            just to say hello.
          </p>
        </header>

        <div className="contact__layout">
          {/* Contact Details */}
          <aside className="contact__details">
            {/* Phone */}
            {CONTACT_INFO.phone && (
              <div className="contact__detail-item">
                <span className="contact__detail-icon">📞</span>
                <div>
                  <h3>Phone</h3>
                  <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`}>
                    {CONTACT_INFO.phone}
                  </a>
                </div>
              </div>
            )}

            {/* WhatsApp */}
            {CONTACT_INFO.whatsapp && (
              <div className="contact__detail-item">
                <span className="contact__detail-icon">💬</span>
                <div>
                  <h3>WhatsApp</h3>
                  <a
                    href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {CONTACT_INFO.whatsapp}
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {CONTACT_INFO.email && (
              <div className="contact__detail-item">
                <span className="contact__detail-icon">✉️</span>
                <div>
                  <h3>Email</h3>
                  <a href={`mailto:${CONTACT_INFO.email}`}>
                    {CONTACT_INFO.email}
                  </a>
                </div>
              </div>
            )}

            {/* Address */}
            {addr.line1 && (
              <div className="contact__detail-item">
                <span className="contact__detail-icon">📍</span>
                <div>
                  <h3>Visit Us</h3>
                  <address style={{ fontStyle: "normal", whiteSpace: "pre-line" }}>
                    {fullAddress}
                  </address>
                </div>
              </div>
            )}

            {/* Business Hours */}
            {CONTACT_INFO.businessHours && (
              <div className="contact__detail-item">
                <span className="contact__detail-icon">🕐</span>
                <div>
                  <h3>Business Hours</h3>
                  <ul className="contact__hours">
                    <li>
                      <span>Mon – Fri</span>
                      <span>{CONTACT_INFO.businessHours.weekdays}</span>
                    </li>
                    <li>
                      <span>Saturday</span>
                      <span>{CONTACT_INFO.businessHours.saturday}</span>
                    </li>
                    <li>
                      <span>Sunday</span>
                      <span>{CONTACT_INFO.businessHours.sunday}</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Socials */}
            {Object.values(CONTACT_INFO.socials).some(Boolean) && (
              <div className="contact__detail-item">
                <span className="contact__detail-icon">🌐</span>
                <div>
                  <h3>Follow Us</h3>
                  <div className="contact__socials">
                    {CONTACT_INFO.socials.instagram && (
                      <a
                        href={CONTACT_INFO.socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Instagram
                      </a>
                    )}
                    {CONTACT_INFO.socials.pinterest && (
                      <a
                        href={CONTACT_INFO.socials.pinterest}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Pinterest
                      </a>
                    )}
                    {CONTACT_INFO.socials.facebook && (
                      <a
                        href={CONTACT_INFO.socials.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Facebook
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Note */}
            {CONTACT_INFO.note && (
              <p className="contact__note">{CONTACT_INFO.note}</p>
            )}
          </aside>

          {/* Contact Form */}
          <div className="contact__form-wrap">
            <div className="info-page__card">
              <h2>Send Us a Message</h2>
              {error && (
                <div className="contact__error">{error}</div>
              )}
              {submitted ? (
                <div className="contact__success">
                  <span className="contact__success-icon">✓</span>
                  <h3>Thank you!</h3>
                  <p>
                    Your message has been received. We'll get back to you within
                    24 hours.
                  </p>
                  <button
                    className="btn btn--outline"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", subject: "", message: "" });
                    }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form className="contact__form" onSubmit={handleSubmit}>
                  <div className="contact__form-row">
                    <div className="contact__form-group">
                      <label htmlFor="contact-name">Your Name *</label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="contact__form-group">
                      <label htmlFor="contact-email">Email Address *</label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="contact__form-group">
                    <label htmlFor="contact-subject">Subject</label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What's this about?"
                    />
                  </div>
                  <div className="contact__form-group">
                    <label htmlFor="contact-message">Message *</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help…"
                      rows="5"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn--dark btn--full" disabled={sending}>
                    {sending ? "Sending…" : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
