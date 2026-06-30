import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Package, Truck, Home, CreditCard, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import AuthenticatedHeader from '../components/AuthenticatedHeader';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface OrderDetail {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  status: string;
  total_amount: number;
  tracking_number: string | null;
  delivery_partner: string | null;
  estimated_delivery: string | null;
  shipping_method: string | null;
  shipping_address: any;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  order_items: { id: string; quantity: number; price: number; products: { name: string; images: string[] } | null }[];
}

const TIMELINE = [
  { key: 'pending', label: 'Order Placed', icon: CreditCard },
  { key: 'paid', label: 'Payment Confirmed', icon: Check },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

const statusIndex = (s: string) => {
  const i = TIMELINE.findIndex(t => t.key === s);
  return i === -1 ? 0 : i;
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(id, quantity, price, products(name, images))')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) setNotFound(true);
      else setOrder(data as any);
      setLoading(false);
    })();
  }, [user, id]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  const cancelled = order?.status === 'cancelled' || order?.status === 'failed';
  const currentStep = order ? statusIndex(order.status) : 0;
  const addr = order?.shipping_address || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user ? <AuthenticatedHeader /> : <Header />}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/orders" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Link>

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : notFound || !order ? (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm">
            <p className="text-gray-600">Order not found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
                  <p className="text-sm text-gray-500 mt-1">Placed on {order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">₹{Number(order.total_amount).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Tracking timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
              {cancelled ? (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg capitalize">This order was {order.status}.</div>
              ) : (
                <div className="relative">
                  <div className="hidden sm:flex justify-between">
                    {TIMELINE.map((step, i) => {
                      const done = i <= currentStep;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center relative">
                          {i > 0 && <div className={`absolute top-5 right-1/2 w-full h-0.5 ${i <= currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                          <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${done ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <p className={`mt-2 text-xs text-center ${done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{step.label}</p>
                        </div>
                      );
                    })}
                  </div>
                  {/* Mobile vertical timeline */}
                  <div className="sm:hidden space-y-3">
                    {TIMELINE.map((step, i) => {
                      const done = i <= currentStep;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={done ? 'text-gray-900 font-medium' : 'text-gray-400'}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(order.tracking_number || order.delivery_partner || order.estimated_delivery) && (
                <div className="mt-6 pt-6 border-t grid sm:grid-cols-3 gap-4 text-sm">
                  {order.delivery_partner && <div><p className="text-gray-500">Courier</p><p className="font-medium text-gray-900">{order.delivery_partner}</p></div>}
                  {order.tracking_number && <div><p className="text-gray-500">Tracking #</p><p className="font-medium text-gray-900">{order.tracking_number}</p></div>}
                  {order.estimated_delivery && <div><p className="text-gray-500">Estimated Delivery</p><p className="font-medium text-gray-900">{new Date(order.estimated_delivery).toLocaleDateString('en-IN')}</p></div>}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Items ({order.order_items.length})</h2>
              <div className="divide-y">
                {order.order_items.map(it => (
                  <div key={it.id} className="py-3 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {it.products?.images?.[0] ? <img src={it.products.images[0]} alt="" className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{it.products?.name || 'Product'}</p>
                      <p className="text-sm text-gray-500">Qty: {it.quantity} × ₹{Number(it.price).toFixed(2)}</p>
                    </div>
                    <p className="font-medium text-gray-900">₹{(it.quantity * Number(it.price)).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="w-5 h-5" /> Shipping Address</h2>
                <div className="text-sm text-gray-700 space-y-1">
                  {addr.full_name && <p className="font-medium">{addr.full_name}</p>}
                  {addr.address_line_1 && <p>{addr.address_line_1}</p>}
                  {addr.address_line_2 && <p>{addr.address_line_2}</p>}
                  {(addr.city || addr.state || addr.postal_code) && <p>{[addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')}</p>}
                  {addr.country && <p>{addr.country}</p>}
                  {addr.phone && <p className="text-gray-500">📞 {addr.phone}</p>}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment</h2>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Method: <span className="font-medium">Razorpay</span></p>
                  {order.razorpay_payment_id && <p className="text-gray-500 break-all">Payment ID: {order.razorpay_payment_id}</p>}
                  {order.razorpay_order_id && <p className="text-gray-500 break-all">Order ID: {order.razorpay_order_id}</p>}
                  <p className="pt-2 border-t mt-2">Total Paid: <span className="font-semibold text-gray-900">₹{Number(order.total_amount).toFixed(2)}</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetailPage;
