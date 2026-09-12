import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingCart,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <div className="app">
      <aside>
        <div className="brand">
          NEXUS<span>COMMERCE</span>
        </div>

        <nav>
          <NavLink to="/dashboard">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/products">
            <Package size={18} />
            <span>Products</span>
          </NavLink>

          <NavLink to="/orders">
            <ShoppingCart size={18} />
            <span>Orders</span>
          </NavLink>

          {/* Cart is shown only to customers */}
          {user?.role === 'CUSTOMER' && (
            <NavLink to="/cart">
              <ShoppingCart size={18} />
              <span>Cart ({itemCount})</span>
            </NavLink>
          )}
        </nav>

        <button
          className="logout"
          onClick={logout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <main>
        <header>
          <div>
            <p className="eyebrow">
              OPERATIONS CONTROL CENTER
            </p>

            <h1>
              Good to see you, {user?.name}
            </h1>
          </div>

          <div className="role">
            {user?.role}
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}