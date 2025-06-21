
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Header from '../components/Header';
import ProductCarousel from '../components/ProductCarousel';
import { useProductStore } from '../store/productStore';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { products } = useProductStore();
  const product = products.find(p => p.id === parseInt(id || '0'));

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleBuyNow = () => {
    const message = `Hi! I'm interested in buying ${product.name} for ₹${product.price}. Please let me know the availability.`;
    const whatsappUrl = `https://wa.me/919168585280?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ProductCarousel images={product.images} />
          </div>
          
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-2xl font-semibold text-green-600">₹{product.price}</p>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Category</h3>
              <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {product.category}
              </span>
            </div>
            
            <button
              onClick={handleBuyNow}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Buy Now via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
