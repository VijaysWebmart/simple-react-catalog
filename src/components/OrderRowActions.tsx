import React from 'react';
import { Eye } from 'lucide-react';

interface OrderRowActionsProps {
  order: any;
  onViewOrder: (order: any) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

const OrderRowActions = ({ order, onViewOrder, onUpdateStatus }: OrderRowActionsProps) => {
  return (
    <div className="flex space-x-2">
      <button
        onClick={() => onViewOrder(order)}
        className="text-blue-600 hover:text-blue-900 transition-colors"
      >
        <Eye className="w-4 h-4" />
      </button>
      <select
        value={order.status}
        onChange={(e) => onUpdateStatus(order.id, e.target.value)}
        className="text-xs border border-gray-300 rounded px-2 py-1"
      >
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );
};

export default OrderRowActions;