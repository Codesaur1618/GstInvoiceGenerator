import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatIndianCurrency, formatIndianNumber, formatIndianDate } from '../utils/currencyFormatter';

const InvoicePreviewFormat3 = ({ invoice: propInvoice }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(propInvoice);
  const [loading, setLoading] = useState(!propInvoice);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!propInvoice) {
      fetchInvoice();
    }
  }, [id, propInvoice]);

  const fetchInvoice = async () => {
    try {
      const data = await invoiceAPI.getInvoiceById(id);
      setInvoice(data.invoice);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById('invoice-preview');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Set PDF title to seller's name
      pdf.setProperties({
        title: invoice.seller_name || 'Invoice'
      });
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`invoice-${invoice.invoice_number}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Buttons */}
      <div className="no-print mb-6 flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            ← Back to Form
          </button>
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            📋 View History
          </button>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="print-button"
          >
            🖨️ Print Invoice
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="download-button disabled:opacity-50"
          >
            {isGeneratingPDF ? '⏳ Generating...' : '📄 Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice Preview - Exact Format Specification */}
      <div id="invoice-preview" className="invoice-container p-8 bg-white">
        {/* Top-left Invoice Details */}
        <div className="mb-6">
          <div className="text-sm">
            <p><strong>GSTIN:</strong> {invoice.seller_gstin || 'Your GSTIN'}</p>
            <p><strong>Invoice Serial Number:</strong> {invoice.invoice_number || 'Your Invoice Number'}</p>
            <p><strong>Date:</strong> {formatIndianDate(invoice.date) || new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Seller Details */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Seller Details</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-2xl font-bold"><strong>Company Name:</strong> {invoice.seller_name || 'Your Business Name'}</p>
            <p><strong>Address:</strong> {invoice.seller_address || 'Your Business Address'}</p>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Buyer Details (Billed To)</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><strong>Company Name:</strong> {invoice.buyer_name || 'Buyer Company Name'}</p>
            <p><strong>Address:</strong> {invoice.buyer_address || 'Buyer Address'}</p>
            <p><strong>State:</strong> {invoice.buyer_state || 'Buyer State'}</p>
            <p><strong>State Code:</strong> {invoice.buyer_state_code || 'Buyer State Code'}</p>
            <p><strong>GSTIN:</strong> {invoice.buyer_gstin || 'Buyer GSTIN'}</p>
          </div>
        </div>

        {/* Item Details Table */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Item Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1 text-left">S.No</th>
                  <th className="border border-gray-400 px-2 py-1 text-left w-80">Description of Goods</th>
                  <th className="border border-gray-400 px-2 py-1 text-left">HSN Code</th>
                  <th className="border border-gray-400 px-2 py-1 text-right w-32">Qty</th>
                  <th className="border border-gray-400 px-2 py-1 text-right w-32">Rate (₹)</th>
                  <th className="border border-gray-400 px-2 py-1 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.serial_number}</td>
                    <td className="border border-gray-400 px-2 py-1">
                      <div>
                        <div>{item.description || '"MUSHROOM TWENTY ONE"'}</div>
                        <div className="text-sm text-gray-600">Safety Matches</div>
                      </div>
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center">{item.hsn_code || '3605'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-right">{formatIndianNumber(item.qty) || '512'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-right">{formatIndianNumber(item.rate) || '252.00'}</td>
                    <td className="border border-gray-400 px-2 py-1 text-right">{formatIndianNumber(item.amount) || '1,29,024.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Financial Summary</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span><strong>Total:</strong></span>
                <span>{formatIndianCurrency(invoice.subtotal) || '₹1,29,024.00'}</span>
              </div>
              {invoice.igst > 0 && (
                <div className="flex justify-between">
                  <span><strong>IGST ({invoice.items?.[0]?.gst_rate || 18}%):</strong></span>
                  <span>{formatIndianCurrency(invoice.igst)}</span>
                </div>
              )}
              {invoice.cgst > 0 && (
                <>
                  <div className="flex justify-between">
                    <span><strong>CGST ({(invoice.items?.[0]?.gst_rate || 18) / 2}%):</strong></span>
                    <span>{formatIndianCurrency(invoice.cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span><strong>SGST ({(invoice.items?.[0]?.gst_rate || 18) / 2}%):</strong></span>
                    <span>{formatIndianCurrency(invoice.sgst)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span><strong>Round Off:</strong></span>
                <span>+{formatIndianCurrency(Math.abs(invoice.round_off))}</span>
              </div>
              <div className="flex justify-between border-t border-gray-400 pt-2 font-bold text-lg">
                <span><strong>Invoice Total:</strong></span>
                <span>{formatIndianCurrency(invoice.total) || '₹1,44,507.00'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-bold">Amount in Words:</span> {invoice.total_in_words || 'ONE LAKH FORTY FOUR THOUSAND FIVE HUNDRED AND SEVEN ONLY'}
            </p>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Payment Details</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><strong>Bank Name:</strong> {invoice.seller_bank_name || 'Axis Bank, Sattur Branch'}</p>
            <p><strong>Account No.:</strong> {invoice.seller_bank_account || '917020073159080'}</p>
            <p><strong>IFSC Code:</strong> {invoice.seller_bank_ifsc || 'UTIB0002760'}</p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Terms & Conditions</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-700 space-y-1">
              <p>• Interest at 12% will be charged on these bills.</p>
              <p>• Subject to Sattur Jurisdiction.</p>
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="mt-12">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-gray-600">Thank you for your business!</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <img 
                  src="/signature.png" 
                  alt="Signature" 
                  className="h-16 w-auto mx-auto object-contain"
                  style={{ maxHeight: '64px', maxWidth: '200px' }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewFormat3;