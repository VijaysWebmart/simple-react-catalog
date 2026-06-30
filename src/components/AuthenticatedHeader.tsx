
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCartStore } from '../store/cartStore';
import CartDrawer from './CartDrawer';
import CheckoutForm from './CheckoutForm';

const AuthenticatedHeader = () => {
  const { user, signOut } = useAuth();
  const { items, fetchCartItems } = useCartStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCartItems();
    }
  }, [user, fetchCartItems]);

  const cartItemsCount = items.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-gray-800">
              Noorvi
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link to="/products" className="text-gray-600 hover:text-gray-900 transition-colors">Products</Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => setCartOpen(true)}
                    className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    )}
                  </button>
                  
                  <div className="hidden md:block relative group">
                    <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                      <User className="w-5 h-5" />
                      <span className="max-w-[180px] truncate">{user.email}</span>
                    </button>
                    <div className="absolute right-0 top-full pt-2 w-56 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity z-50">
                      <div className="bg-white rounded-lg shadow-lg border py-2">
                        <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Orders</Link>
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</Link>
                        <Link to="/cart" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Cart</Link>
                        <div className="border-t my-1" />
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2">
                          <LogOut className="w-4 h-4" /> Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Login
                </Link>
              )}
              
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          
          {menuOpen && (
            <div className="mt-4 md:hidden">
              <nav className="flex flex-col space-y-2 pb-4">
                <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors py-2">Home</Link>
                <Link to="/products" className="text-gray-600 hover:text-gray-900 transition-colors py-2">Products</Link>
                <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors py-2">About</Link>
                <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors py-2">Contact</Link>
                {user && (
                  <>
                    <div className="border-t my-2" />
                    <Link to="/orders" className="text-gray-600 hover:text-gray-900 transition-colors py-2">My Orders</Link>
                    <Link to="/profile" className="text-gray-600 hover:text-gray-900 transition-colors py-2">My Profile</Link>
                    <button onClick={handleLogout} className="text-left text-red-600 hover:text-red-700 transition-colors py-2">Logout</button>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutForm
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </>
  );
};

export default AuthenticatedHeader;
