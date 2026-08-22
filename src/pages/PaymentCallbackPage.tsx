import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    const s = searchParams.get('status');
    const orderId = searchParams.get('order_id');
    if (s === 'success') {
      setStatus('success');
      const t = setTimeout(() => navigate(orderId ? `/orders/${orderId}` : '/orders', { replace: true }), 2500);
      return () => clearTimeout(t);
    } else if (s === 'failed') {
      setStatus('failed');
    }
  }, [searchParams, navigate]);

  const rawReason = searchParams.get('reason') || '';
  const domesticOnly = rawReason.toLowerCase().includes('domestic') || rawReason.toLowerCase().includes('indian');
  const failureMessage = domesticOnly
    ? 'This Razorpay test account accepts Indian payment methods only. Retry with an Indian-issued test card, UPI, or another enabled test method.'
    : rawReason || 'The payment was declined. Please retry or choose another payment method.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Your order has been confirmed.</p>
            <p className="text-sm text-gray-500">Taking you to your order...</p>
          </>
        )}
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{failureMessage}</p>
            <div className="flex gap-3 justify-center">
              <Link to="/cart" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Try again</Link>
              <Link to="/orders" className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg">View orders</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
