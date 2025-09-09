import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const InvoiceHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [deletingId, setDeletingId] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, sortBy, sortOrder]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoiceAPI.getInvoices(pagination.page, pagination.limit, sortBy, sortOrder);
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      setDeletingId(id);
      await invoiceAPI.deleteInvoice(id);
      toast.success('Invoice deleted successfully');
      fetchInvoices(); // Refresh the list
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (id) => {
    navigate(`/preview/${id}`);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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
          <h1 className="text-3xl font-bold text-gray-800">Invoice History</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Invoice
          </button>
        </div>

        {/* Sort Controls */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="invoice_number">Invoice Number</option>
              <option value="total">Total Amount</option>
              <option value="buyer_name">Buyer Name</option>
              <option value="created_at">Created Date</option>
            </select>
            
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {pagination.total > 0 && `Total: ${pagination.total} invoices`}
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-6">Create your first invoice to get started</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Invoice
            </button>
          </div>
        ) : (
          <>
            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Invoice No</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Date</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Buyer</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold">State</th>
                    <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total</th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-medium">
                        {invoice.invoice_number}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        {format(new Date(invoice.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        <div>
                          <p className="font-medium">{invoice.buyer_name}</p>
                          {invoice.buyer_gstin && (
                            <p className="text-sm text-gray-500">{invoice.buyer_gstin}</p>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3">
                        {invoice.buyer_state} ({invoice.buyer_state_code})
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                        ₹{invoice.total.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleView(invoice.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            disabled={deletingId === invoice.id}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {deletingId === invoice.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 border rounded-md ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Summary */}
            <div className="mt-6 text-sm text-gray-600 text-center">
              Showing {invoices.length} of {pagination.total} invoices
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceHistory;
