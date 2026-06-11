import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setMessage("You're in! Welcome to the inner circle.");
    setEmail('');
    setTimeout(() => setMessage(''), 4000);
  }

  return (
    <section className="section newsletter">
      <div className="container newsletter__inner reveal">
        <h2 className="section__title">
          Join the <em>inner circle</em>
        </h2>
        <p>
          Early access to new collections, private sales, and styling notes. No
          noise — ever.
        </p>
        <form className="newsletter__form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn btn--dark">
            Subscribe
          </button>
        </form>
        <p className="newsletter__msg" style={{ color: message ? 'var(--accent-dark)' : undefined }}>
          {message}
        </p>
      </div>
    </section>
  );
}
