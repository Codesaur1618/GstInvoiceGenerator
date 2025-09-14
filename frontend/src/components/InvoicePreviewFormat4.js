import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatIndianCurrency, formatIndianNumber, formatIndianDate } from '../utils/currencyFormatter';

const InvoicePreviewFormat4 = ({ invoice: propInvoice }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(propInvoice);
  const [loading, setLoading] = useState(!propInvoice);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const fetchInvoice = useCallback(async () => {
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
  }, [id, navigate]);

  useEffect(() => {
    if (!propInvoice) {
      fetchInvoice();
    }
  }, [id, propInvoice, fetchInvoice]);

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

      {/* Invoice Preview - New Format Specification */}
      <div id="invoice-preview" className="invoice-container p-8 bg-white">
        {/* Seller Name and Address Section - Moved to top */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{invoice.seller_name || 'Your Business Name'}</h1>
          <p className="text-sm">{invoice.seller_address || 'Your Business Address'}</p>
        </div>

        {/* Invoice Details - GSTIN, Date, Invoice No */}
        <div className="mb-6">
          <div className="text-sm">
            <p><strong>GSTIN:</strong> {invoice.seller_gstin || 'Your GSTIN'}</p>
            <p><strong>Date:</strong> {formatIndianDate(invoice.date) || new Date().toLocaleDateString('en-IN')}</p>
            <p><strong>Invoice No:</strong> {invoice.invoice_number || 'Your Invoice Number'}</p>
          </div>
        </div>

        {/* Buyer Details in Bordered Table */}
        <div className="mb-6">
          <div className="border border-gray-400">
            <div className="bg-gray-100 p-2 border-b border-gray-400">
              <h2 className="font-bold">Details of Receiver (Billed to)</h2>
            </div>
            <div className="p-3">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1"><strong>Name:</strong></td>
                    <td className="py-1">{invoice.buyer_name || 'SHREE JAGANNATH ENTERPRISES'}</td>
                  </tr>
                  <tr>
                    <td className="py-1"><strong>Address:</strong></td>
                    <td className="py-1">{invoice.buyer_address || 'CUTTACK'}</td>
                  </tr>
                  <tr>
                    <td className="py-1"><strong>State:</strong></td>
                    <td className="py-1">{invoice.buyer_state || 'ODISHA'}</td>
                  </tr>
                  <tr>
                    <td className="py-1"><strong>State Code:</strong></td>
                    <td className="py-1">{invoice.buyer_state_code || '21'}</td>
                  </tr>
                  <tr>
                    <td className="py-1"><strong>GSTIN:</strong></td>
                    <td className="py-1">{invoice.buyer_gstin || '21AFGPG3345B1Z9'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Item Details Table with Full Borders */}
        <div className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1 text-center">S.No</th>
                  <th className="border border-gray-400 px-2 py-1 text-left w-80">Description of Goods</th>
                  <th className="border border-gray-400 px-2 py-1 text-center">HSN Code (GST)</th>
                  <th className="border border-gray-400 px-2 py-1 text-right w-32">Qty</th>
                  <th className="border border-gray-400 px-2 py-1 text-right w-32">Rate</th>
                  <th className="border border-gray-400 px-2 py-1 text-right">Amount</th>
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

        {/* Total Amount in Words */}
        <div className="mb-4">
          <p className="text-sm font-bold">
            <strong>Total Amount in Words:</strong> ({invoice.total_in_words?.toUpperCase() || 'ONE LAKH FORTY FOUR THOUSAND FIVE HUNDRED AND SEVEN ONLY'})
          </p>
        </div>

        {/* Two-column layout for Bank Details and Tax Summary */}
        <div className="flex flex-wrap mb-6">
          {/* Bank Details */}
          <div className="w-full md:w-1/2 pr-0 md:pr-2 mb-4 md:mb-0">
            <div className="border border-gray-400">
              <div className="bg-gray-100 p-2 border-b border-gray-400">
                <h2 className="font-bold">Bank Details</h2>
              </div>
              <div className="p-3">
                <p><strong>Bank Name:</strong> {invoice.seller_bank_name || 'Axis Bank, Sattur Branch'}</p>
                <p><strong>Account No.:</strong> {invoice.seller_bank_account || '917020073159080'}</p>
                <p><strong>IFSC Code:</strong> {invoice.seller_bank_ifsc || 'UTIB0002760'}</p>
              </div>
            </div>
          </div>

          {/* Tax & Total Section */}
          <div className="w-full md:w-1/2 pl-0 md:pl-2">
            <div className="border border-gray-400">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border-b border-gray-400 p-2"><strong>Subtotal:</strong></td>
                    <td className="border-b border-gray-400 p-2 text-right">{formatIndianCurrency(invoice.subtotal) || '₹1,29,024.00'}</td>
                  </tr>
                  {invoice.igst > 0 && (
                    <tr>
                      <td className="border-b border-gray-400 p-2"><strong>IGST ({invoice.items?.[0]?.gst_rate || 18}%):</strong></td>
                      <td className="border-b border-gray-400 p-2 text-right">{formatIndianCurrency(invoice.igst)}</td>
                    </tr>
                  )}
                  {invoice.cgst > 0 && (
                    <>
                      <tr>
                        <td className="border-b border-gray-400 p-2"><strong>CGST ({(invoice.items?.[0]?.gst_rate || 18) / 2}%):</strong></td>
                        <td className="border-b border-gray-400 p-2 text-right">{formatIndianCurrency(invoice.cgst)}</td>
                      </tr>
                      <tr>
                        <td className="border-b border-gray-400 p-2"><strong>SGST ({(invoice.items?.[0]?.gst_rate || 18) / 2}%):</strong></td>
                        <td className="border-b border-gray-400 p-2 text-right">{formatIndianCurrency(invoice.sgst)}</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td className="border-b border-gray-400 p-2"><strong>Round Off:</strong></td>
                    <td className="border-b border-gray-400 p-2 text-right">+{formatIndianCurrency(Math.abs(invoice.round_off))}</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="p-2"><strong>Invoice Total:</strong></td>
                    <td className="p-2 text-right font-bold">{formatIndianCurrency(invoice.total) || '₹1,44,507.00'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Terms and Conditions:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Interest at 12% will be charged on these bills.</p>
            <p>• Subject to {invoice.seller_jurisdiction || 'Sattur'} Jurisdiction.</p>
            <p>• Payment due within 30 days of invoice date</p>
            <p>• Goods once sold will not be taken back</p>
          </div>
        </div>

        {/* Signature */}
        <div className="mt-12">
          <div className="flex justify-end">
            <div className="text-center">
              <div className="mb-4">
                <img 
                  src="/signature.png" 
                  alt="Signature" 
                  className="h-16 w-auto mx-auto object-contain"
                  style={{ maxHeight: '64px', maxWidth: '200px' }}
                />
              </div>
              <p className="text-sm mt-2">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewFormat4;