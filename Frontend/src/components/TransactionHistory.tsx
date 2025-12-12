import { useState, useEffect } from 'react';
import { CreditCard, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/apiService';
import { authService } from '../services/authService';

interface Payment {
  id: number;
  booking: {
    id: number;
    pickupLocation?: string;
    dropLocation?: string;
    ride: {
      source: string;
      destination: string;
      rideDate: string;
      rideTime: string;
    };
    seatsBooked: number;
  };
  amount: number;
  status: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  finalSeatRate: number;
  totalBookedSeats: number;
  createdAt: string;
  paidAt: string | null;
  failureReason: string | null;
}

export function TransactionHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Check authentication first
      const token = localStorage.getItem('token');
      const user = authService.getCurrentUser();
      
      console.log('=== Transaction History Debug ===');
      console.log('Token exists:', !!token);
      console.log('User exists:', !!user);
      console.log('User role:', user?.role);
      
      if (!token) {
        console.error('No token found in localStorage');
        setError('authentication');
        setLoading(false);
        toast.error('Authentication Error', {
          description: 'Please log in again to view your transactions.'
        });
        return;
      }

      if (!user || user.role !== 'PASSENGER') {
        console.error('User is not a passenger or user data is missing');
        setError('not_passenger');
        setLoading(false);
        return;
      }

      console.log('Making API request to /payments/my-payments...');
      
      const response = await api.get('/payments/my-payments');
      
      console.log('API response received:', response.data);
      console.log('First payment object:', JSON.stringify(response.data[0], null, 2));
      
      if (Array.isArray(response.data)) {
        setPayments(response.data);
        setError(null);
      } else {
        console.error('Invalid response format:', response.data);
        setError('invalid_response');
      }
    } catch (error: any) {
      console.error('=== Payment Fetch Error ===');
      console.error('Error object:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Error message:', error.message);
      
      // Categorize errors
      if (error.response?.status === 403 || error.response?.status === 401) {
        setError('authentication');
        console.error('Authentication failed - token may be invalid or expired');
      } else if (error.code === 'ERR_NETWORK') {
        setError('network');
        toast.error('Network Error', {
          description: 'Unable to connect to the server. Please check your connection.'
        });
      } else {
        setError('unknown');
        toast.error('Failed to fetch payment history', {
          description: error.response?.data?.message || error.message || 'Unknown error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const getRouteDisplay = (payment: Payment) => {
    // Try to get from booking's pickup/drop locations first (passenger's specific route)
    if (payment.booking?.pickupLocation && payment.booking?.dropLocation) {
      return `${payment.booking.pickupLocation} → ${payment.booking.dropLocation}`;
    }
    
    // Fallback to ride's source/destination (full route)
    if (payment.booking?.ride?.source && payment.booking?.ride?.destination) {
      return `${payment.booking.ride.source} → ${payment.booking.ride.destination}`;
    }
    
    return 'N/A → N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return { bg: '#86EFAC', color: '#14532D' };
      case 'PENDING':
        return { bg: '#FED7AA', color: '#9A3412' };
      case 'FAILED':
        return { bg: '#FCA5A5', color: '#7F1D1D' };
      case 'REFUNDED':
        return { bg: '#BFDBFE', color: '#1E3A8A' };
      default:
        return { bg: '#E5E7EB', color: '#3D5A5D' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle size={14} />;
      case 'PENDING':
        return <Clock size={14} />;
      case 'FAILED':
        return <XCircle size={14} />;
      default:
        return <CreditCard size={14} />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-8">
        <Loader2 className="animate-spin mb-4" size={32} style={{ color: '#EF8F31' }} />
        <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
          Loading payment history...
        </p>
      </div>
    );
  }

  // Error states
  if (error === 'authentication') {
    return (
      <div className="text-center py-8 px-4">
        <AlertCircle size={48} style={{ color: '#DC2626', opacity: 0.5, margin: '0 auto 1rem' }} />
        <p className="text-lg font-bold mb-2" style={{ color: '#3D5A5D' }}>Authentication Required</p>
        <p className="text-sm mb-4" style={{ color: '#3D5A5D', opacity: 0.6 }}>
          Your session may have expired. Please try logging out and logging in again.
        </p>
        <button
          onClick={fetchPayments}
          className="px-6 py-2 rounded-lg transition-all duration-300"
          style={{
            backgroundColor: '#3D5A5D',
            color: '#FFFFFF',
            fontWeight: 'bold',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (error === 'not_passenger') {
    return (
      <div className="text-center py-8 px-4">
        <AlertCircle size={48} style={{ color: '#EF8F31', opacity: 0.5, margin: '0 auto 1rem' }} />
        <p className="text-lg font-bold mb-2" style={{ color: '#3D5A5D' }}>Not Available</p>
        <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
          Transaction history is only available for passengers.
        </p>
      </div>
    );
  }

  if (error === 'network') {
    return (
      <div className="text-center py-8 px-4">
        <AlertCircle size={48} style={{ color: '#DC2626', opacity: 0.5, margin: '0 auto 1rem' }} />
        <p className="text-lg font-bold mb-2" style={{ color: '#3D5A5D' }}>Network Error</p>
        <p className="text-sm mb-4" style={{ color: '#3D5A5D', opacity: 0.6 }}>
          Unable to connect to the server. Please check your connection.
        </p>
        <button
          onClick={fetchPayments}
          className="px-6 py-2 rounded-lg transition-all duration-300"
          style={{
            backgroundColor: '#3D5A5D',
            color: '#FFFFFF',
            fontWeight: 'bold',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (error === 'unknown' || error === 'invalid_response') {
    return (
      <div className="text-center py-8 px-4">
        <AlertCircle size={48} style={{ color: '#DC2626', opacity: 0.5, margin: '0 auto 1rem' }} />
        <p className="text-lg font-bold mb-2" style={{ color: '#3D5A5D' }}>Error Loading Data</p>
        <p className="text-sm mb-4" style={{ color: '#3D5A5D', opacity: 0.6 }}>
          Something went wrong. Please try again.
        </p>
        <button
          onClick={fetchPayments}
          className="px-6 py-2 rounded-lg transition-all duration-300"
          style={{
            backgroundColor: '#3D5A5D',
            color: '#FFFFFF',
            fontWeight: 'bold',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <CreditCard size={48} style={{ color: '#3D5A5D', opacity: 0.3, margin: '0 auto 1rem' }} />
        <p style={{ color: '#3D5A5D', opacity: 0.6 }}>No payment history yet</p>
        <p className="text-xs mt-2" style={{ color: '#3D5A5D', opacity: 0.4 }}>
          Your payment transactions will appear here
        </p>
      </div>
    );
  }

  // Success state - show payments
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
          Payment History
        </h3>
        <span className="text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
          {payments.length} payment{payments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {payments.map((payment) => {
          const statusStyle = getStatusColor(payment.status);
          const isExpanded = expandedPayment === payment.id;

          return (
            <div
              key={payment.id}
              className="bg-white rounded-lg p-4 border-2 cursor-pointer hover:shadow-md transition-all"
              style={{ borderColor: '#F9C05E' }}
              onClick={() => setExpandedPayment(isExpanded ? null : payment.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={16} style={{ color: '#EF8F31' }} />
                    <span className="font-bold text-lg" style={{ color: '#3D5A5D' }}>
                      ₹{payment.amount?.toFixed(2) || '0.00'}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1"
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        fontWeight: 'bold'
                      }}
                    >
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-xs mb-1 font-medium" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                    {getRouteDisplay(payment)}
                  </p>
                  <p className="text-xs" style={{ color: '#3D5A5D', opacity: 0.5 }}>
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  className="ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedPayment(isExpanded ? null : payment.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp size={20} style={{ color: '#EF8F31' }} />
                  ) : (
                    <ChevronDown size={20} style={{ color: '#EF8F31' }} />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: '#F9C05E' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-xs">
                      <p style={{ color: '#3D5A5D', opacity: 0.6, marginBottom: '4px' }}>Booking ID</p>
                      <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>#{payment.booking?.id || 'N/A'}</p>
                    </div>
                    <div className="text-xs">
                      <p style={{ color: '#3D5A5D', opacity: 0.6, marginBottom: '4px' }}>Seats Booked</p>
                      <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>{payment.booking?.seatsBooked || 0}</p>
                    </div>
                  </div>

                  {payment.booking?.ride && (
                    <div className="text-xs">
                      <p style={{ color: '#3D5A5D', opacity: 0.6, marginBottom: '4px' }}>Ride Date & Time</p>
                      <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                        {payment.booking.ride.rideDate} at {payment.booking.ride.rideTime}
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="text-xs">
                      <p style={{ color: '#3D5A5D', opacity: 0.6, marginBottom: '4px' }}>Rate per Seat</p>
                      <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>₹{payment.finalSeatRate?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="text-xs">
                      <p style={{ color: '#3D5A5D', opacity: 0.6, marginBottom: '4px' }}>Total Passengers</p>
                      <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>{payment.totalBookedSeats || 0} seats</p>
                    </div>
                  </div>

                  {payment.razorpayPaymentId && (
                    <div className="text-xs">
                      <p style={{ color: '#3D5A5D', opacity: 0.6, marginBottom: '4px' }}>Payment ID</p>
                      <p className="font-mono text-[10px]" style={{ color: '#3D5A5D', fontWeight: 'bold', wordBreak: 'break-all' }}>
                        {payment.razorpayPaymentId}
                      </p>
                    </div>
                  )}

                  {payment.paidAt && (
                    <div className="text-xs">
                      <p style={{ color: '#3D5A5D', opacity: 0.6, marginBottom: '4px' }}>Paid At</p>
                      <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                        {formatDate(payment.paidAt)}
                      </p>
                    </div>
                  )}

                  {payment.failureReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
                      <p style={{ color: '#991B1B', fontWeight: 'bold', marginBottom: '4px' }}>Failure Reason</p>
                      <p style={{ color: '#991B1B' }}>{payment.failureReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
