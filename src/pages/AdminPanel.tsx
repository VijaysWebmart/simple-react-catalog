
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft, LogOut, Image, ShoppingBag } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useSliderStore } from '../store/sliderStore';
import ProductForm from '../components/ProductForm';
import SliderForm from '../components/SliderForm';
import OrdersTable from '../components/OrdersTable';
import AdminAuth from '../components/AdminAuth';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const { products, fetchProducts, deleteProduct } = useProductStore();
  const { sliderImages, fetchSliderImages, deleteSliderImage } = useSliderStore();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSliderForm, setShowSliderForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSlider, setEditingSlider] = useState(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuth');
    setIsAuthenticated(authStatus === 'true');
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
      fetchSliderImages();
    }
  }, [isAuthenticated, fetchProducts, fetchSliderImages]);

  const handleLogin = (success: boolean) => {
    setIsAuthenticated(success);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
    }
  };

  const handleEditSlider = (slider: any) => {
    setEditingSlider(slider);
    setShowSliderForm(true);
  };

  const handleDeleteSlider = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this slider image?')) {
      await deleteSliderImage(id);
    }
  };

  const handleCloseProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleCloseSliderForm = () => {
    setShowSliderForm(false);
    setEditingSlider(null);
  };

  if (!isAuthenticated) {
    return <AdminAuth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              {activeTab === 'products' ? (
                <button
                  onClick={() => setShowProductForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              ) : activeTab === 'sliders' ? (
                <button
                  onClick={() => setShowSliderForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Image className="w-4 h-4" />
                  Add Slider
                </button>
              ) : null}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Products ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('sliders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sliders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Slider Images ({sliderImages.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingBag className="w-4 h-4 inline mr-1" />
                Orders
              </button>
            </nav>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && <OrdersTable />}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Product Catalog</h2>
            </div>
            
            {products.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No products available. Add your first product to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={product.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop'}
                              alt={product.name}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{product.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Slider Images Tab */}
        {activeTab === 'sliders' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Slider Images</h2>
            </div>
            
            {sliderImages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No slider images available. Add your first slider image to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {sliderImages.map((slider) => (
                  <div key={slider.id} className="bg-gray-50 rounded-lg overflow-hidden">
                    <img
                      src={slider.image_url}
                      alt={slider.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{slider.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{slider.subtitle}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Order: {slider.display_order}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            slider.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {slider.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditSlider(slider)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlider(slider.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleCloseProductForm}
        />
      )}

      {showSliderForm && (
        <SliderForm
          sliderImage={editingSlider}
          onClose={handleCloseSliderForm}
        />
      )}
    </div>
  );
};

export default AdminPanel;
