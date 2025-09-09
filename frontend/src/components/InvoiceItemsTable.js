import React from 'react';

const InvoiceItemsTable = ({ items, onUpdateItem, onAddItem, onRemoveItem }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700">Items & Services</h2>
        <button
          type="button"
          onClick={onAddItem}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
        >
          + Add Item
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-16">S.No</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Description</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-24">HSN Code</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-20">Qty</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-24">Rate</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-24">Amount</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {index + 1}
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => onUpdateItem(index, 'description', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter description"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <input
                    type="text"
                    value={item.hsn_code}
                    onChange={(e) => onUpdateItem(index, 'hsn_code', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="HSN"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <input
                    type="text"
                    value={item.qty}
                    onChange={(e) => onUpdateItem(index, 'qty', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Qty"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <input
                    type="text"
                    value={item.rate}
                    onChange={(e) => onUpdateItem(index, 'rate', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Rate"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                  ₹{(parseFloat(item.qty) * parseFloat(item.rate) || 0).toFixed(2)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceItemsTable;
