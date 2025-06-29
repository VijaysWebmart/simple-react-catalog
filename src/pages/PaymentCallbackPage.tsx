
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useCartStore } from '../store/cartStore';

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCartStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Processing payment...');

  useEffect(() => {
    const processPayment = async () => {
      try {
        const merchantTransactionId = searchParams.get('merchantTransactionId');
        const transactionId = searchParams.get('transactionId');
        
        if (merchantTransactionId) {
          // Update order status
          const { error } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              phonepe_transaction_id: transactionId,
              updated_at: new Date().toISOString()
            })
            .eq('phonepe_merchant_transaction_id', merchantTransactionId);

          if (error) throw error;

          // Clear cart on successful payment
          await clearCart();
          
          setStatus('success');
          setMessage('Payment successful! Your order has been confirmed.');
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 3000);
        } else {
          throw new Error('Transaction ID not found');
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        setStatus('failed');
        setMessage('Payment failed. Please try again.');
        
        // Redirect to products page after 3 seconds
        setTimeout(() => {
          navigate('/products', { replace: true });
        }, 3000);
      }
    };

    processPayment();
  }, [searchParams, navigate, clearCart]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to home page...</p>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to products page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
