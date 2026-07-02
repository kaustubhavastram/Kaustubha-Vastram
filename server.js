import "dotenv/config";
import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import sendEmailHandler from "./api/send-email.js";

const app = express();
app.use(express.json());

// ── Razorpay instance ──────────────────────────────────────────────
const KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
  console.error("❌ Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env");
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

// ── POST /api/create-order ─────────────────────────────────────────
// Creates a Razorpay order. Frontend calls this before opening the modal.
app.post("/api/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body;

    // Validate amount (minimum 100 paise = ₹1)
    const amountInPaise = Math.round(Number(amount));
    if (!amountInPaise || amountInPaise < 100) {
      return res.status(400).json({
        error: "Amount must be at least 100 paise (₹1)",
      });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });

    console.log(
      `✅ Order created: ${order.id} — ₹${(amountInPaise / 100).toFixed(2)}`,
    );

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("❌ Create order error:", err);

    if (err.statusCode === 401) {
      return res.status(401).json({
        error: "Razorpay authentication failed. Check your API keys.",
      });
    }

    res.status(500).json({
      error:
        err.error?.description ||
        err.message ||
        "Failed to create Razorpay order",
    });
  }
});

// ── POST /api/send-email ───────────────────────────────────────────
// Sends emails via Resend (contact, welcome, order, product).
app.post("/api/send-email", (req, res) => sendEmailHandler(req, res));

// ── POST /api/verify-payment ───────────────────────────────────────
// Verifies the Razorpay payment signature using HMAC-SHA256.
app.post("/api/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error:
          "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature",
        verified: false,
      });
    }

    // Generate expected signature: HMAC-SHA256(order_id|payment_id, secret)
    const expectedSignature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      console.log(`✅ Payment verified: ${razorpay_payment_id}`);
      res.json({
        verified: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    } else {
      console.warn(`⚠️ Signature mismatch for payment: ${razorpay_payment_id}`);
      res.status(400).json({
        error: "Payment signature verification failed",
        verified: false,
      });
    }
  } catch (err) {
    console.error("❌ Verify payment error:", err);
    res.status(500).json({
      error: "Internal server error during verification",
      verified: false,
    });
  }
});

// ── Serve static files in production ────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log(
    `✅ Production build found. Serving static files from ${distPath}`,
  );

  // SPA fallback routing (must be placed after other routes like /api)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith("/api/")) {
      return res.sendFile(path.join(distPath, "index.html"));
    }
    next();
  });
} else {
  console.log(
    "ℹ️ No production build found at dist/. Running in API-only mode.",
  );
}

// ── Health check ───────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", razorpay_configured: true });
});

// ── Start server ───────────────────────────────────────────────────
const PORT = process.env.PORT || process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Razorpay API server running on port ${PORT}`);
  console.log(`   Key ID: ${KEY_ID.slice(0, 12)}...`);
});
