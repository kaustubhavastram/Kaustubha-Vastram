import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AuthModal from '../components/auth/AuthModal';
import '../styles/profile.css';

function getStatusClass(status) {
  const map = {
    pending: 'status--pending',
    paid: 'status--paid',
    failed: 'status--failed',
    shipped: 'status--shipped',
    delivered: 'status--delivered',
    cancelled: 'status--cancelled',
    pickup_scheduled: 'status--shipped',
    picked_up: 'status--shipped',
    in_transit: 'status--shipped',
    out_for_delivery: 'status--shipped',
  };
  return map[status] || '';
}

const SHIPPING_STEPS = [
  { key: 'order_placed', label: 'Order Placed' },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

function getShippingStepIndex(shippingStatus) {
  const map = {
    not_shipped: 0,
    pickup_scheduled: 1,
    picked_up: 2,
    in_transit: 2,
    out_for_delivery: 3,
    delivered: 4,
  };
  return map[shippingStatus] ?? 0;
}

function ShippingTracker({ order }) {
  const status = order.shipping_status || 'not_shipped';
  const activeStep = getShippingStepIndex(status);

  // Only show tracker for orders that have been paid or shipped
  if (order.status === 'pending' || order.status === 'failed' || order.status === 'cancelled') {
    return null;
  }

  return (
    <div className="shipping-tracker">
      <h4 className="shipping-tracker__title">Shipping Status</h4>
      <div className="shipping-tracker__steps">
        {SHIPPING_STEPS.map((step, idx) => {
          let stepClass = 'shipping-tracker__step';
          if (idx < activeStep) stepClass += ' shipping-tracker__step--done';
          else if (idx === activeStep) stepClass += ' shipping-tracker__step--active';

          return (
            <div key={step.key} className={stepClass}>
              <div className="shipping-tracker__dot" />
              {idx < SHIPPING_STEPS.length - 1 && (
                <div className="shipping-tracker__line" />
              )}
              <span className="shipping-tracker__label">{step.label}</span>
            </div>
          );
        })}
      </div>
      {(order.courier_name || order.awb_number) && (
        <div className="shipping-tracker__info">
          {order.courier_name && (
            <span className="shipping-tracker__courier">
              📦 {order.courier_name}
            </span>
          )}
          {order.awb_number && (
            <span className="shipping-tracker__awb">
              AWB: {order.awb_number}
            </span>
          )}
        </div>
      )}
      {order.tracking_url && (
        <a
          href={order.tracking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--outline shipping-tracker__btn"
        >
          Track Package →
        </a>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  // Fetch user orders
  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  async function fetchOrders() {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }

  async function fetchOrderItems(orderId) {
    if (orderItems[orderId]) return;
    const { data, error } = await supabase
      .from('order_items')
      .select('*, products(name, image_url, price)')
      .eq('order_id', orderId);

    if (!error) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  }

  function toggleExpand(orderId) {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      fetchOrderItems(orderId);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;
      setSaveMsg('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setSaveMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <div className="profile-page">
          <div className="container profile__empty">
            <h2>Sign in to view your profile</h2>
            <p>Create an account or sign in to view your orders and manage your profile.</p>
            <button
              className="btn btn--dark"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In / Create Account
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile__header">
          <button className="checkout__back" onClick={() => navigate('/')}>
            ← Back to Shop
          </button>
          <h1>My Account</h1>
        </div>

        <div className="profile__grid">
          {/* Profile Card */}
          <div className="profile__card">
            <div className="profile__card-header">
              <div className="profile__avatar">
                {(profile?.full_name || user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="profile__name">
                  {profile?.full_name || 'Guest User'}
                </h2>
                <p className="profile__email">{user.email}</p>
                {profile?.role === 'admin' && (
                  <span className="profile__role-badge">Admin</span>
                )}
              </div>
            </div>

            {saveMsg && (
              <div
                className={`profile__msg ${
                  saveMsg.startsWith('Error') ? 'profile__msg--error' : 'profile__msg--success'
                }`}
              >
                {saveMsg}
              </div>
            )}

            {!editing ? (
              <div className="profile__info">
                <div className="profile__info-row">
                  <span className="profile__info-label">Full Name</span>
                  <span>{profile?.full_name || '—'}</span>
                </div>
                <div className="profile__info-row">
                  <span className="profile__info-label">Email</span>
                  <span>{user.email}</span>
                </div>
                <div className="profile__info-row">
                  <span className="profile__info-label">Phone</span>
                  <span>{profile?.phone || '—'}</span>
                </div>
                <div className="profile__info-row">
                  <span className="profile__info-label">Address</span>
                  <span>{profile?.address || '—'}</span>
                </div>
                <div className="profile__info-row">
                  <span className="profile__info-label">Member Since</span>
                  <span>
                    {new Date(user.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="profile__actions">
                  <button
                    className="btn btn--outline"
                    onClick={() => {
                      setSaveMsg('');
                      setEditing(true);
                    }}
                  >
                    Edit Profile
                  </button>
                  <button className="btn btn--danger" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <form className="profile__form" onSubmit={handleSave}>
                <div className="profile__form-group">
                  <label htmlFor="full_name">Full Name</label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />
                </div>
                <div className="profile__form-group">
                  <label>Email</label>
                  <input type="email" value={user.email} disabled />
                </div>
                <div className="profile__form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 99999 99999"
                  />
                </div>
                <div className="profile__form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Your delivery address"
                    rows="3"
                  />
                </div>
                <div className="profile__actions">
                  <button type="submit" className="btn btn--dark" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => {
                      setEditing(false);
                      setSaveMsg('');
                      setForm({
                        full_name: profile?.full_name || '',
                        phone: profile?.phone || '',
                        address: profile?.address || '',
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Orders Section */}
          <div className="profile__orders">
            <h2>My Orders</h2>
            {ordersLoading ? (
              <p className="profile__orders-empty">Loading orders…</p>
            ) : orders.length === 0 ? (
              <div className="profile__orders-empty">
                <p>No orders yet.</p>
                <button className="btn btn--outline" onClick={() => navigate('/')}>
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="profile__orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="profile__order">
                    <div
                      className="profile__order-header"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="profile__order-info">
                        <span className="profile__order-id">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="profile__order-date">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="profile__order-meta">
                        <span className="profile__order-total">
                          ₹{parseFloat(order.total).toFixed(2)}
                        </span>
                        <span className={`status-badge ${getStatusClass(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="profile__order-toggle">
                          {expandedOrder === order.id ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="profile__order-detail">
                        <ShippingTracker order={order} />
                        {order.razorpay_payment_id && (
                          <div className="profile__order-payment">
                            <span className="profile__info-label">Payment ID</span>
                            <span className="profile__mono">
                              {order.razorpay_payment_id}
                            </span>
                          </div>
                        )}
                        {orderItems[order.id] ? (
                          <div className="profile__order-items">
                            {orderItems[order.id].map((item) => (
                              <div key={item.id} className="profile__order-item">
                                <img
                                  src={item.products?.image_url}
                                  alt={item.products?.name}
                                  className="profile__order-item-img"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div className="profile__order-item-info">
                                  <span className="profile__order-item-name">
                                    {item.products?.name || 'Unknown'}
                                  </span>
                                  <span className="profile__order-item-meta">
                                    Qty: {item.quantity} × ₹{parseFloat(item.price_at_purchase).toFixed(2)}
                                  </span>
                                </div>
                                <span className="profile__order-item-total">
                                  ₹{(item.quantity * parseFloat(item.price_at_purchase)).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="profile__orders-loading">Loading items…</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
