import crypto from "crypto";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!KEY_SECRET) {
    return res.status(500).json({ error: "Razorpay secret not configured", verified: false });
  }

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

    const expectedSignature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      res.json({
        verified: true,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    } else {
      res.status(400).json({
        error: "Payment signature verification failed",
        verified: false,
      });
    }
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({
      error: "Internal server error during verification",
      verified: false,
    });
  }
}
