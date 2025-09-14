import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const BusinessManagement = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [formData, setFormData] = useState({
    business_name: '',
    business_address: '',
    gstin: '',
    contact_number: '',
    email: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    state: '',
    state_code: ''
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || '/api'}/sellers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setBusinesses(data.sellers || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingBusiness 
        ? `${process.env.REACT_APP_API_URL || '/api'}/sellers`
        : `${process.env.REACT_APP_API_URL || '/api'}/sellers`;
      
      const method = editingBusiness ? 'PUT' : 'POST';
      
      const requestBody = editingBusiness 
        ? { ...formData, id: editingBusiness.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast.success(editingBusiness ? 'Business updated successfully!' : 'Business created successfully!');
        setShowForm(false);
        setEditingBusiness(null);
        setFormData({
          business_name: '',
          business_address: '',
          gstin: '',
          contact_number: '',
          email: '',
          bank_name: '',
          bank_account_number: '',
          bank_ifsc_code: '',
          state: '',
          state_code: ''
        });
        fetchBusinesses();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save business');
      }
    } catch (error) {
      console.error('Error saving business:', error);
      toast.error('Failed to save business');
    }
  };

  const handleEdit = (business) => {
    setEditingBusiness(business);
    setFormData({
      business_name: business.business_name || '',
      business_address: business.business_address || '',
      gstin: business.gstin || '',
      contact_number: business.contact_number || '',
      email: business.email || '',
      bank_name: business.bank_name || '',
      bank_account_number: business.bank_account_number || '',
      bank_ifsc_code: business.bank_ifsc_code || '',
      state: business.state || '',
      state_code: business.state_code || ''
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBusiness(null);
    setFormData({
      business_name: '',
      business_address: '',
      gstin: '',
      contact_number: '',
      email: '',
      bank_name: '',
      bank_account_number: '',
      bank_ifsc_code: '',
      state: '',
      state_code: ''
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Business Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add New Business
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              {editingBusiness ? 'Edit Business' : 'Add New Business'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address
                  </label>
                  <textarea
                    value={formData.business_address}
                    onChange={(e) => setFormData({...formData, business_address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.bank_ifsc_code}
                    onChange={(e) => setFormData({...formData, bank_ifsc_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State Code
                  </label>
                  <input
                    type="text"
                    value={formData.state_code}
                    onChange={(e) => setFormData({...formData, state_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingBusiness ? 'Update Business' : 'Create Business'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businesses.map((business) => (
            <div key={business.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{business.business_name}</h3>
                <button
                  onClick={() => handleEdit(business)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {business.business_address && (
                  <p><strong>Address:</strong> {business.business_address}</p>
                )}
                {business.gstin && (
                  <p><strong>GSTIN:</strong> {business.gstin}</p>
                )}
                {business.contact_number && (
                  <p><strong>Contact:</strong> {business.contact_number}</p>
                )}
                {business.email && (
                  <p><strong>Email:</strong> {business.email}</p>
                )}
                {business.bank_name && (
                  <p><strong>Bank:</strong> {business.bank_name}</p>
                )}
                {business.state && (
                  <p><strong>State:</strong> {business.state} ({business.state_code})</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessManagement;

