import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import InvoiceForm from './components/InvoiceForm';
import InvoiceHistory from './components/InvoiceHistory';
import InvoicePreview from './components/InvoicePreview';
import Navbar from './components/Navbar';
import BusinessManagement from './components/BusinessManagement';
import BuyerManagement from './components/BuyerManagement';

function App() {
  // Create a default user object to bypass authentication
  const [user] = useState({
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    business_name: 'GST Invoice Generator',
    business_address: 'Default Address',
    gstin: '123456789012345',
    contact_number: '1234567890',
    state: 'Default State',
    state_code: '01'
  });

  useEffect(() => {
    // Set document title
    document.title = 'GST Invoice Generator';
  }, []);

  const handleLogout = () => {
    // Since we're bypassing auth, just reload the page
    window.location.reload();
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<InvoiceForm />} />
            <Route path="/history" element={<InvoiceHistory />} />
            <Route path="/preview/:id" element={<InvoicePreview />} />
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
