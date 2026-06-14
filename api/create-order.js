import Razorpay from "razorpay";

const KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!KEY_ID || !KEY_SECRET) {
    return res.status(500).json({ error: "Razorpay keys not configured" });
  }

  try {
    const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

    const { amount, currency = "INR", receipt, notes } = req.body;

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

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Create order error:", err);

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
}
