
import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import ProductsPage from './ProductsPage';
import ProductPage from './ProductPage';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import AdminPanel from './AdminPanel';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
};

export default Index;
