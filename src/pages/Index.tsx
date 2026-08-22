
import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import ProductsPage from './ProductsPage';
import ProductPage from './ProductPage';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import AdminPanel from './AdminPanel';
import AuthPage from './AuthPage';
import CartPage from './CartPage';
import PaymentCallbackPage from './PaymentCallbackPage';
import MyOrdersPage from './MyOrdersPage';
import OrderDetailPage from './OrderDetailPage';
import ProfilePage from './ProfilePage';
import AdminResetPasswordPage from './AdminResetPasswordPage';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/payment-callback" element={<PaymentCallbackPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </div>
  );
};

export default Index;
