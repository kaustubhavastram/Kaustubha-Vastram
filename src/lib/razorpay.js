const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

/**
 * Loads the Razorpay checkout script dynamically.
 */
export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

/**
 * STEP 1: Call backend to create a Razorpay order.
 * The backend uses the KEY_SECRET (never exposed to frontend).
 *
 * @param {number} amountInPaise - Amount in smallest currency unit (paise)
 * @param {string} currency
 * @param {string} receipt - Your internal order/receipt ID
 * @returns {{ order_id: string, amount: number, currency: string }}
 */
async function createRazorpayOrder(amountInPaise, currency = 'INR', receipt = '') {
  const res = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create order (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * STEP 3: Call backend to verify the payment signature.
 * Backend computes HMAC-SHA256(order_id|payment_id, secret) and compares.
 *
 * @param {{ razorpay_order_id, razorpay_payment_id, razorpay_signature }} paymentData
 * @returns {{ verified: boolean, payment_id: string }}
 */
async function verifyPayment(paymentData) {
  const res = await fetch('/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  });

  const result = await res.json();

  if (!res.ok || !result.verified) {
    throw new Error(result.error || 'Payment verification failed');
  }

  return result;
}

/**
 * Full Razorpay Standard Checkout flow:
 *   1. Backend creates Razorpay order (with KEY_SECRET)
 *   2. Frontend opens Razorpay modal (with order_id)
 *   3. Backend verifies payment signature
 *
 * @param {Object} options
 * @param {number} options.amount - Amount in rupees (e.g., 245.00)
 * @param {string} options.currency - Currency code (default: 'INR')
 * @param {string} options.receipt - Internal receipt/order ID
 * @param {string} options.customerName - Prefill name
 * @param {string} options.customerEmail - Prefill email
 * @param {Function} options.onSuccess - Called with verified payment data
 * @param {Function} options.onDismiss - Called when user dismisses modal
 * @param {Function} options.onError - Called on any error
 */
export async function initiatePayment({
  amount,
  currency = 'INR',
  receipt = '',
  customerName = '',
  customerEmail = '',
  onSuccess,
  onDismiss,
  onError,
}) {
  try {
    // Load Razorpay SDK
    await loadRazorpayScript();

    if (!RAZORPAY_KEY_ID) {
      throw new Error('VITE_RAZORPAY_KEY_ID is not set in .env');
    }

    // STEP 1: Create order on backend
    const amountInPaise = Math.round(amount * 100);
    const orderData = await createRazorpayOrder(amountInPaise, currency, receipt);

    // STEP 2: Open Razorpay checkout modal
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Kaustubha Vastram',
      description: `Order #${receipt?.slice(0, 8) || orderData.order_id.slice(0, 8)}`,
      order_id: orderData.order_id, // Razorpay-generated order ID (required!)
      prefill: {
        name: customerName,
        email: customerEmail,
      },
      theme: {
        color: '#2b2520',
        backdrop_color: 'rgba(43, 37, 32, 0.6)',
      },
      handler: async function (response) {
        try {
          // STEP 3: Verify signature on backend
          const verification = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          onSuccess?.({
            ...response,
            verified: verification.verified,
          });
        } catch (verifyErr) {
          console.error('Payment verification failed:', verifyErr);
          onError?.(verifyErr);
        }
      },
      modal: {
        ondismiss: function () {
          onDismiss?.();
        },
        confirm_close: true,
      },
    };

    const rzp = new window.Razorpay(options);

    // Handle payment failure events
    rzp.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      onError?.(new Error(
        response.error?.description || 'Payment failed. Please try again.'
      ));
    });

    rzp.open();
  } catch (err) {
    console.error('Razorpay initiation error:', err);
    onError?.(err);
  }
}
