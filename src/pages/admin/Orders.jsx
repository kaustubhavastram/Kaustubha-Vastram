import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ORDER_STATUSES } from '../../lib/constants';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(email, full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrderItems(orderId) {
    if (orderItems[orderId]) return; // Already fetched

    const { data, error } = await supabase
      .from('order_items')
      .select('*, products(name, image_url)')
      .eq('order_id', orderId);

    if (!error) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
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

  function getStatusClass(status) {
    const map = {
      pending: 'status--pending',
      paid: 'status--paid',
      failed: 'status--failed',
      shipped: 'status--shipped',
      delivered: 'status--delivered',
      cancelled: 'status--cancelled',
    };
    return map[status] || '';
  }

  const filtered =
    filterStatus === 'all'
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  if (loading) {
    return (
      <div className="admin__content">
        <h1>Orders</h1>
        <div className="admin__loading">Loading orders…</div>
      </div>
    );
  }

  return (
    <div className="admin__content">
      <h1>Orders</h1>

      <div className="admin__toolbar">
        <div className="admin__filters">
          <button
            className={`admin__filter-btn${filterStatus === 'all' ? ' active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({orders.length})
          </button>
          {ORDER_STATUSES.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                className={`admin__filter-btn${filterStatus === s ? ' active' : ''}`}
                onClick={() => setFilterStatus(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="admin__empty">No orders found.</p>
      ) : (
        <table className="admin__table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment ID</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <>
                <tr
                  key={order.id}
                  className={`admin__row${expandedOrder === order.id ? ' admin__row--expanded' : ''}`}
                  onClick={() => toggleExpand(order.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="admin__mono">{order.id.slice(0, 8)}…</td>
                  <td>{order.profiles?.email || 'N/A'}</td>
                  <td>₹{parseFloat(order.total).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="admin__mono">
                    {order.razorpay_payment_id
                      ? order.razorpay_payment_id.slice(0, 12) + '…'
                      : '—'}
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className="admin__status-select"
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                {expandedOrder === order.id && (
                  <tr key={`${order.id}-detail`} className="admin__detail-row">
                    <td colSpan={7}>
                      <div className="admin__order-detail">
                        <h4>Order Items</h4>
                        {orderItems[order.id] ? (
                          <div className="admin__order-items">
                            {orderItems[order.id].map((item) => (
                              <div key={item.id} className="admin__order-item">
                                <img
                                  src={item.products?.image_url}
                                  alt={item.products?.name}
                                  className="admin__order-item-img"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <span>{item.products?.name || 'Unknown'}</span>
                                <span>×{item.quantity}</span>
                                <span>₹{parseFloat(item.price_at_purchase).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>Loading items…</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
