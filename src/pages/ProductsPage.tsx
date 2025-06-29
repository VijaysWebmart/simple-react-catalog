
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import AuthenticatedHeader from '../components/AuthenticatedHeader';
import Footer from '../components/Footer';
import ProductGrid from '../components/ProductGrid';

const ProductsPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {user ? <AuthenticatedHeader /> : <Header />}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our carefully curated collection of premium products, 
            each selected for quality and value.
          </p>
        </div>
        <ProductGrid />
      </div>
      <Footer />
    </div>
  );
};

export default ProductsPage;
