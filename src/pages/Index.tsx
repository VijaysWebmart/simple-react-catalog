
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import ProductPage from './ProductPage';
import AdminPanel from './AdminPanel';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
};

export default Index;
