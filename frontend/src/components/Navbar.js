import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold text-gray-800">
              {user?.business_name || 'GST Invoice Generator'}
            </div>
            <div className="flex space-x-6">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Create Invoice
              </Link>
              <Link
                to="/history"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/history'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Invoice History
              </Link>
              <Link
                to="/businesses"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/businesses'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                My Businesses
              </Link>
              <Link
                to="/buyers"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/buyers'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Buyers
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user.business_name}</div>
                  <div className="text-gray-500 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            <div className="text-sm text-gray-500">
              v{process.env.REACT_APP_VERSION || '1.0.0'}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
