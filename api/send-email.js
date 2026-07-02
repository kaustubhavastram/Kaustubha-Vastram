import { Resend } from "resend";

const ADMIN_EMAIL = "kaustubhavastram@gmail.com";
const BRAND_NAME = "Kaustubha Vastram";
const FROM_ADDRESS = `${BRAND_NAME} <onboarding@resend.dev>`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("❌ RESEND_API_KEY is not configured");
    return res.status(500).json({ error: "Email service not configured" });
  }

  const resend = new Resend(apiKey);
  const { type, data } = req.body;

  if (!type || !data) {
    return res.status(400).json({ error: "Missing 'type' or 'data' in request body" });
  }

  try {
    let emailPayload;

    switch (type) {
      case "contact":
        emailPayload = buildContactEmail(data);
        break;
      case "welcome":
        emailPayload = buildWelcomeEmail(data);
        break;
      case "order":
        emailPayload = buildOrderEmail(data);
        break;
      case "product":
        emailPayload = buildProductEmail(data);
        break;
      case "order-admin":
        emailPayload = buildOrderAdminEmail(data);
        break;
      default:
        return res.status(400).json({ error: `Unknown email type: ${type}` });
    }

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      console.error(`❌ Resend [${type}] error:`, result.error);
      return res.status(500).json({ error: result.error.message || "Failed to send email" });
    }

    console.log(`✅ Email [${type}] sent: ${result.data?.id}`);
    res.json({ success: true, id: result.data?.id });
  } catch (err) {
    console.error(`❌ Resend [${type}] exception:`, err);
    res.status(500).json({ error: err.message || "Failed to send email" });
  }
}

/* ─── Shared Styles ─────────────────────────────────────────────── */

const STYLES = {
  wrapper: `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border: 1px solid #e8e0d4;
    border-radius: 8px;
    overflow: hidden;
  `,
  header: `
    background: linear-gradient(135deg, #2c1810 0%, #4a2c1a 100%);
    padding: 32px 24px;
    text-align: center;
  `,
  headerTitle: `
    color: #f5e6d3;
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
  `,
  body: `
    padding: 32px 24px;
    color: #3d2e22;
    line-height: 1.6;
  `,
  label: `
    font-size: 12px;
    font-weight: 600;
    color: #8b6f47;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  `,
  value: `
    font-size: 15px;
    color: #3d2e22;
    margin: 0 0 20px 0;
  `,
  messageBox: `
    background-color: #faf6f0;
    border-left: 4px solid #8b6f47;
    padding: 16px 20px;
    border-radius: 0 6px 6px 0;
    margin: 16px 0;
    white-space: pre-wrap;
    font-size: 15px;
    line-height: 1.7;
  `,
  footer: `
    background-color: #faf6f0;
    padding: 20px 24px;
    text-align: center;
    font-size: 13px;
    color: #8b7a6b;
    border-top: 1px solid #e8e0d4;
  `,
  badge: `
    display: inline-block;
    background: linear-gradient(135deg, #8b6f47, #a0845c);
    color: #ffffff;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
  `,
  divider: `
    border: none;
    border-top: 1px solid #e8e0d4;
    margin: 24px 0;
  `,
};

