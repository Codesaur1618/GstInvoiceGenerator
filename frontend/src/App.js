import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import InvoiceForm from './components/InvoiceForm';
import InvoiceHistory from './components/InvoiceHistory';
import InvoicePreview from './components/InvoicePreview';
import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import ProductManagement from './components/ProductManagement';
import BusinessManagement from './components/BusinessManagement';
import BuyerManagement from './components/BuyerManagement';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        // Update document title with business name
        document.title = userData.business_name || 'GST Invoice Generator';
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.title = 'GST Invoice Generator';
      }
    } else {
      document.title = 'GST Invoice Generator';
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Update document title with business name
    document.title = userData.business_name || 'GST Invoice Generator';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Reset document title
    document.title = 'GST Invoice Generator';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoginForm onLogin={handleLogin} />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<InvoiceForm />} />
            <Route path="/history" element={<InvoiceHistory />} />
            <Route path="/preview/:id" element={<InvoicePreview />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/businesses" element={<BusinessManagement />} />
            <Route path="/buyers" element={<BuyerManagement />} />
          </Routes>
        </main>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
