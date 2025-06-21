
import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Settings } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ShopEase</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Products
            </Link>
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              About
            </Link>
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </nav>
          
          <Link
            to="/admin"
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
