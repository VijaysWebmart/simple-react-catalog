import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import AuthenticatedHeader from '../components/AuthenticatedHeader';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface OrderRow {
  id: string;
  created_at: string | null;
  status: string;
  total_amount: number;
  tracking_number: string | null;
  order_items: { id: string; quantity: number; products: { name: string; images: string[] } | null }[];
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
};

const MyOrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, status, total_amount, tracking_number, order_items(id, quantity, products(name, images))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setOrders(data as any);
      setLoading(false);
    })();
  }, [user]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user ? <AuthenticatedHeader /> : <Header />}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
        <p className="text-gray-600 mb-8">Track, return, or buy things again</p>

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ShoppingBag className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">When you place an order, it will appear here.</p>
            <Link to="/products" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => {
              const firstImage = o.order_items?.[0]?.products?.images?.[0];
              const itemCount = o.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
              return (
                <Link key={o.id} to={`/orders/${o.id}`} className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border">
                  <div className="p-5 flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {firstImage ? <img src={firstImage} alt="" className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500">Order #{o.id.slice(0, 8).toUpperCase()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[o.status] || 'bg-gray-100 text-gray-800'}`}>{o.status}</span>
                      </div>
                      <p className="text-gray-900 font-medium truncate">
                        {o.order_items?.[0]?.products?.name || 'Order'} {itemCount > 1 && <span className="text-gray-500 font-normal">+ {itemCount - 1} more</span>}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''} · ₹{Number(o.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyOrdersPage;
