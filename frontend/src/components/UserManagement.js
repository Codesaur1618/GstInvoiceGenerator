import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'buyer',
    business_name: '',
    business_address: '',
    gstin: '',
    contact_number: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    state: '',
    state_code: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const userData = { ...formData };
      if (editingUser) {
        // For updates, don't send password if empty
        if (!userData.password) {
          delete userData.password;
        }
      }

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(editingUser ? 'User updated successfully!' : 'User created successfully!');
        setShowForm(false);
        setEditingUser(null);
        resetForm();
        fetchUsers();
      } else {
        toast.error(result.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Failed to save user');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't show existing password
      role: user.role,
      business_name: user.business_name || '',
      business_address: user.business_address || '',
      gstin: user.gstin || '',
      contact_number: user.contact_number || '',
      bank_name: user.bank_name || '',
      bank_account_number: user.bank_account_number || '',
      bank_ifsc_code: user.bank_ifsc_code || '',
      state: user.state || '',
      state_code: user.state_code || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'buyer',
      business_name: '',
      business_address: '',
      gstin: '',
      contact_number: '',
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
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingUser(null);
              resetForm();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add New User
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
              </div>
              
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
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
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

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Username</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Email</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Role</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Business Name</th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">State</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium">{user.username}</td>
                  <td className="border border-gray-300 px-4 py-3">{user.email}</td>
                  <td className="border border-gray-300 px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'seller' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">{user.business_name}</td>
                  <td className="border border-gray-300 px-4 py-3">{user.state || '-'}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
