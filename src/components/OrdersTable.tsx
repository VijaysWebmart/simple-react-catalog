import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import OrderDetailsModal from './OrderDetailsModal';
import OrdersTableHeader from './OrdersTableHeader';
import OrderTableRow from './OrderTableRow';

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  phonepe_transaction_id?: string;
  phonepe_merchant_transaction_id?: string;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name?: string;
    email?: string;
  } | null;
  order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    products: {
      name: string;
      images: string[];
    };
  }>;
}

const OrdersTable = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // First get orders with order items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, images)
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Then get profiles separately and merge them
      const ordersWithProfiles = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', order.user_id)
            .single();

          return {
            ...order,
            profiles: profileData
          };
        })
      );

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      
      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Orders Management</h2>
          <p className="text-sm text-gray-600">Total Orders: {orders.length}</p>
        </div>
        
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <OrdersTableHeader />
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <OrderTableRow 
                    key={order.id}
                    order={order}
                    onViewOrder={setSelectedOrder}
                    onUpdateStatus={updateOrderStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default OrdersTable;
