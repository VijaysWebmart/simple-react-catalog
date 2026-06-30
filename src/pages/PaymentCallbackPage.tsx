import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    } else {
      setStatus('failed');
      const t = setTimeout(() => navigate('/cart', { replace: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [searchParams, navigate]);

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
            <p className="text-gray-600 mb-4">Please try again.</p>
            <p className="text-sm text-gray-500">Redirecting to products page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
