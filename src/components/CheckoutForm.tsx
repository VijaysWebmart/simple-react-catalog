import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import AddressForm, { AddressInput } from './AddressForm';

interface CheckoutFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SavedAddress extends AddressInput {
  id: string;
  is_default: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CheckoutForm = ({ isOpen, onClose }: CheckoutFormProps) => {
  const { items, getCartTotal, clearCart } = useCartStore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saveNew, setSaveNew] = useState(true);

  const total = getCartTotal();

  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      const list = (data as SavedAddress[]) || [];
      setAddresses(list);
      if (list.length > 0) {
        const def = list.find(a => a.is_default) || list[0];
        setSelectedId(def.id);
        setShowNewForm(false);
      } else {
        setShowNewForm(true);
      }
    })();
  }, [isOpen, user]);

  const placeOrder = async (shipping: AddressInput) => {
    if (!user) return;
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load Razorpay');

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total_amount: total,
          status: 'pending',
          shipping_address: shipping as any,
        }])
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product?.price || 0,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      const { data: rp, error: rpErr } = await supabase.functions.invoke('razorpay-create-order', {
        body: { orderId: order.id },
      });
      if (rpErr || !rp?.razorpayOrderId) throw rpErr || new Error('Failed to create payment order');

      const options = {
        key: rp.keyId,
        amount: rp.amount,
        currency: rp.currency,
        order_id: rp.razorpayOrderId,
        name: 'Noorvi',
        description: `Order ${order.id.slice(0, 8)}`,
        prefill: {
          name: shipping.full_name,
          email: user.email,
          contact: shipping.phone,
        },
        notes: { order_id: order.id },
        theme: { color: '#16a34a' },
        handler: async (response: any) => {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              'razorpay-verify-payment',
              {
                body: {
                  orderId: order.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              }
            );
            if (verifyError || !verifyData?.success) throw verifyError || new Error('Verification failed');
            await clearCart();
            window.location.href = `/payment-callback?orderId=${order.id}&status=success`;
          } catch (err) {
            console.error('Verify error', err);
            window.location.href = `/payment-callback?orderId=${order.id}&status=failed`;
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const handleUseSaved = async () => {
    const addr = addresses.find(a => a.id === selectedId);
    if (!addr) { toast.error('Select an address'); return; }
    const { id, is_default, ...shipping } = addr;
    await placeOrder(shipping);
  };

  const handleSubmitNew = async (a: AddressInput) => {
    if (saveNew && user) {
      const isFirst = addresses.length === 0;
      await (supabase as any).from('addresses').insert({ user_id: user.id, ...a, is_default: isFirst });
    }
    await placeOrder(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Checkout</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MapPin className="w-5 h-5" /> Shipping Address</h3>
              {addresses.length > 0 && (
                <button
                  onClick={() => setShowNewForm(s => !s)}
                  className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {showNewForm ? 'Use saved address' : (<><Plus className="w-3.5 h-3.5" /> Use new address</>)}
                </button>
              )}
            </div>

            {!showNewForm && addresses.length > 0 && (
              <div className="space-y-2">
                {addresses.map(a => (
                  <label key={a.id} className={`block border rounded-lg p-3 cursor-pointer transition ${selectedId === a.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-start gap-3">
                      <input type="radio" name="addr" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} className="mt-1" />
                      <div className="text-sm flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{a.full_name}</p>
                          {a.is_default && <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Default</span>}
                        </div>
                        <p className="text-gray-700">{a.phone}</p>
                        <p className="text-gray-600">{a.address}, {a.city}, {a.state} - {a.pincode}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {showNewForm && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <AddressForm
                  onSubmit={handleSubmitNew}
                  submitLabel={`Pay ₹${total.toFixed(2)} with Razorpay`}
                  onCancel={addresses.length > 0 ? () => setShowNewForm(false) : undefined}
                />
                {user && (
                  <label className="flex items-center gap-2 mt-3 text-sm text-gray-700">
                    <input type="checkbox" checked={saveNew} onChange={e => setSaveNew(e.target.checked)} />
                    Save this address for future orders
                  </label>
                )}
              </div>
            )}
          </div>

          {!showNewForm && addresses.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold mb-4">
                <span>Total Amount: ₹{total.toFixed(2)}</span>
              </div>
              <button onClick={handleUseSaved} disabled={loading || !selectedId}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                {loading ? 'Processing...' : 'Pay with Razorpay'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
