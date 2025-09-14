import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
import toast from 'react-hot-toast';
import InvoicePreviewFormat4 from './InvoicePreviewFormat4';

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = useCallback(async () => {
    try {
      const data = await invoiceAPI.getInvoiceById(id);
      setInvoice(data.invoice); // Extract invoice from response
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchInvoice();
  }, [id, fetchInvoice]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Invoice not found</h2>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Always use Format4 (new specification format)
  return <InvoicePreviewFormat4 invoice={invoice} />;
};

export default InvoicePreview;
