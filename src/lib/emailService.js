/**
 * Email Notification Service
 * ─────────────────────────────────────────
 * Centralised module for all email notifications via Resend.
 * Each function calls the server-side `/api/send-email` endpoint,
 * which uses the Resend SDK to deliver emails securely.
 *
 * REQUIRED ENV VARIABLE (server-side only):
 *   RESEND_API_KEY — Your Resend API key (starts with re_)
 *
 * The public API of this module is unchanged from the previous
 * EmailJS implementation, so no consuming code needs to be updated.
 */

/* ─── Helper ────────────────────────────────────────── */

/**
 * Internal helper that POSTs to the /api/send-email endpoint.
 * Resolves silently on config issues so it never breaks the calling flow.
 */
async function send(type, data) {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`Email [${type}] failed:`, err);
    throw err;
  }
}

/* ─── Public API ────────────────────────────────────── */

/**
 * Send the CONTACT FORM message to admin.
 */
export function sendContactEmail({ name, email, subject, message }) {
  return send("contact", { name, email, subject, message });
}

/**
 * Send a WELCOME email to a newly registered user.
 */
export function sendWelcomeEmail({ name, email }) {
  return send("welcome", { name, email });
}

/**
 * Send an ORDER CONFIRMATION email to the customer.
 */
export function sendOrderEmail({ name, email, orderId, total, items }) {
  return send("order", { name, email, orderId, total, items });
}

/**
 * Notify admin that a new order was placed.
 */
export function sendOrderAdminEmail({ name, email, orderId, total, items }) {
  return send("order-admin", { name, email, orderId, total, items });
}

/**
 * Notify admin that a NEW PRODUCT was added.
 */
export function sendNewProductEmail({ name, price, category, imageUrl }) {
  return send("product", { name, price, category, imageUrl });
}
