
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import AuthenticatedHeader from '../components/AuthenticatedHeader';
import ImageSlider from '../components/ImageSlider';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {user ? <AuthenticatedHeader /> : <Header />}
      <ImageSlider />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Featured Products</h2>
        <ProductGrid />
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