function wrapEmail(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:20px; background-color:#f5f0eb;">
  <div style="${STYLES.wrapper}">
    <div style="${STYLES.header}">
      <h1 style="${STYLES.headerTitle}">${BRAND_NAME}</h1>
    </div>
    <div style="${STYLES.body}">
      <div style="${STYLES.badge}">${title}</div>
      ${bodyHtml}
    </div>
    <div style="${STYLES.footer}">
      &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

/* ─── Email Builders ────────────────────────────────────────────── */

function buildContactEmail({ name, email, subject, message }) {
  const html = wrapEmail("New Contact Message", `
    <p style="${STYLES.label}">From</p>
    <p style="${STYLES.value}">${escHtml(name)} &lt;${escHtml(email)}&gt;</p>

    <p style="${STYLES.label}">Subject</p>
    <p style="${STYLES.value}">${escHtml(subject || "No subject")}</p>

    <hr style="${STYLES.divider}">

    <p style="${STYLES.label}">Message</p>
    <div style="${STYLES.messageBox}">${escHtml(message)}</div>

    <p style="font-size:13px; color:#8b7a6b; margin-top:24px;">
      You can reply directly to <strong>${escHtml(email)}</strong> to respond.
    </p>
  `);

  return {
    from: FROM_ADDRESS,
    to: [ADMIN_EMAIL],
    replyTo: email,
    subject: `[Contact] ${subject || "New message"} — from ${name}`,
    html,
  };
}

function buildWelcomeEmail({ name, email }) {
  const displayName = escHtml(name || "there");
  const html = wrapEmail("Welcome!", `
    <h2 style="color:#2c1810; margin-top:0;">Hello ${displayName}! 👋</h2>
    <p>Thank you for joining <strong>${BRAND_NAME}</strong>. We're thrilled to have you as part of our community.</p>
    <p>Explore our curated collection of premium handloom sarees, each crafted with care and tradition.</p>
    <hr style="${STYLES.divider}">
    <p style="font-size:13px; color:#8b7a6b;">
      If you have any questions, feel free to reach out to us at
      <a href="mailto:${ADMIN_EMAIL}" style="color:#8b6f47;">${ADMIN_EMAIL}</a>.
    </p>
  `);

  return {
    from: FROM_ADDRESS,
    to: [email],
    subject: `Welcome to ${BRAND_NAME}! 🎉`,
    html,
  };
}

function buildOrderEmail({ name, email, orderId, total, items }) {
  const itemRows = (items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #e8e0d4; font-size:14px;">${escHtml(item.name)}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #e8e0d4; text-align:center; font-size:14px;">${item.qty}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #e8e0d4; text-align:right; font-size:14px;">₹${(item.price * item.qty).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const orderDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = wrapEmail("Order Confirmed", `
    <h2 style="color:#2c1810; margin-top:0;">Thank you, ${escHtml(name || "Customer")}!</h2>
    <p>Your order has been placed successfully. Here's a summary:</p>

    <p style="${STYLES.label}">Order ID</p>
    <p style="${STYLES.value}"><code style="background:#faf6f0; padding:4px 8px; border-radius:4px;">${escHtml(orderId)}</code></p>

    <p style="${STYLES.label}">Order Date</p>
    <p style="${STYLES.value}">${orderDate}</p>

    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <thead>
        <tr style="background-color:#faf6f0;">
          <th style="padding:10px 12px; text-align:left; font-size:12px; text-transform:uppercase; color:#8b6f47; border-bottom:2px solid #e8e0d4;">Item</th>
          <th style="padding:10px 12px; text-align:center; font-size:12px; text-transform:uppercase; color:#8b6f47; border-bottom:2px solid #e8e0d4;">Qty</th>
          <th style="padding:10px 12px; text-align:right; font-size:12px; text-transform:uppercase; color:#8b6f47; border-bottom:2px solid #e8e0d4;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr>
          <td colspan="2" style="padding:12px; text-align:right; font-weight:700; font-size:15px; border-top:2px solid #2c1810;">Total</td>
          <td style="padding:12px; text-align:right; font-weight:700; font-size:15px; border-top:2px solid #2c1810;">₹${parseFloat(total).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <p style="font-size:13px; color:#8b7a6b;">
      If you have any questions about your order, contact us at
      <a href="mailto:${ADMIN_EMAIL}" style="color:#8b6f47;">${ADMIN_EMAIL}</a>.
    </p>
  `);

  return {
    from: FROM_ADDRESS,
    to: [email],
    subject: `Order Confirmed — ${orderId} | ${BRAND_NAME}`,
    html,
  };
}

function buildProductEmail({ name, price, category, imageUrl }) {
  const addedAt = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const imageBlock = imageUrl
    ? `<img src="${escHtml(imageUrl)}" alt="${escHtml(name)}" style="width:100%; max-width:400px; border-radius:8px; margin:16px 0; border:1px solid #e8e0d4;" />`
    : "";

  const html = wrapEmail("New Product Added", `
    <h2 style="color:#2c1810; margin-top:0;">${escHtml(name)}</h2>

    ${imageBlock}

    <p style="${STYLES.label}">Price</p>
    <p style="${STYLES.value}">₹${parseFloat(price).toFixed(2)}</p>

    <p style="${STYLES.label}">Category</p>
    <p style="${STYLES.value}">${escHtml(category.charAt(0).toUpperCase() + category.slice(1))}</p>

    <p style="${STYLES.label}">Added At</p>
    <p style="${STYLES.value}">${addedAt}</p>
  `);

  return {
    from: FROM_ADDRESS,
    to: [ADMIN_EMAIL],
    subject: `[New Product] ${name} — ₹${parseFloat(price).toFixed(2)}`,
    html,
  };
}

function buildOrderAdminEmail({ name, email, orderId, total, items }) {
  const itemRows = (items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #e8e0d4; font-size:14px;">${escHtml(item.name)}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #e8e0d4; text-align:center; font-size:14px;">${item.qty}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #e8e0d4; text-align:right; font-size:14px;">₹${(item.price * item.qty).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const orderDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = wrapEmail("New Order Received", `
    <h2 style="color:#2c1810; margin-top:0;">🛒 New Order!</h2>
    <p>A customer has just placed an order.</p>

    <p style="${STYLES.label}">Customer</p>
    <p style="${STYLES.value}">${escHtml(name || "Guest")} &lt;${escHtml(email)}&gt;</p>

    <p style="${STYLES.label}">Order ID</p>
    <p style="${STYLES.value}"><code style="background:#faf6f0; padding:4px 8px; border-radius:4px;">${escHtml(orderId)}</code></p>

    <p style="${STYLES.label}">Placed At</p>
    <p style="${STYLES.value}">${orderDate}</p>

    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <thead>
        <tr style="background-color:#faf6f0;">
          <th style="padding:10px 12px; text-align:left; font-size:12px; text-transform:uppercase; color:#8b6f47; border-bottom:2px solid #e8e0d4;">Item</th>
          <th style="padding:10px 12px; text-align:center; font-size:12px; text-transform:uppercase; color:#8b6f47; border-bottom:2px solid #e8e0d4;">Qty</th>
          <th style="padding:10px 12px; text-align:right; font-size:12px; text-transform:uppercase; color:#8b6f47; border-bottom:2px solid #e8e0d4;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr>
          <td colspan="2" style="padding:12px; text-align:right; font-weight:700; font-size:15px; border-top:2px solid #2c1810;">Total</td>
          <td style="padding:12px; text-align:right; font-weight:700; font-size:15px; border-top:2px solid #2c1810;">₹${parseFloat(total).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `);

  return {
    from: FROM_ADDRESS,
    to: [ADMIN_EMAIL],
    replyTo: email,
    subject: `[New Order] ${orderId} — ₹${parseFloat(total).toFixed(2)} from ${name || "Customer"}`,
    html,
  };
}

/* ─── Utility ───────────────────────────────────────────────────── */

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
