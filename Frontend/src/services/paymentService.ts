import api from './apiService';

export interface PaymentOrderRequest {
  bookingId: number;
}

export interface PaymentOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  bookingId: number;
  razorpayKey: string;
}

export interface PaymentVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  bookingId: number;
}

export interface WithdrawalRequest {
  amount: number;
  bankAccount: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  bookingId?: number;
  paymentId?: number;
}

export interface WalletData {
  id: number;
  lockedBalance: number;
  availableBalance: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export const paymentService = {
  createPaymentOrder: async (bookingId: number): Promise<PaymentOrderResponse> => {
    console.log('📡 API: Creating payment order for booking:', bookingId);
    
    try {
      const response = await api.post('/payments/create-order', { bookingId });
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to create payment order';
      throw new Error(errorMessage);
    }
  },

  initiateRazorpayPayment: (
    paymentOrder: PaymentOrderResponse,
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void
  ) => {
    console.log('═══════════════════════════════════════');
    console.log('🚀 INITIATING RAZORPAY PAYMENT');
    console.log('═══════════════════════════════════════');
    
    if (!(window as any).Razorpay) {
      console.error('❌ Razorpay SDK not loaded!');
      onFailure({ message: 'Payment system not initialized.' });
      return;
    }

    console.log('✅ Razorpay SDK available');
    console.log('📋 Order Details:', {
      orderId: paymentOrder.razorpayOrderId,
      amount: paymentOrder.amount,
      amountInPaise: Math.round(paymentOrder.amount * 100),
      currency: paymentOrder.currency,
      bookingId: paymentOrder.bookingId,
      razorpayKey: paymentOrder.razorpayKey
    });

    const options = {
      key: paymentOrder.razorpayKey,
      amount: Math.round(paymentOrder.amount * 100),
      currency: paymentOrder.currency,
      name: 'RideHub',
      description: `Booking #${paymentOrder.bookingId}`,
      order_id: paymentOrder.razorpayOrderId,
      handler: function (response: any) {
        console.log('═══════════════════════════════════════');
        console.log('✅ PAYMENT SUCCESSFUL!');
        console.log('═══════════════════════════════════════');
        console.log('Response:', response);
        onSuccess(response);
      },
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#EF8F31'
      },
      modal: {
        ondismiss: function() {
          console.log('⚠️ Payment modal closed by user');
          onFailure({ message: 'Payment cancelled' });
        },
        escape: true,
        animation: true,
        backdropclose: false
      }
    };

    try {
      console.log('🔧 Creating Razorpay instance...');
      const razorpay = new (window as any).Razorpay(options);
      console.log('✅ Razorpay instance created');
      
      razorpay.on('payment.failed', function (response: any) {
        console.error('❌ Payment failed:', response.error);
        onFailure({ 
          message: response.error.description || 'Payment failed' 
        });
      });
      
      console.log('🎯 Opening Razorpay modal NOW...');
      razorpay.open();
      console.log('✅ razorpay.open() executed');
      console.log('═══════════════════════════════════════');
    } catch (error: any) {
      console.error('═══════════════════════════════════════');
      console.error('❌ RAZORPAY ERROR:');
      console.error('═══════════════════════════════════════');
      console.error('Error:', error);
      onFailure({ 
        message: 'Failed to open payment window: ' + error.message 
      });
    }
  },

  verifyPayment: async (data: PaymentVerificationRequest) => {
    console.log('📡 API: Verifying payment:', {
      bookingId: data.bookingId,
      orderId: data.razorpayOrderId,
      paymentId: data.razorpayPaymentId
    });
    
    try {
      const response = await api.post('/payments/verify', data);
      console.log('✅ Verification response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Verification error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Payment verification failed';
      throw new Error(errorMessage);
    }
  },

  getMyPayments: async () => {
    const response = await api.get('/payments/my-payments');
    return response.data;
  },

  getDriverPayments: async () => {
    const response = await api.get('/payments/driver-payments');
    return response.data;
  },
};

export const walletService = {
  getMyWallet: async () => {
    const response = await api.get('/wallet/my-wallet');
    return response.data;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get('/wallet/transactions');
    return response.data;
  },

  withdraw: async (data: WithdrawalRequest) => {
    const response = await api.post('/wallet/withdraw', data);
    return response.data;
  },
};
