import React from 'react';
import OrderStatusBadge from './OrderStatusBadge';
import OrderRowActions from './OrderRowActions';

interface OrderTableRowProps {
  order: any;
  onViewOrder: (order: any) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

const OrderTableRow = ({ order, onViewOrder, onUpdateStatus }: OrderTableRowProps) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        #{order.id.slice(0, 8)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{order.profiles?.full_name || 'Unknown'}</div>
        <div className="text-sm text-gray-500">{order.profiles?.email || 'No email'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ₹{order.total_amount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <OrderStatusBadge status={order.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(order.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <OrderRowActions 
          order={order} 
          onViewOrder={onViewOrder}
          onUpdateStatus={onUpdateStatus}
        />
      </td>
    </tr>
  );
};

export default OrderTableRow;