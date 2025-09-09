import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
import InvoiceItemsTable from './InvoiceItemsTable';
import InvoiceCalculations from './InvoiceCalculations';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [items, setItems] = useState([
    { description: '', hsn_code: '', qty: '', rate: '', amount: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buyers, setBuyers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [isSelectingBusiness, setIsSelectingBusiness] = useState(false);
  const [gstRate, setGstRate] = useState(18.0);
  const [taxType, setTaxType] = useState('igst'); // 'igst' or 'cgst_sgst'

  // Session storage keys
  const SESSION_KEY = 'invoice_form_session';
  const ITEMS_KEY = 'invoice_items_session';
  const SELECTION_KEY = 'invoice_selection_session';

  // Watch form values for calculations
  const watchedValues = watch();

  // Load saved data on component mount
  useEffect(() => {
    loadSessionData();
    fetchBuyers();
    fetchBusinesses();
    fetchProducts();
  }, [loadSessionData]);

  // Fetch available buyers
  const fetchBuyers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/buyers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setBuyers(data.buyers || []);
      
      // No auto-selection - let user choose manually
    } catch (error) {
      console.error('Error fetching buyers:', error);
    }
  };

  // Fetch available businesses
  const fetchBusinesses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sellers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setBusinesses(data.sellers || []);
      
      // No auto-selection - let user choose manually
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  // Fetch available products
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      // Products fetched but not stored in state since not used in component
      console.log('Products fetched:', data.products?.length || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    saveSessionData();
  }, [watchedValues, items, selectedBusinessId, selectedBuyerId, gstRate, saveSessionData]);

  // Load session data from localStorage
  const loadSessionData = useCallback((restoreSelections = false) => {
    try {
      const savedFormData = localStorage.getItem(SESSION_KEY);
      const savedItems = localStorage.getItem(ITEMS_KEY);
      const savedSelections = localStorage.getItem(SELECTION_KEY);

      if (savedFormData) {
        const formData = JSON.parse(savedFormData);
        // Set form values
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) {
            setValue(key, formData[key]);
          }
        });
      }

      if (savedItems) {
        const parsedItems = JSON.parse(savedItems);
        if (parsedItems && parsedItems.length > 0) {
          setItems(parsedItems);
        }
      }

      // Only restore selections if explicitly requested
      if (restoreSelections && savedSelections) {
        const selections = JSON.parse(savedSelections);
        if (selections.selectedBusinessId) {
          setSelectedBusinessId(selections.selectedBusinessId);
        }
        if (selections.selectedBuyerId) {
          setSelectedBuyerId(selections.selectedBuyerId);
        }
        if (selections.gstRate) {
          setGstRate(parseFloat(selections.gstRate));
        }
        if (selections.taxType) {
          setTaxType(selections.taxType);
        }
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  }, [setValue]);

  // Save session data to localStorage
  const saveSessionData = useCallback(() => {
    try {
      const formData = watchedValues;
      localStorage.setItem(SESSION_KEY, JSON.stringify(formData));
      localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
      
      // Save selections
      const selections = {
        selectedBusinessId,
        selectedBuyerId,
        gstRate,
        taxType
      };
      localStorage.setItem(SELECTION_KEY, JSON.stringify(selections));
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }, [watchedValues, items, selectedBusinessId, selectedBuyerId, gstRate, taxType]);

  // Clear session data (for new invoice)
  const clearSessionData = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(ITEMS_KEY);
      localStorage.removeItem(SELECTION_KEY);
      
      // Reset form to default values
      setItems([{ description: '', hsn_code: '', qty: '', rate: '', amount: 0 }]);
      
      // Reset selections
      setSelectedBusinessId('');
      setSelectedBuyerId('');
      setTaxType('igst');
      
      // Reset form fields
      const form = document.querySelector('form');
      if (form) {
        form.reset();
      }
      
      toast.success('Form cleared for new invoice');
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  };

  // Calculate totals based on tax type. Round off always added (ceil).
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + (qty * rate);
    }, 0);
    
    let cgst = 0, sgst = 0, igst = 0;
    
    if (taxType === 'cgst_sgst') {
      // CGST + SGST (split equally)
      cgst = subtotal * (gstRate / 200); // Half of total GST rate
      sgst = subtotal * (gstRate / 200); // Half of total GST rate
    } else {
      // IGST only
      igst = subtotal * (gstRate / 100);
    }
    
    const totalBeforeRoundOff = subtotal + cgst + sgst + igst;
    const roundOff = Math.ceil(totalBeforeRoundOff) - totalBeforeRoundOff; // always >= 0
    const total = totalBeforeRoundOff + roundOff;
    return { subtotal, cgst, sgst, igst, roundOff, total };
  };

  const totals = calculateTotals();

  // Update item
  const updateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    if (field === 'qty' || field === 'rate') {
      const qty = parseFloat(updatedItems[index].qty) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].amount = qty * rate;
    }
    
    setItems(updatedItems);
  };

  // Add new item
  const addItem = () => {
    setItems([...items, { description: '', hsn_code: '', qty: '', rate: '', amount: 0 }]);
  };

  // Remove item
  const removeItem = (index) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
    }
  };


  // Handle business selection change with immediate feedback
  const handleBusinessChange = (businessId) => {
    setIsSelectingBusiness(true);
    setSelectedBusinessId(businessId);
    
    // Clear loading state after a short delay to show the change
    setTimeout(() => {
      setIsSelectingBusiness(false);
    }, 100);
  };

  // Form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Validate items
      const validItems = items.filter(item => {
        const qty = parseFloat(item.qty) || 0;
        const rate = parseFloat(item.rate) || 0;
        return item.description.trim() && qty > 0 && rate >= 0;
      });
      
      if (validItems.length === 0) {
        toast.error('Please add at least one valid item');
        return;
      }

        if (!selectedBuyerId) {
          toast.error('Please select a buyer');
          return;
        }
        if (!selectedBusinessId) {
          toast.error('Please select a business');
          return;
        }

      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (!currentUser) {
        toast.error('Please login to create invoices');
        return;
      }

      // Get selected business and buyer details
      const selectedBusiness = businesses.find(b => b.id === parseInt(selectedBusinessId));
      if (!selectedBusiness) {
        toast.error('Selected business not found');
        return;
      }
      
      const buyerResponse = await fetch(`http://localhost:5000/api/buyers/${selectedBuyerId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const buyerData = await buyerResponse.json();
      
      if (!buyerData.buyer) {
        toast.error('Failed to fetch buyer details');
        return;
      }
      
      const invoiceData = {
        seller_id: parseInt(selectedBusinessId),
        buyer_id: parseInt(selectedBuyerId),
        date: data.date || new Date().toISOString().split('T')[0],
        invoice_number: data.invoice_number,
        seller_name: selectedBusiness.business_name,
        seller_address: selectedBusiness.business_address,
        seller_gstin: selectedBusiness.gstin,
        seller_contact: selectedBusiness.contact_number,
        seller_bank_name: selectedBusiness.bank_name,
        seller_bank_account: selectedBusiness.bank_account_number,
        seller_bank_ifsc: selectedBusiness.bank_ifsc_code,
        buyer_name: buyerData.buyer.business_name,
        buyer_address: buyerData.buyer.business_address,
        buyer_state: buyerData.buyer.state,
        buyer_state_code: buyerData.buyer.state_code,
        buyer_gstin: buyerData.buyer.gstin,
        items: validItems.map((item, index) => ({
          serial_number: index + 1,
          description: item.description,
          hsn_code: item.hsn_code,
          qty: parseFloat(item.qty) || 0,
          rate: parseFloat(item.rate) || 0,
          gst_rate: gstRate
        })),
        tax_type: taxType,
        notes: data.notes || ''
      };

      const response = await invoiceAPI.createInvoice(invoiceData);
      toast.success('Invoice created successfully!');
      
      // Clear session data after successful creation
      clearSessionData();
      
      navigate(`/preview/${response.invoice.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {isSelectingBusiness ? (
              'Switching Business...'
            ) : selectedBusinessId && businesses.find(b => b.id === parseInt(selectedBusinessId))?.business_name ? (
              `Create Invoice - ${businesses.find(b => b.id === parseInt(selectedBusinessId)).business_name}`
            ) : (
              'Create GST Invoice'
            )}
          </h1>
          <button
            type="button"
            onClick={clearSessionData}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
          >
            Create New Invoice
          </button>
        </div>
        
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Business Selection */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Business Selection</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Your Business *
              </label>
              <select
                value={selectedBusinessId}
                onChange={(e) => handleBusinessChange(e.target.value)}
                disabled={isSelectingBusiness}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSelectingBusiness ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="">Select your business</option>
                {businesses.map(business => (
                  <option key={business.id} value={business.id}>
                    {business.business_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buyer Selection */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Buyer Selection</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Buyer *
              </label>
              <select
                value={selectedBuyerId}
                onChange={(e) => setSelectedBuyerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a buyer</option>
                {buyers.map(buyer => (
                  <option key={buyer.id} value={buyer.id}>
                    {buyer.business_name} ({buyer.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Invoice Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  {...register('invoice_number', { required: 'Invoice number is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter invoice number (e.g., 001, 2024001)"
                />
                {errors.invoice_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.invoice_number.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  {...register('date', { required: 'Invoice date is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Type
                </label>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="igst">IGST (Inter-state)</option>
                  <option value="cgst_sgst">CGST + SGST (Intra-state)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="28"
                  step="0.01"
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter GST rate (e.g., 18)"
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <InvoiceItemsTable
            items={items}
            onUpdateItem={updateItem}
            onAddItem={addItem}
            onRemoveItem={removeItem}
          />

          {/* Calculations */}
          <InvoiceCalculations totals={totals} gstRate={gstRate} taxType={taxType} />

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/history')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
