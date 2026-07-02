import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import CartDrawer from "./components/cart/CartDrawer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ScrollToHash from "./components/ScrollToHash";
import LoginPrompt from "./components/auth/LoginPrompt";

import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import ShippingReturns from "./pages/ShippingReturns";
import SizeGuide from "./pages/SizeGuide";
import Contact from "./pages/Contact";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Orders from "./pages/admin/Orders";
import Products from "./pages/admin/Products";
import ProductForm from "./pages/admin/ProductForm";
import Messages from "./pages/admin/Messages";

import "./styles/index.css";
import "./styles/info-pages.css";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <AuthProvider>
        <CartProvider>
          <Header />
          <CartDrawer />
          <LoginPrompt />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/shipping-returns" element={<ShippingReturns />} />
            <Route path="/size-guide" element={<SizeGuide />} />
            <Route path="/contact" element={<Contact />} />

            {/* Admin routes — protected, admin only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id" element={<ProductForm />} />
              <Route path="messages" element={<Messages />} />
            </Route>
          </Routes>

          <Footer />
          <Analytics />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#2b2520',
                color: '#faf6f1',
                borderRadius: '8px',
                fontSize: '0.9rem',
              },
              duration: 2000,
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
