/**
 * Email Notification Service
 * ─────────────────────────────────────────
 * Centralised module for all EmailJS notifications.
 * Each email type uses its own template so you can customise them
 * independently on the EmailJS dashboard.
 *
 * REQUIRED ENV VARIABLES (add to .env and Vercel):
 *   VITE_EMAILJS_SERVICE_ID       — Your EmailJS service ID
 *   VITE_EMAILJS_PUBLIC_KEY       — Your EmailJS public key
 *
 *   VITE_EMAILJS_TEMPLATE_CONTACT — Template for contact form messages
 *   VITE_EMAILJS_TEMPLATE_WELCOME — Template for new-user welcome emails
 *   VITE_EMAILJS_TEMPLATE_ORDER   — Template for order-placed notifications
 *   VITE_EMAILJS_TEMPLATE_PRODUCT — Template for new-product notifications (admin)
 */

import emailjs from "@emailjs/browser";

/* ─── Config ────────────────────────────────────────── */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const TEMPLATES = {
  contact: import.meta.env.VITE_EMAILJS_TEMPLATE_CONTACT,
  welcome: import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME,
  order: import.meta.env.VITE_EMAILJS_TEMPLATE_ORDER,
  product: import.meta.env.VITE_EMAILJS_TEMPLATE_PRODUCT,
};

/* ─── Helper ────────────────────────────────────────── */

/**
 * Internal send helper. Logs a warning if EmailJS is not configured
 * and resolves silently so it never breaks the calling flow.
 */
async function send(templateKey, templateParams) {
  const templateId = TEMPLATES[templateKey];

  if (!SERVICE_ID || !PUBLIC_KEY || !templateId) {
    console.warn(
      `⚠️ EmailJS [${templateKey}] not configured. ` +
        `Missing SERVICE_ID, PUBLIC_KEY, or TEMPLATE (VITE_EMAILJS_TEMPLATE_${templateKey.toUpperCase()}).`
    );
    return;
  }

  try {
    await emailjs.send(SERVICE_ID, templateId, templateParams, PUBLIC_KEY);
  } catch (err) {
    // Never let a notification failure block the main flow
    console.error(`EmailJS [${templateKey}] failed:`, err);
  }
}

/* ─── Public API ────────────────────────────────────── */

/**
 * Send the CONTACT FORM message to admin.
 *
 * Template variables:
 *   {{from_name}}, {{from_email}}, {{subject}}, {{message}}, {{reply_to}}
 */
export function sendContactEmail({ name, email, subject, message }) {
  return send("contact", {
    from_name: name,
    from_email: email,
    subject: subject || "No subject",
    message,
    reply_to: email,
  });
}

/**
 * Send a WELCOME email to a newly registered user.
 *
 * Template variables:
 *   {{to_name}}, {{to_email}}, {{brand_name}}
 */
export function sendWelcomeEmail({ name, email }) {
  return send("welcome", {
    to_name: name || "there",
    to_email: email,
    brand_name: "Kaustubha Vastram",
  });
}

/**
 * Send an ORDER CONFIRMATION email to the customer + notify admin.
 *
 * Template variables:
 *   {{to_name}}, {{to_email}}, {{order_id}}, {{order_total}},
 *   {{order_items}}, {{order_date}}
 */
export function sendOrderEmail({ name, email, orderId, total, items }) {
  const itemSummary = items
    .map((item) => `${item.name} × ${item.qty} — ₹${(item.price * item.qty).toFixed(2)}`)
    .join("\n");

  return send("order", {
    to_name: name || "Customer",
    to_email: email,
    order_id: orderId,
    order_total: `₹${total.toFixed(2)}`,
    order_items: itemSummary,
    order_date: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  });
}

/**
 * Notify admin that a NEW PRODUCT was added.
 *
 * Template variables:
 *   {{product_name}}, {{product_price}}, {{product_category}},
 *   {{product_image}}, {{added_at}}
 */
export function sendNewProductEmail({ name, price, category, imageUrl }) {
  return send("product", {
    product_name: name,
    product_price: `₹${parseFloat(price).toFixed(2)}`,
    product_category: category.charAt(0).toUpperCase() + category.slice(1),
    product_image: imageUrl || "",
    added_at: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  });
}
