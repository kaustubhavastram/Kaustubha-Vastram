import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const ORDER_STATUSES = [
  "pending",
  "paid",
  "failed",
  "shipped",
  "delivered",
  "cancelled",
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState({});
  const [orderProfiles, setOrderProfiles] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      // First try with the join
      let { data, error } = await supabase
        .from("orders")
        .select("*, profiles(email, full_name, phone, address)")
        .order("created_at", { ascending: false });

      // If that fails, try without the join as fallback
      if (error || !data) {
        console.warn("Join query failed, trying without profiles join:", error);
        ({ data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }));
      }

      if (error) {
        console.error("Orders fetch error:", error);
        setError(error.message);
        throw error;
      }
      console.log("Orders fetched:", data);
      if (data && data.length > 0) {
        console.log("First order shipping_address:", data[0].shipping_address);
      }
      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to fetch orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrderItems(orderId) {
    if (orderItems[orderId]) return; // Already fetched

    const { data, error } = await supabase
      .from("order_items")
      .select("*, products(name, image_url)")
      .eq("order_id", orderId);

    if (!error) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  }

  async function fetchOrderProfile(userId) {
    if (orderProfiles[userId]) return; // Already fetched

    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name, phone, address")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setOrderProfiles((prev) => ({ ...prev, [userId]: data }));
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    }
  }

  function toggleExpand(orderId) {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      const order = orders.find(o => o.id === orderId);
      if (order && order.user_id) {
        fetchOrderProfile(order.user_id);
      }
      fetchOrderItems(orderId);
    }
  }

  function getStatusClass(status) {
    const map = {
      pending: "status--pending",
      paid: "status--paid",
      failed: "status--failed",
      shipped: "status--shipped",
      delivered: "status--delivered",
      cancelled: "status--cancelled",
    };
    return map[status] || "";
  }

  const filtered =
    filterStatus === "all"
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

      {error && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          background: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px',
          color: '#c33'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="admin__toolbar">
        <div className="admin__filters">
          <button
            className={`admin__filter-btn${filterStatus === "all" ? " active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            All ({orders.length})
          </button>
          {ORDER_STATUSES.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                className={`admin__filter-btn${filterStatus === s ? " active" : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="admin__empty">
          {orders.length === 0 
            ? "No orders found. Orders will appear here once customers place them." 
            : "No orders match the selected filter."}
        </p>
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
                  className={`admin__row${expandedOrder === order.id ? " admin__row--expanded" : ""}`}
                  onClick={() => toggleExpand(order.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td className="admin__mono">{order.id.slice(0, 8)}…</td>
                  <td>{order.profiles?.email || "N/A"}</td>
                  <td>₹{parseFloat(order.total).toFixed(2)}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="admin__mono">
                    {order.razorpay_payment_id
                      ? order.razorpay_payment_id.slice(0, 12) + "…"
                      : "—"}
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className="admin__status-select"
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order.id, e.target.value)
                      }
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
                        <div className="admin__order-info">
                          <div className="admin__info-section">
                            <h4>Customer Information</h4>
                            {orderProfiles[order.user_id] ? (
                              <>
                                <p><strong>Name:</strong> {orderProfiles[order.user_id]?.full_name || "N/A"}</p>
                                <p><strong>Email:</strong> {orderProfiles[order.user_id]?.email || "N/A"}</p>
                                <p><strong>Phone:</strong> {orderProfiles[order.user_id]?.phone || "N/A"}</p>
                              </>
                            ) : (
                              <p>Loading customer info…</p>
                            )}
                            <div style={{ marginTop: "1rem" }}>
                              <h4 style={{ marginBottom: "0.5rem" }}>Shipping Address</h4>
                              {order.shipping_address ? (
                                <>
                                  <p>{order.shipping_address.address || "N/A"}</p>
                                  {order.shipping_address.city && (
                                    <p>{order.shipping_address.city}{order.shipping_address.state ? `, ${order.shipping_address.state}` : ""} {order.shipping_address.postal_code || ""}</p>
                                  )}
                                </>
                              ) : orderProfiles[order.user_id]?.address ? (
                                <p>{orderProfiles[order.user_id].address}</p>
                              ) : (
                                <p>No address on file</p>
                              )}
                            </div>
                          </div>

                          <div className="admin__info-section">
                            <h4>Shipping</h4>
                            {order.awb_number || order.courier_name || order.tracking_url ? (
                              <div className="admin__shipping-info">
                                <p><strong>Courier:</strong> {order.courier_name || "—"}</p>
                                <p><strong>AWB:</strong> <span className="admin__mono">{order.awb_number || "—"}</span></p>
                                {order.shipping_status && (
                                  <p>
                                    <strong>Status:</strong>{" "}
                                    <span className={`status-badge ${getStatusClass(order.shipping_status)}`}>
                                      {order.shipping_status.replace(/_/g, " ")}
                                    </span>
                                  </p>
                                )}
                                {order.tracking_url && (
                                  <a
                                    href={order.tracking_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="admin__track-link"
                                  >
                                    Track Package →
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p className="admin__ship-note">
                                Shipping updates are managed separately for this order.
                              </p>
                            )}
                          </div>
                        </div>
                        <h4>Order Items</h4>
                        {orderItems[order.id] ? (
                          <div className="admin__order-items">
                            {orderItems[order.id].map((item) => (
                              <div key={item.id} className="admin__order-item">
                                <img
                                  src={item.products?.image_url}
                                  alt={item.products?.name}
                                  className="admin__order-item-img"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                                <span>{item.products?.name || "Unknown"}</span>
                                <span>×{item.quantity}</span>
                                <span>
                                  ₹
                                  {parseFloat(item.price_at_purchase).toFixed(
                                    2,
                                  )}
                                </span>
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
