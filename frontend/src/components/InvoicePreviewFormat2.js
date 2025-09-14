import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoicePreviewFormat2 = ({ invoice: propInvoice }) => {
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

      {/* Invoice Preview */}
      <div id="invoice-preview" className="invoice-container p-8">
        {/* Top-left Invoice Details */}
        <div className="mb-6">
          <div className="text-sm">
            <p><strong>GSTIN:</strong> {invoice.seller_gstin}</p>
            <p><strong>Invoice No.:</strong> {invoice.invoice_number}</p>
            <p><strong>Dated:</strong> {new Date(invoice.date).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Header */}
        <div className="invoice-header">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {invoice.seller_name || 'Your Business Name'}
              </h1>
              {invoice.seller_address && (
                <p className="text-gray-600 mb-1 text-sm">{invoice.seller_address}</p>
              )}
              <p className="text-gray-600 mb-1 text-sm">State Name: Tamil Nadu</p>
              <p className="text-gray-600 mb-1 text-sm">Code: 33</p>
              {invoice.seller_contact && (
                <p className="text-gray-600 text-sm">E-Mail: {invoice.seller_contact}</p>
              )}
            </div>
            
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">TAX INVOICE</h2>
            </div>
          </div>

          {/* Invoice Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p><strong>Delivery Note:</strong></p>
                <p><strong>Mode/Terms of Payment:</strong></p>
                <p><strong>Reference No. & Date:</strong></p>
                <p><strong>Other References:</strong></p>
              </div>
              <div>
                <p><strong>Buyer's Order No.:</strong></p>
                <p><strong>Dated:</strong></p>
                <p><strong>Dispatch Doc No.:</strong></p>
                <p><strong>Delivery Note Date:</strong></p>
                <p><strong>Dispatched through:</strong></p>
                <p><strong>Destination:</strong></p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p><strong>Bill of Lading/LR-RR No.:</strong></p>
                <p><strong>Motor Vehicle No.:</strong></p>
                <p><strong>Terms of Delivery:</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="invoice-section">
          <div className="grid grid-cols-2 gap-6">
            {/* Consignee (Ship to) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Consignee (Ship to):</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-semibold text-gray-800">{invoice.buyer_name}</p>
                {invoice.buyer_address && (
                  <p className="text-gray-600 mt-1">{invoice.buyer_address}</p>
                )}
                {invoice.buyer_gstin && (
                  <p className="text-gray-600">GSTIN/UIN: {invoice.buyer_gstin}</p>
                )}
                {invoice.buyer_state && (
                  <p className="text-gray-600">State Name: {invoice.buyer_state}, Code: {invoice.buyer_state_code}</p>
                )}
              </div>
            </div>

            {/* Buyer (Bill to) */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Buyer (Bill to):</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-semibold text-gray-800">{invoice.buyer_name}</p>
                {invoice.buyer_address && (
                  <p className="text-gray-600 mt-1">{invoice.buyer_address}</p>
                )}
                {invoice.buyer_gstin && (
                  <p className="text-gray-600">GSTIN/UIN: {invoice.buyer_gstin}</p>
                )}
                {invoice.buyer_state && (
                  <p className="text-gray-600">State Name: {invoice.buyer_state}, Code: {invoice.buyer_state_code}</p>
                )}
                <p className="text-gray-600 mt-2"><strong>Place of Supply:</strong> {invoice.buyer_state}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="invoice-section">
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="w-16">Sl No</th>
                <th className="w-80">Description of Goods</th>
                <th className="w-24">HSN/SAC</th>
                <th className="w-32">Quantity</th>
                <th className="w-32">Rate</th>
                <th className="w-20">per</th>
                <th className="w-24">Amount</th>
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
                  <td className="text-center">{item.hsn_code || '3605'}</td>
                  <td className="text-right">{item.qty}</td>
                  <td className="text-right">₹{item.rate.toFixed(2)}</td>
                  <td className="text-center">BDL</td>
                  <td className="text-right">₹{item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary of Charges */}
        <div className="invoice-section">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary of Charges:</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                {invoice.cgst > 0 && (
                  <>
                    <p><strong>OUTPUT CGST:</strong> ₹{invoice.cgst.toFixed(2)}</p>
                    <p><strong>OUTPUT SGST:</strong> ₹{invoice.sgst.toFixed(2)}</p>
                  </>
                )}
                {invoice.igst > 0 && (
                  <p><strong>OUTPUT IGST:</strong> ₹{invoice.igst.toFixed(2)}</p>
                )}
                <p><strong>Total (Quantity):</strong> {invoice.items?.reduce((sum, item) => sum + item.qty, 0)} BDL</p>
                <p><strong>Total (Amount):</strong> ₹{invoice.total.toFixed(2)}</p>
                <p className="mt-2"><strong>Amount Chargeable (in words):</strong></p>
                <p className="text-sm text-gray-600">{invoice.total_in_words}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tax Breakdown */}
        <div className="invoice-section">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Tax Details:</h3>
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="w-24">HSN/SAC</th>
                <th className="w-32">Taxable Value</th>
                <th className="w-20">CGST</th>
                <th className="w-20"></th>
                <th className="w-20">SGST/UTGST</th>
                <th className="w-20"></th>
                <th className="w-24">Total Tax Amount</th>
              </tr>
              <tr>
                <th></th>
                <th></th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Rate</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => {
                const gstRate = item.gst_rate || 18;
                const taxableValue = item.amount;
                const cgstAmount = invoice.cgst > 0 ? (taxableValue * (gstRate / 200)) : 0;
                const sgstAmount = invoice.sgst > 0 ? (taxableValue * (gstRate / 200)) : 0;
                const igstAmount = invoice.igst > 0 ? (taxableValue * (gstRate / 100)) : 0;
                const totalTax = cgstAmount + sgstAmount + igstAmount;
                
                return (
                  <tr key={index}>
                    <td className="text-center">{item.hsn_code || '3605'}</td>
                    <td className="text-right">₹{taxableValue.toFixed(2)}</td>
                    <td className="text-center">{invoice.cgst > 0 ? `${gstRate / 2}%` : '-'}</td>
                    <td className="text-right">{invoice.cgst > 0 ? `₹${cgstAmount.toFixed(2)}` : '-'}</td>
                    <td className="text-center">{invoice.sgst > 0 ? `${gstRate / 2}%` : '-'}</td>
                    <td className="text-right">{invoice.sgst > 0 ? `₹${sgstAmount.toFixed(2)}` : '-'}</td>
                    <td className="text-right">₹{totalTax.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-semibold">
                <td className="text-center">Total</td>
                <td className="text-right">₹{invoice.subtotal.toFixed(2)}</td>
                <td className="text-center">{invoice.cgst > 0 ? `${(invoice.items?.[0]?.gst_rate || 18) / 2}%` : '-'}</td>
                <td className="text-right">{invoice.cgst > 0 ? `₹${invoice.cgst.toFixed(2)}` : '-'}</td>
                <td className="text-center">{invoice.sgst > 0 ? `${(invoice.items?.[0]?.gst_rate || 18) / 2}%` : '-'}</td>
                <td className="text-right">{invoice.sgst > 0 ? `₹${invoice.sgst.toFixed(2)}` : '-'}</td>
                <td className="text-right">₹{(invoice.cgst + invoice.sgst + invoice.igst).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-sm">
            <p><strong>Tax Amount (in words):</strong> INR {(invoice.cgst + invoice.sgst + invoice.igst).toLocaleString('en-IN')} Only</p>
          </div>
        </div>

        {/* Bank Details */}
        {(invoice.seller_bank_name || invoice.seller_bank_account || invoice.seller_bank_ifsc) && (
          <div className="invoice-section">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Company's Bank Details:</h3>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p><strong>A/c Holder's Name:</strong> {invoice.seller_name}</p>
              {invoice.seller_bank_name && (
                <p><strong>Bank Name:</strong> {invoice.seller_bank_name}</p>
              )}
              {invoice.seller_bank_account && (
                <p><strong>A/c No.:</strong> {invoice.seller_bank_account}</p>
              )}
              {invoice.seller_bank_ifsc && (
                <p><strong>Branch & IFS Code:</strong> {invoice.seller_bank_ifsc}</p>
              )}
            </div>
          </div>
        )}

        {/* Declaration */}
        <div className="invoice-section">
          <div className="bg-gray-50 p-4 rounded text-sm">
            <p className="font-semibold text-gray-700 mb-2">Declaration:</p>
            <p className="text-gray-600 mb-4">
              We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            </p>
            <p className="text-gray-500 text-xs mb-4">This is a Computer Generated Invoice</p>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-gray-600">Thank you for your business!</p>
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
                <p className="text-sm text-gray-600">for {invoice.seller_name}</p>
                <p className="text-sm text-gray-600">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewFormat2;
