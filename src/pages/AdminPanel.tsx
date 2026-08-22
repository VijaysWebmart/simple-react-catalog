import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import AdminLogin from '../components/AdminLogin';
import AdminSidebar from '../components/AdminSidebar';
import AdminDashboard from '../components/AdminDashboard';
import OrdersTable from '../components/OrdersTable';
import CategoryManager from '../components/CategoryManager';
import ProductForm from '../components/ProductForm';
import SliderForm from '../components/SliderForm';
import { useProductStore } from '../store/productStore';
import { useSliderStore } from '../store/sliderStore';
import { supabase } from '../integrations/supabase/client';

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const { products, fetchProducts, deleteProduct } = useProductStore();
  const { sliderImages, fetchSliderImages, deleteSliderImage } = useSliderStore();
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSliderForm, setShowSliderForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingSlider, setEditingSlider] = useState(null);

  useEffect(() => {
    let active = true;
    const verifyAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.functions.invoke('admin-login');
      if (!active || error || !data?.adminUser) return;
      setIsAuthenticated(true);
      setAdminUser(data.adminUser);
    };
    verifyAdmin();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
      fetchSliderImages();
    }
  }, [isAuthenticated, fetchProducts, fetchSliderImages]);

  const handleLogin = (userData: any) => {
    setIsAuthenticated(true);
    setAdminUser(userData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAdminUser(null);
    setActiveTab('dashboard');
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
    return <AdminLogin onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                <p className="text-gray-600">Manage your product catalog</p>
              </div>
              <button
                onClick={() => setShowProductForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                Add Product
              </button>
            </div>
            
            {/* Products table - keeping existing functionality */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                                <div className="text-sm text-gray-500">{product.sku || 'No SKU'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{product.price}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock_quantity || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              product.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                Delete
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
          </div>
        );
      case 'categories':
        return <CategoryManager />;
      case 'orders':
        return <OrdersTable />;
      case 'customers':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">Customer management features coming soon...</p>
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Payment Transactions</h1>
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">Payment transaction management coming soon...</p>
            </div>
          </div>
        );
      case 'shipping':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Shipping Management</h1>
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">Shipping management features coming soon...</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">Reports and analytics coming soon...</p>
            </div>
          </div>
        );
      case 'admins':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">Admin user management coming soon...</p>
            </div>
          </div>
        );
      case 'activity':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">Activity logs coming soon...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">Store settings coming soon...</p>
            </div>
          </div>
        );
      case 'sliders':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Slider Images</h1>
                <p className="text-gray-600">Manage homepage slider images</p>
              </div>
              <button
                onClick={() => setShowSliderForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                Add Slider
              </button>
            </div>
            
            {sliderImages.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
                <p>No slider images available. Add your first slider image to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sliderImages.map((slider) => (
                  <div key={slider.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
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
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSlider(slider.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        adminUser={adminUser}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/" className="text-blue-600 hover:text-blue-800 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
              </div>
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

        {/* Content Area */}
        <div className="flex-1 p-6">
          {renderContent()}
        </div>
      </div>

      {/* Modals */}
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
