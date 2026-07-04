import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { initiatePayment } from '../lib/razorpay';
import { sendOrderEmail, sendOrderAdminEmail } from '../lib/emailService';
import AuthModal from '../components/auth/AuthModal';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function Checkout() {
  const { items, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Steps: 'address' → 'payment'
  const [step, setStep] = useState('address');

  const [processing, setProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Delivery address form
  const [delivery, setDelivery] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [deliveryErrors, setDeliveryErrors] = useState({});

  // Pre-fill delivery form from profile
  useEffect(() => {
    if (profile || user) {
      setDelivery((prev) => ({
        ...prev,
        fullName: prev.fullName || profile?.full_name || '',
        phone: prev.phone || profile?.phone || '',
        email: prev.email || user?.email || '',
        addressLine1: prev.addressLine1 || profile?.address || '',
      }));
    }
  }, [profile, user]);

  const shipping = cartTotal >= 150 ? 0 : 12;
  const finalTotal = cartTotal + shipping;

  // Validate delivery form
  function validateDelivery() {
    const errors = {};

    if (!delivery.fullName.trim()) errors.fullName = 'Full name is required';
    if (!delivery.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(delivery.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit Indian phone number';
    }
    if (!delivery.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(delivery.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (!delivery.addressLine1.trim()) errors.addressLine1 = 'Address is required';
    if (!delivery.city.trim()) errors.city = 'City is required';
    if (!delivery.state) errors.state = 'State is required';
    if (!delivery.pincode.trim()) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(delivery.pincode.trim())) {
      errors.pincode = 'Enter a valid 6-digit pincode';
    }

    setDeliveryErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleDeliveryChange(e) {
    const { name, value } = e.target;
    setDelivery((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (deliveryErrors[name]) {
      setDeliveryErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function handleProceedToPayment(e) {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (validateDelivery()) {
      setStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

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

    const shippingAddress = {
      name: delivery.fullName.trim(),
      phone: delivery.phone.trim(),
      email: delivery.email.trim(),
      address_line_1: delivery.addressLine1.trim(),
      address_line_2: delivery.addressLine2.trim(),
      landmark: delivery.landmark.trim(),
      city: delivery.city.trim(),
      state: delivery.state,
      pincode: delivery.pincode.trim(),
    };

    try {
      // 1. Create order record in Supabase (status: pending)
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total: finalTotal,
          status: 'pending',
          shipping_address: shippingAddress,
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
        customerName: delivery.fullName.trim(),
        customerEmail: delivery.email.trim(),

        onSuccess: async (response) => {
          // Payment verified by backend — update Supabase order
          await supabase
            .from('orders')
            .update({
              status: 'paid',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
            })
            .eq('id', order.id);

          // Send order confirmation email (fire-and-forget)
          sendOrderEmail({
            name: delivery.fullName.trim(),
            email: delivery.email.trim(),
            orderId: order.id,
            total: finalTotal,
            items,
          });

          // Notify admin about the new order (fire-and-forget)
          sendOrderAdminEmail({
            name: delivery.fullName.trim(),
            email: delivery.email.trim(),
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

          {/* Step Indicator */}
          <div className="checkout__steps">
            <div
              className={`checkout__step ${step === 'address' ? 'checkout__step--active' : 'checkout__step--done'}`}
              onClick={() => step === 'payment' && setStep('address')}
            >
              <span className="checkout__step-number">
                {step === 'payment' ? '✓' : '1'}
              </span>
              <span className="checkout__step-label">Delivery Address</span>
            </div>
            <div className="checkout__step-line" />
            <div
              className={`checkout__step ${step === 'payment' ? 'checkout__step--active' : ''}`}
            >
              <span className="checkout__step-number">2</span>
              <span className="checkout__step-label">Payment</span>
            </div>
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

            {/* Right Column — Address or Payment */}
            <div className="checkout__right">
              {step === 'address' && (
                <div className="checkout__delivery">
                  <h3>Delivery Address</h3>
                  {!user && (
                    <div className="checkout__login-prompt">
                      <p>Please sign in to continue.</p>
                      <button
                        className="btn btn--outline"
                        onClick={() => setAuthModalOpen(true)}
                      >
                        Sign In / Create Account
                      </button>
                    </div>
                  )}

                  {user && (
                    <form
                      className="checkout__delivery-form"
                      onSubmit={handleProceedToPayment}
                      noValidate
                    >
                      <div className="checkout__form-row">
                        <div className={`checkout__form-group ${deliveryErrors.fullName ? 'checkout__form-group--error' : ''}`}>
                          <label htmlFor="delivery-fullName">Full Name *</label>
                          <input
                            id="delivery-fullName"
                            name="fullName"
                            type="text"
                            value={delivery.fullName}
                            onChange={handleDeliveryChange}
                            placeholder="Enter your full name"
                          />
                          {deliveryErrors.fullName && (
                            <span className="checkout__field-error">{deliveryErrors.fullName}</span>
                          )}
                        </div>
                      </div>

                      <div className="checkout__form-row checkout__form-row--two">
                        <div className={`checkout__form-group ${deliveryErrors.phone ? 'checkout__form-group--error' : ''}`}>
                          <label htmlFor="delivery-phone">Phone Number *</label>
                          <input
                            id="delivery-phone"
                            name="phone"
                            type="tel"
                            value={delivery.phone}
                            onChange={handleDeliveryChange}
                            placeholder="10-digit mobile number"
                            maxLength={10}
                          />
                          {deliveryErrors.phone && (
                            <span className="checkout__field-error">{deliveryErrors.phone}</span>
                          )}
                        </div>
                        <div className={`checkout__form-group ${deliveryErrors.email ? 'checkout__form-group--error' : ''}`}>
                          <label htmlFor="delivery-email">Email Address *</label>
                          <input
                            id="delivery-email"
                            name="email"
                            type="email"
                            value={delivery.email}
                            onChange={handleDeliveryChange}
                            placeholder="your@email.com"
                          />
                          {deliveryErrors.email && (
                            <span className="checkout__field-error">{deliveryErrors.email}</span>
                          )}
                        </div>
                      </div>

                      <div className="checkout__form-row">
                        <div className={`checkout__form-group ${deliveryErrors.addressLine1 ? 'checkout__form-group--error' : ''}`}>
                          <label htmlFor="delivery-addressLine1">Address Line 1 *</label>
                          <input
                            id="delivery-addressLine1"
                            name="addressLine1"
                            type="text"
                            value={delivery.addressLine1}
                            onChange={handleDeliveryChange}
                            placeholder="House/Flat No., Building, Street"
                          />
                          {deliveryErrors.addressLine1 && (
                            <span className="checkout__field-error">{deliveryErrors.addressLine1}</span>
                          )}
                        </div>
                      </div>

                      <div className="checkout__form-row">
                        <div className="checkout__form-group">
                          <label htmlFor="delivery-addressLine2">Address Line 2</label>
                          <input
                            id="delivery-addressLine2"
                            name="addressLine2"
                            type="text"
                            value={delivery.addressLine2}
                            onChange={handleDeliveryChange}
                            placeholder="Area, Colony (optional)"
                          />
                        </div>
                      </div>

                      <div className="checkout__form-row checkout__form-row--two">
                        <div className={`checkout__form-group ${deliveryErrors.city ? 'checkout__form-group--error' : ''}`}>
                          <label htmlFor="delivery-city">City *</label>
                          <input
                            id="delivery-city"
                            name="city"
                            type="text"
                            value={delivery.city}
                            onChange={handleDeliveryChange}
                            placeholder="City / Town"
                          />
                          {deliveryErrors.city && (
                            <span className="checkout__field-error">{deliveryErrors.city}</span>
                          )}
                        </div>
                        <div className={`checkout__form-group ${deliveryErrors.pincode ? 'checkout__form-group--error' : ''}`}>
                          <label htmlFor="delivery-pincode">Pincode *</label>
                          <input
                            id="delivery-pincode"
                            name="pincode"
                            type="text"
                            value={delivery.pincode}
                            onChange={handleDeliveryChange}
                            placeholder="6-digit pincode"
                            maxLength={6}
                          />
                          {deliveryErrors.pincode && (
                            <span className="checkout__field-error">{deliveryErrors.pincode}</span>
                          )}
                        </div>
                      </div>

                      <div className="checkout__form-row checkout__form-row--two">
                        <div className={`checkout__form-group ${deliveryErrors.state ? 'checkout__form-group--error' : ''}`}>
                          <label htmlFor="delivery-state">State *</label>
                          <select
                            id="delivery-state"
                            name="state"
                            value={delivery.state}
                            onChange={handleDeliveryChange}
                          >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          {deliveryErrors.state && (
                            <span className="checkout__field-error">{deliveryErrors.state}</span>
                          )}
                        </div>
                        <div className="checkout__form-group">
                          <label htmlFor="delivery-landmark">Landmark</label>
                          <input
                            id="delivery-landmark"
                            name="landmark"
                            type="text"
                            value={delivery.landmark}
                            onChange={handleDeliveryChange}
                            placeholder="Nearby landmark (optional)"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn--dark btn--full checkout__proceed-btn"
                      >
                        Proceed to Payment →
                      </button>
                    </form>
                  )}
                </div>
              )}

              {step === 'payment' && (
                <div className="checkout__payment">
                  <h3>Payment</h3>

                  {/* Delivery summary card */}
                  <div className="checkout__delivery-summary">
                    <div className="checkout__delivery-summary-header">
                      <span className="checkout__delivery-summary-title">📍 Delivering to</span>
                      <button
                        type="button"
                        className="checkout__delivery-edit"
                        onClick={() => setStep('address')}
                      >
                        Edit
                      </button>
                    </div>
                    <p className="checkout__delivery-summary-name">{delivery.fullName}</p>
                    <p className="checkout__delivery-summary-addr">
                      {delivery.addressLine1}
                      {delivery.addressLine2 ? `, ${delivery.addressLine2}` : ''}
                      {delivery.landmark ? ` (Near ${delivery.landmark})` : ''}
                    </p>
                    <p className="checkout__delivery-summary-addr">
                      {delivery.city}, {delivery.state} – {delivery.pincode}
                    </p>
                    <p className="checkout__delivery-summary-contact">
                      📞 {delivery.phone} · ✉ {delivery.email}
                    </p>
                  </div>

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
