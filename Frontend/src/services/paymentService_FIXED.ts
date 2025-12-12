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
    console.log('📡 API URL:', api.defaults.baseURL + '/payments/create-order');
    console.log('📡 Token exists:', !!localStorage.getItem('token'));
    
    try {
      const response = await api.post('/payments/create-order', { bookingId });
      console.log('✅ API Response status:', response.status);
      console.log('✅ API Response data:', response.data);
      
      if (!response.data || !response.data.razorpayOrderId) {
        console.error('❌ Invalid response structure:', response.data);
        throw new Error('Invalid payment order response from server');
      }
      
      if (!response.data.razorpayKey) {
        console.error('❌ Missing Razorpay key in response');
        throw new Error('Payment configuration error');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('═══════════════════════════════════════');
      console.error('❌ API Error Details:');
      console.error('═══════════════════════════════════════');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Error response headers:', error.response?.headers);
      
      // Throw a more user-friendly error
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to create payment order';
      
      throw new Error(errorMessage);
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
    try {
      const response = await api.get('/payments/my-payments');
      return response.data;
    } catch (error: any) {
      console.error('❌ Get payments error:', error);
      throw error;
    }
  },

  getDriverPayments: async () => {
    try {
      const response = await api.get('/payments/driver-payments');
      return response.data;
    } catch (error: any) {
      console.error('❌ Get driver payments error:', error);
      throw error;
    }
  },
};

export const walletService = {
  getMyWallet: async () => {
    try {
      const response = await api.get('/wallet/my-wallet');
      return response.data;
    } catch (error: any) {
      console.error('❌ Get wallet error:', error);
      throw error;
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await api.get('/wallet/transactions');
      return response.data;
    } catch (error: any) {
      console.error('❌ Get transactions error:', error);
      throw error;
    }
  },

  withdraw: async (data: WithdrawalRequest) => {
    try {
      const response = await api.post('/wallet/withdraw', data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Withdraw error:', error);
      throw error;
    }
  },
};
