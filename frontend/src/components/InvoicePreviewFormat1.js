import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoicePreviewFormat1 = ({ invoice: propInvoice }) => {
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
      setInvoice(data.invoice); // Extract invoice from response
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

      {/* Invoice Preview - Original Format */}
      <div id="invoice-preview" className="invoice-container p-8">
        {/* Top-left Invoice Details */}
        <div className="mb-6">
          <div className="text-sm">
            <p><strong>GSTIN:</strong> {invoice.seller_gstin}</p>
            <p><strong>Invoice No:</strong> {invoice.invoice_number}</p>
            <p><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Header */}
        <div className="invoice-header">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {invoice.seller_name || 'Your Business Name'}
              </h1>
              {invoice.seller_address && (
                <p className="text-gray-600 mb-1">{invoice.seller_address}</p>
              )}
              {invoice.seller_contact && (
                <p className="text-gray-600">Contact: {invoice.seller_contact}</p>
              )}
            </div>
            
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">TAX INVOICE</h2>
            </div>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="invoice-section">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Bill To:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800">{invoice.buyer_name}</p>
            {invoice.buyer_address && (
              <p className="text-gray-600 mt-1">{invoice.buyer_address}</p>
            )}
            {invoice.buyer_gstin && (
              <p className="text-gray-600">GSTIN: {invoice.buyer_gstin}</p>
            )}
            {invoice.buyer_state && (
              <p className="text-gray-600">State: {invoice.buyer_state} ({invoice.buyer_state_code})</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="invoice-section">
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="w-16">S.No</th>
                <th className="w-80">Description of Goods/Services</th>
                <th className="w-24">HSN Code</th>
                <th className="w-32">Qty</th>
                <th className="w-32">Rate</th>
                <th className="w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td className="text-center">{item.serial_number}</td>
                  <td>
                    <div>
                      <div>{item.description}</div>
                      <div className="text-sm text-gray-600">Safety Matches</div>
                    </div>
                  </td>
                  <td className="text-center">{item.hsn_code || '-'}</td>
                  <td className="text-right">{item.qty}</td>
                  <td className="text-right">₹{(item.rate || 0).toFixed(2)}</td>
                  <td className="text-right">₹{(item.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="invoice-total-section">
          <table className="invoice-total-table">
            <tbody>
              <tr>
                <td className="font-semibold">Subtotal:</td>
                <td className="text-right">₹{(invoice.subtotal || 0).toFixed(2)}</td>
              </tr>
              
              {invoice.cgst > 0 && (
                <>
                  <tr>
                    <td>CGST @ {(invoice.items?.[0]?.gst_rate || 18) / 2}%:</td>
                    <td className="text-right">₹{(invoice.cgst || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>SGST @ {(invoice.items?.[0]?.gst_rate || 18) / 2}%:</td>
                    <td className="text-right">₹{(invoice.sgst || 0).toFixed(2)}</td>
                  </tr>
                </>
              )}
              
              {invoice.igst > 0 && (
                <tr>
                  <td>IGST @ {invoice.items?.[0]?.gst_rate || 18}%:</td>
                  <td className="text-right">₹{(invoice.igst || 0).toFixed(2)}</td>
                </tr>
              )}
              
              <tr>
                <td>Round Off:</td>
                <td className="text-right">+₹{Math.abs(invoice.round_off || 0).toFixed(2)}</td>
              </tr>
              
              <tr className="bg-gray-100 font-bold text-lg">
                <td>Total:</td>
                <td className="text-right">₹{(invoice.total || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in Words */}
        <div className="invoice-section">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Amount in words:</span><br />
              {invoice.total_in_words}
            </p>
          </div>
        </div>

        {/* Bank Details */}
        {(invoice.seller_bank_name || invoice.seller_bank_account || invoice.seller_bank_ifsc) && (
          <div className="invoice-section">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Bank Details:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {invoice.seller_bank_name && (
                <p className="text-gray-600">Bank: {invoice.seller_bank_name}</p>
              )}
              {invoice.seller_bank_account && (
                <p className="text-gray-600">Account No: {invoice.seller_bank_account}</p>
              )}
              {invoice.seller_bank_ifsc && (
                <p className="text-gray-600">IFSC: {invoice.seller_bank_ifsc}</p>
              )}
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="invoice-section">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Terms & Conditions:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Payment due within 30 days of invoice date</p>
            <p>• Interest @ 18% p.a. will be charged on overdue amounts</p>
            <p>• Goods once sold will not be taken back</p>
            <p>• Subject to jurisdiction of local courts</p>
          </div>
        </div>

        {/* Signature */}
        <div className="invoice-section mt-12">
          <div className="flex justify-between">
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

export default InvoicePreviewFormat1;
