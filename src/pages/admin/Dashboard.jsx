import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    totalProducts: 0,
    paidOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch products count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const allOrders = orders || [];
      const paidOrders = allOrders.filter((o) => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered');
      const revenue = paidOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);

      setStats({
        totalOrders: allOrders.length,
        revenue,
        totalProducts: productCount || 0,
        paidOrders: paidOrders.length,
      });

      setRecentOrders(allOrders.slice(0, 5));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: '../src/logo/checkout.png' },
    { label: 'Revenue', value: `₹ ${stats.revenue.toFixed(2)}`, icon: '../src/logo/rupee-indian.png' },
    { label: 'Products', value: stats.totalProducts, icon: '../src/logo/products.png' },
    { label: 'Paid Orders', value: stats.paidOrders, icon: '../src/logo/check.png' },
  ];

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

  if (loading) {
    return (
      <div className="admin__content">
        <h1>Dashboard</h1>
        <div className="admin__loading">Loading dashboard data…</div>
      </div>
    );
  }

  return (
    <div className="admin__content">
      <h1>Dashboard</h1>

      <div className="admin__stats">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-card__icon"> 
              <img src={stat.icon} alt={`${stat.label} icon`} className="stat-card__image" />
            </div>
            <div className="stat-card__value">{stat.value}</div>
            <div className="stat-card__label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="admin__section">
        <h2>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="admin__empty">No orders yet.</p>
        ) : (
          <table className="admin__table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="admin__mono">{order.id.slice(0, 8)}…</td>
                  <td>₹{parseFloat(order.total).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
