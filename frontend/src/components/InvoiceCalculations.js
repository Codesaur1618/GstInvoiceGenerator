import React from 'react';

const InvoiceCalculations = ({ totals, gstRate = 18, taxType = 'igst' }) => {
  const { subtotal, cgst, sgst, igst, roundOff, total } = totals;
  const showIgst = taxType === 'igst' && igst > 0;
  const showCgstSgst = taxType === 'cgst_sgst' && (cgst > 0 || sgst > 0);

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Invoice Summary</h2>
      
      <div className="flex justify-end">
        <div className="w-80">
          <table className="w-full border-collapse border border-gray-300 bg-white">
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-semibold">Subtotal:</td>
                <td className="border border-gray-300 px-4 py-2 text-right">₹{subtotal.toFixed(2)}</td>
              </tr>
              
              {showCgstSgst && (
                <>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">CGST @ {(gstRate / 2)}%:</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₹{cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">SGST @ {(gstRate / 2)}%:</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₹{sgst.toFixed(2)}</td>
                  </tr>
                </>
              )}
              
              {showIgst && (
                <tr>
                  <td className="border border-gray-300 px-4 py-2">IGST @ {gstRate}%:</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">₹{igst.toFixed(2)}</td>
                </tr>
              )}
              
              <tr>
                <td className="border border-gray-300 px-4 py-2">Round Off:</td>
                <td className="border border-gray-300 px-4 py-2 text-right">+₹{Math.abs(roundOff).toFixed(2)}</td>
              </tr>
              
              <tr className="bg-gray-100 font-bold text-lg">
                <td className="border border-gray-300 px-4 py-2">Total:</td>
                <td className="border border-gray-300 px-4 py-2 text-right">₹{total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Amount in words:</span><br />
              {total > 0 ? numberToWords(total) : 'Zero Rupees Only'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert number to words
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  if (num === 0) return 'Zero';
  
  const convertHundreds = (n) => {
    let result = '';
    if (n > 99) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n > 9) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  };
  
  let result = '';
  if (num >= 10000000) {
    result += convertHundreds(Math.floor(num / 10000000)) + 'Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertHundreds(Math.floor(num / 100000)) + 'Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
    num %= 1000;
  }
  if (num > 0) {
    result += convertHundreds(num);
  }
  
  return result.trim() + ' Rupees Only';
};

export default InvoiceCalculations;
