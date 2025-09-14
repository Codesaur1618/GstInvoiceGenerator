import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SellerManagement = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
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
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/sellers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSellers(data.sellers || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast.error('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/sellers', {
        method: editingSeller ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          id: editingSeller?.id
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(editingSeller ? 'Seller updated successfully!' : 'Seller created successfully!');
        setShowForm(false);
        setEditingSeller(null);
        resetForm();
        fetchSellers();
      } else {
        toast.error(result.error || 'Failed to save seller');
      }
    } catch (error) {
      console.error('Error saving seller:', error);
      toast.error('Failed to save seller');
    }
  };

  const handleEdit = (seller) => {
    setEditingSeller(seller);
    setFormData({
      business_name: seller.business_name || '',
      business_address: seller.business_address || '',
      gstin: seller.gstin || '',
      contact_number: seller.contact_number || '',
      email: seller.email || '',
      bank_name: seller.bank_name || '',
      bank_account_number: seller.bank_account_number || '',
      bank_ifsc_code: seller.bank_ifsc_code || '',
      state: seller.state || '',
      state_code: seller.state_code || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this seller?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/sellers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Seller deleted successfully!');
        fetchSellers();
      } else {
        toast.error('Failed to delete seller');
      }
    } catch (error) {
      console.error('Error deleting seller:', error);
      toast.error('Failed to delete seller');
    }
  };

  const resetForm = () => {
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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Seller Management</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingSeller(null);
              resetForm();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add New Seller
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {editingSeller ? 'Edit Seller' : 'Add New Seller'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address
                </label>
                <textarea
                  name="business_address"
                  value={formData.business_address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  maxLength="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  name="bank_ifsc_code"
                  value={formData.bank_ifsc_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State Code
                </label>
                <input
                  type="text"
                  name="state_code"
                  value={formData.state_code}
                  onChange={handleInputChange}
                  maxLength="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="md:col-span-2 flex space-x-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  {editingSeller ? 'Update Seller' : 'Add Seller'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSeller(null);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {sellers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No sellers found</h3>
            <p className="text-gray-500 mb-6">Add your first seller/company to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Business Name</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">GSTIN</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">State</th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Contact</th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">
                      <div>
                        <p className="font-medium">{seller.business_name}</p>
                        {seller.business_address && (
                          <p className="text-sm text-gray-500">{seller.business_address}</p>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3">{seller.gstin || '-'}</td>
                    <td className="border border-gray-300 px-4 py-3">{seller.state || '-'}</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <div>
                        {seller.contact_number && <p className="text-sm">{seller.contact_number}</p>}
                        {seller.email && <p className="text-sm text-gray-500">{seller.email}</p>}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(seller)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(seller.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
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
};

export default SellerManagement;
