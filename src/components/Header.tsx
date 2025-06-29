
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Noorvi</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-blue-600 transition-colors">
              Products
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/cart"
              className="p-2 text-gray-700 hover:text-blue-600 transition-colors relative"
            >
              <ShoppingCart className="w-6 h-6" />
            </Link>
            
            <div className="flex items-center space-x-2">
              <Link
                to="/auth"
                className="flex items-center space-x-1 px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
              <Link
                to="/auth"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
            
            <div className="hidden sm:block text-sm text-gray-600">
              Call: +91 9168585280
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
