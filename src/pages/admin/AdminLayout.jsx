import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/admin.css';
import dashboard from "../../logo/dashboard.png";
import orders from "../../logo/clipboard.png";
import products from "../../logo/woman-clothes.png";

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="admin">
      <aside className="admin__sidebar">
        <div className="admin__brand">
          <a href="/" className="admin__logo">
            Kaustubha <em>Vastram</em>
          </a>
          <span className="admin__badge">Admin</span>
        </div>

        <nav className="admin__nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin__nav-link${isActive ? ' active' : ''}`
            }
          >
            <span className="admin__nav-icon"><img src={dashboard} alt="Dashboard"/></span>
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `admin__nav-link${isActive ? ' active' : ''}`
            }
          >
            <span className="admin__nav-icon"><img src={orders} alt="Orders"/></span>
            Orders
          </NavLink>
          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `admin__nav-link${isActive ? ' active' : ''}`
            }
          >
            <span className="admin__nav-icon"><img src={products} alt="Products"/></span>
            Products
          </NavLink>
        </nav>

        <div className="admin__footer">
          <div className="admin__user">
            <span className="admin__user-email">{user?.email}</span>
          </div>
          <button className="admin__signout" onClick={handleSignOut}>
            Sign Out
          </button>
          <a href="/" className="admin__back-link">
            ← Back to Store
          </a>
        </div>
      </aside>

      <main className="admin__main">
        <Outlet />
      </main>
    </div>
  );
}
