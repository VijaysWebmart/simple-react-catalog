
import React from 'react';
import Header from '../components/Header';
import ImageSlider from '../components/ImageSlider';
import ProductGrid from '../components/ProductGrid';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <ImageSlider />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Featured Products</h2>
        <ProductGrid />
      </div>
    </div>
  );
};

export default HomePage;
