import "dotenv/config";
import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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

// ── Shiprocket configuration ──────────────────────────────────────
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

// Supabase service role key for server-side writes (webhooks)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// In-memory token cache
let shiprocketToken = null;
let shiprocketTokenExpiry = 0;

async function getShiprocketToken() {
  // Token lasts 10 days; refresh if within 1 day of expiry
  if (shiprocketToken && Date.now() < shiprocketTokenExpiry) {
    return shiprocketToken;
  }

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error("Shiprocket credentials not configured in .env");
  }

  const res = await fetch(`${SHIPROCKET_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shiprocket auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  shiprocketToken = data.token;
  // Refresh 1 day before the 10-day expiry
  shiprocketTokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
  console.log("✅ Shiprocket token acquired");
  return shiprocketToken;
}

// Helper: update order in Supabase using service role key (server-side)
async function updateOrderInSupabase(orderId, updates) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Supabase service role key not configured");
    return;
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(updates),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Supabase update failed for order ${orderId}:`, text);
  }
}

// ── POST /api/shiprocket/create-shipment ──────────────────────────
// Admin calls this to ship a paid order via Shiprocket.
app.post("/api/shiprocket/create-shipment", async (req, res) => {
  try {
    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      totalAmount,
    } = req.body;

    if (!orderId || !customerName || !shippingAddress) {
      return res.status(400).json({
        error: "Missing required fields: orderId, customerName, shippingAddress",
      });
    }

    const token = await getShiprocketToken();

    // Build Shiprocket order payload
    const orderPayload = {
      order_id: orderId,
      order_date: new Date().toISOString().split("T")[0],
      pickup_location: "Primary",
      billing_customer_name: customerName,
      billing_last_name: "",
      billing_address: shippingAddress.address || "",
      billing_city: shippingAddress.city || "",
      billing_pincode: shippingAddress.pincode || "",
      billing_state: shippingAddress.state || "",
      billing_country: "India",
      billing_email: customerEmail || "",
      billing_phone: customerPhone || "",
      shipping_is_billing: true,
      order_items: (items || []).map((item) => ({
        name: item.name || "Product",
        sku: item.id || `SKU-${Date.now()}`,
        units: item.quantity || 1,
        selling_price: item.price || 0,
      })),
      payment_method: "Prepaid",
      sub_total: totalAmount || 0,
      length: 25,
      breadth: 20,
      height: 5,
      weight: 0.5,
    };

    // Create order in Shiprocket
    const createRes = await fetch(`${SHIPROCKET_BASE}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const createData = await createRes.json();

    if (!createRes.ok || !createData.order_id) {
      console.error("❌ Shiprocket create order failed:", createData);
      return res.status(createRes.status || 500).json({
        error: createData.message || "Failed to create Shiprocket order",
        details: createData,
      });
    }

    console.log(
      `✅ Shiprocket order created: ${createData.order_id}, shipment: ${createData.shipment_id}`,
    );

    // Build tracking URL
    const trackingUrl = createData.awb_code
      ? `https://shiprocket.co/tracking/${createData.awb_code}`
      : "";

    // Update order in Supabase with shipping info
    await updateOrderInSupabase(orderId, {
      status: "shipped",
      shiprocket_order_id: String(createData.order_id),
      shiprocket_shipment_id: String(createData.shipment_id || ""),
      awb_number: createData.awb_code || "",
      courier_name: createData.courier_name || "",
      tracking_url: trackingUrl,
      shipping_status: "pickup_scheduled",
    });

    res.json({
      success: true,
      shiprocket_order_id: createData.order_id,
      shipment_id: createData.shipment_id,
      awb_code: createData.awb_code || "",
      courier_name: createData.courier_name || "",
      tracking_url: trackingUrl,
    });
  } catch (err) {
    console.error("❌ Create shipment error:", err);
    res.status(500).json({
      error: err.message || "Failed to create shipment",
    });
  }
});

// ── POST /api/shiprocket/webhook ──────────────────────────────────
// Shiprocket sends status updates here automatically.
app.post("/api/shiprocket/webhook", async (req, res) => {
  try {
    const payload = req.body;
    console.log("📦 Shiprocket webhook received:", JSON.stringify(payload));

    // Shiprocket webhook payload contains: awb, current_status, etd, order_id, etc.
    const shiprocketOrderId = String(
      payload.order_id || payload.shiprocket_order_id || "",
    );
    const currentStatus = (
      payload.current_status || payload.status || ""
    ).toLowerCase();
    const awb = payload.awb || "";

    if (!shiprocketOrderId && !awb) {
      return res.status(400).json({ error: "Missing order_id or awb in webhook payload" });
    }

    // Map Shiprocket statuses to our internal statuses
    const statusMap = {
      "new": "pickup_scheduled",
      "pickup scheduled": "pickup_scheduled",
      "pickup queued": "pickup_scheduled",
      "pickup generated": "pickup_scheduled",
      "out for pickup": "pickup_scheduled",
      "picked up": "picked_up",
      "in transit": "in_transit",
      "reached at destination hub": "in_transit",
      "out for delivery": "out_for_delivery",
      "delivered": "delivered",
      "rto initiated": "rto",
      "rto delivered": "rto",
      "cancelled": "cancelled",
      "lost": "lost",
    };

    const shippingStatus = statusMap[currentStatus] || currentStatus;

    // Also map to order-level status
    const orderStatusMap = {
      delivered: "delivered",
      cancelled: "cancelled",
      rto: "cancelled",
      lost: "cancelled",
    };
    const orderStatus = orderStatusMap[shippingStatus];

    // Build the update object
    const updates = { shipping_status: shippingStatus };
    if (orderStatus) {
      updates.status = orderStatus;
    }

    // Find the order by shiprocket_order_id and update it
    // We need to query first to get our internal order ID
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      // Query for the order
      const queryParam = shiprocketOrderId
        ? `shiprocket_order_id=eq.${shiprocketOrderId}`
        : `awb_number=eq.${awb}`;

      const queryRes = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?${queryParam}&select=id`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        },
      );

      const orders = await queryRes.json();

      if (orders && orders.length > 0) {
        for (const order of orders) {
          await updateOrderInSupabase(order.id, updates);
          console.log(
            `✅ Order ${order.id} updated: shipping_status=${shippingStatus}`,
          );
        }
      } else {
        console.warn(
          `⚠️ No order found for shiprocket_order_id=${shiprocketOrderId}, awb=${awb}`,
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Shiprocket webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// ── GET /api/shiprocket/track/:orderId ────────────────────────────
// Fetches real-time tracking from Shiprocket for an order.
app.get("/api/shiprocket/track/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Look up the AWB from Supabase
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    const queryRes = await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=awb_number,shiprocket_shipment_id`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      },
    );

    const orders = await queryRes.json();
    if (!orders || orders.length === 0 || !orders[0].awb_number) {
      return res.status(404).json({ error: "No tracking info found for this order" });
    }

    const token = await getShiprocketToken();
    const trackRes = await fetch(
      `${SHIPROCKET_BASE}/courier/track/awb/${orders[0].awb_number}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const trackData = await trackRes.json();
    res.json(trackData);
  } catch (err) {
    console.error("❌ Track order error:", err);
    res.status(500).json({ error: "Failed to fetch tracking info" });
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
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next(); // Let API 404s handle themselves
    }
    res.sendFile(path.join(distPath, "index.html"));
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
