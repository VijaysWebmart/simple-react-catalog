import React from 'react';
import { XCircle } from 'lucide-react';

interface OrderDetailsModalProps {
  order: any;
  onClose: () => void;
}

const OrderDetailsModal = ({ order, onClose }: OrderDetailsModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Order Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Customer Information</h4>
              <p className="text-sm text-gray-600">{order.profiles?.full_name || 'Unknown'}</p>
              <p className="text-sm text-gray-600">{order.profiles?.email || 'No email'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Order Information</h4>
              <p className="text-sm text-gray-600">Order ID: #{order.id.slice(0, 8)}</p>
              <p className="text-sm text-gray-600">Status: {order.status}</p>
              <p className="text-sm text-gray-600">Total: ₹{order.total_amount}</p>
            </div>
          </div>

          {order.shipping_address && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm">{order.shipping_address.fullName}</p>
                <p className="text-sm">{order.shipping_address.phone}</p>
                <p className="text-sm">{order.shipping_address.address}</p>
                <p className="text-sm">
                  {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                </p>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
            <div className="space-y-2">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                  <img
                    src={item.products.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop'}
                    alt={item.products.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.products.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-sm text-gray-600">Price: ₹{item.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;