import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { initiatePayment } from '../lib/razorpay';
import { sendOrderEmail } from '../lib/emailService';
import AuthModal from '../components/auth/AuthModal';

export default function Checkout() {
  const { items, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const shipping = cartTotal >= 150 ? 0 : 12;
  const finalTotal = cartTotal + shipping;

  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="container checkout__empty">
          <h2>Your cart is empty</h2>
          <p>Add some beautiful dresses to your cart first.</p>
          <button className="btn btn--dark" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="container checkout__success">
          <div className="checkout__success-icon">✓</div>
          <h2>Payment Verified & Order Placed!</h2>
          <p>Thank you for your purchase. Your payment has been verified securely.</p>
          <button className="btn btn--dark" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  async function handlePayment() {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setProcessing(true);
    setOrderError('');

    let dbOrder = null;

    try {
      // 1. Create order record in Supabase (status: pending)
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: finalTotal,
          status: 'pending',
        })
        .select()
        .single();

      if (orderErr) throw orderErr;
      dbOrder = order;

      // 2. Create order items in Supabase
      // Filter out items with non-UUID IDs (from fallback/local data)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validItems = items.filter((item) => uuidRegex.test(item.id));

      if (validItems.length > 0) {
        const orderItems = validItems.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.qty,
          price_at_purchase: item.price,
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsErr) throw itemsErr;
      }

      // 3. Initiate Razorpay Standard Checkout
      //    Backend creates order → Frontend opens modal → Backend verifies
      await initiatePayment({
        amount: finalTotal,
        currency: 'INR',
        receipt: order.id,
        customerName: profile?.full_name || '',
        customerEmail: user.email || '',

        onSuccess: async (response) => {
          // Payment verified by backend — update Supabase order
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              shipping_address: {
                address: profile?.address || '',
                phone: profile?.phone || '',
                name: profile?.full_name || '',
              },
            })
            .eq('id', order.id);

          // Send order confirmation email (fire-and-forget)
          sendOrderEmail({
            name: profile?.full_name,
            email: user.email,
            orderId: order.id,
            total: finalTotal,
            items,
          });

          clearCart();
          setProcessing(false);
          setOrderSuccess(true);
        },

        onDismiss: async () => {
          // User closed modal without paying
          await supabase
            .from('orders')
            .update({ status: 'failed' })
            .eq('id', order.id);

          setProcessing(false);
          setOrderError('Payment was cancelled. Please try again.');
        },

        onError: async (err) => {
          // Payment failed or verification failed
          if (dbOrder) {
            await supabase
              .from('orders')
              .update({ status: 'failed' })
              .eq('id', dbOrder.id);
          }

          setProcessing(false);
          setOrderError(err.message || 'Payment failed. Please try again.');
        },
      });
    } catch (err) {
      console.error('Checkout error:', err);

      // Mark order as failed if it was created
      if (dbOrder) {
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', dbOrder.id);
      }

      setProcessing(false);
      setOrderError(err.message || 'An error occurred during checkout.');
    }
  }

  return (
    <>
      <div className="checkout-page">
        <div className="container">
          <div className="checkout__header">
            <button className="checkout__back" onClick={() => navigate('/')}>
              ← Back to Shop
            </button>
            <h1>Checkout</h1>
          </div>

          <div className="checkout__grid">
            <div className="checkout__summary">
              <h3>Order Summary</h3>
              <div className="checkout__items">
                {items.map((item) => (
                  <div key={item.id} className="checkout__item">
                    <img
                      src={item.image_url}
                      alt={item.alt || item.name}
                      className="checkout__item-img"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="checkout__item-info">
                      <div className="checkout__item-name">{item.name}</div>
                      <div className="checkout__item-meta">
                        Qty: {item.qty} × ₹{item.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="checkout__item-total">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout__totals">
                <div className="checkout__row">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="checkout__row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `₹ ${shipping.toFixed(2)}`}</span>
                </div>
                <div className="checkout__row checkout__row--total">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="checkout__payment">
              <h3>Payment</h3>
              {!user && (
                <div className="checkout__login-prompt">
                  <p>Please sign in to complete your purchase.</p>
                  <button
                    className="btn btn--outline"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Sign In / Create Account
                  </button>
                </div>
              )}

              {user && (
                <div className="checkout__pay-section">
                  <p className="checkout__pay-info">
                    Paying as <strong>{user.email}</strong>
                  </p>
                  {orderError && (
                    <div className="checkout__error">{orderError}</div>
                  )}
                  <button
                    className="btn btn--dark btn--full checkout__pay-btn"
                    onClick={handlePayment}
                    disabled={processing}
                  >
                    {processing ? (
                      <span className="checkout__spinner">Processing…</span>
                    ) : (
                      `Pay ₹${finalTotal.toFixed(2)}`
                    )}
                  </button>
                  <p className="checkout__secure">
                    🔒 Secured by Razorpay · Signature verified server-side
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
