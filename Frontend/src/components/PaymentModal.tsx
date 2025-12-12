import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, CheckCircle, XCircle, IndianRupee, Users, Calendar, MapPin, AlertCircle, X } from 'lucide-react';
import { paymentService, PaymentOrderResponse } from '../services/paymentService';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  console.log('PaymentModal - isOpen:', isOpen, 'booking:', booking?.id);

  // Check if Razorpay is loaded
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30; // 3 seconds
    
    const checkRazorpay = () => {
      attempts++;
      
      if ((window as any).Razorpay) {
        console.log('✅ Razorpay loaded successfully!');
        console.log('✅ Razorpay type:', typeof (window as any).Razorpay);
        setRazorpayLoaded(true);
      } else {
        console.log(`⏳ Waiting for Razorpay... (${attempts}/${maxAttempts})`);
        
        if (attempts < maxAttempts) {
          setTimeout(checkRazorpay, 100);
        } else {
          console.error('❌ Razorpay failed to load after 3 seconds!');
          console.error('🚫 SOLUTION: Disable ad blockers and refresh the page!');
          toast.error('Payment System Error', {
            description: 'Razorpay failed to load. Please disable ad blockers and refresh the page.',
            duration: 10000
          });
        }
      }
    };
    
    checkRazorpay();
  }, []);

  const handlePayClick = async () => {
    console.log('═══════════════════════════════════════');
    console.log('🎯 PAY BUTTON CLICKED!!!');
    console.log('═══════════════════════════════════════');
    
    // DEV MODE: Skip Razorpay for testing
    const DEV_MODE = false; // Set to true to skip Razorpay
    
    if (DEV_MODE) {
      console.log('⚠️ DEV MODE: Skipping Razorpay, mocking successful payment');
      
      try {
        setIsProcessing(true);
        setPaymentStatus('processing');
        
        // Create payment order
        const paymentOrder = await paymentService.createPaymentOrder(booking.id);
        console.log('✅ Payment order created:', paymentOrder);
        
        // Simulate successful payment with mock data
        setTimeout(async () => {
          const mockResponse = {
            razorpay_order_id: paymentOrder.razorpayOrderId,
            razorpay_payment_id: 'pay_mock_' + Date.now(),
            razorpay_signature: 'mock_signature_' + Date.now()
          };
          
          console.log('🎭 Mock payment response:', mockResponse);
          
          try {
            await paymentService.verifyPayment({
              bookingId: booking.id,
              razorpayOrderId: mockResponse.razorpay_order_id,
              razorpayPaymentId: mockResponse.razorpay_payment_id,
              razorpaySignature: mockResponse.razorpay_signature,
            });

            console.log('✅ Payment verified!');
            setPaymentStatus('success');
            toast.success('Payment Successful! (DEV MODE)');

            setTimeout(() => {
              onPaymentSuccess();
              onClose();
            }, 2000);
          } catch (error: any) {
            console.error('❌ Verification error:', error);
            setPaymentStatus('failed');
            setErrorMessage(error.message);
            toast.error('Payment Verification Failed');
          } finally {
            setIsProcessing(false);
          }
        }, 2000);
        
        return;
      } catch (error: any) {
        console.error('❌ Error:', error);
        setPaymentStatus('failed');
        setErrorMessage(error.message);
        setIsProcessing(false);
        toast.error('Failed to create payment order');
        return;
      }
    }
    
    // Normal Razorpay flow
    try {
      if (!razorpayLoaded) {
        throw new Error('Payment system is loading. Please wait.');
      }

      if (!booking || !booking.id) {
        throw new Error('Invalid booking information.');
      }

      if (!(window as any).Razorpay) {
        throw new Error('Razorpay not available.');
      }

      setIsProcessing(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      console.log('📡 Creating payment order...');
      const paymentOrder: PaymentOrderResponse = await paymentService.createPaymentOrder(booking.id);
      console.log('✅ Payment order created:', paymentOrder);

      console.log('🎯 Opening Razorpay modal...');
      
      paymentService.initiateRazorpayPayment(
        paymentOrder,
        async (response) => {
          console.log('✅ Payment successful!', response);
          
          try {
            await paymentService.verifyPayment({
              bookingId: booking.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            console.log('✅ Payment verified!');
            setPaymentStatus('success');
            toast.success('Payment Successful!');

            setTimeout(() => {
              onPaymentSuccess();
              onClose();
            }, 2000);
          } catch (error: any) {
            console.error('❌ Verification error:', error);
            setPaymentStatus('failed');
            setErrorMessage(error.message || 'Verification failed');
            toast.error('Payment Verification Failed');
          } finally {
            setIsProcessing(false);
          }
        },
        (error) => {
          console.error('❌ Payment error:', error);
          setPaymentStatus('failed');
          setErrorMessage(error.message || 'Payment failed');
          setIsProcessing(false);
          toast.error('Payment Failed');
        }
      );
    } catch (error: any) {
      console.error('❌ Error:', error);
      setPaymentStatus('failed');
      setErrorMessage(error.message || 'Failed to initiate payment');
      setIsProcessing(false);
      toast.error('Payment Initiation Failed');
    }
  };

  if (!isOpen || !booking) {
    return null;
  }

  const isButtonDisabled = !razorpayLoaded || isProcessing || paymentStatus === 'success';

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          console.log('🔴 Clicked outside modal');
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={() => {
            console.log('🔴 Close button clicked');
            onClose();
          }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CreditCard size={20} style={{ color: '#EF8F31' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Complete Payment</h2>
          </div>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            Review your booking details and complete payment
          </p>
        </div>

        {/* Razorpay Loading */}
        {!razorpayLoaded && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#FEF3C7', 
            border: '1px solid #FCD34D',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Loader2 size={20} style={{ color: '#F59E0B' }} className="animate-spin" />
            <div>
              <p style={{ fontWeight: 'bold', margin: 0, fontSize: '14px' }}>Loading Payment System...</p>
              <p style={{ fontSize: '12px', margin: 0, marginTop: '4px', color: '#92400E' }}>
                If this takes too long, please disable ad blockers and refresh the page.
              </p>
            </div>
          </div>
        )}

        {/* Ride Details */}
        <div style={{ 
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Ride Details</h3>
          
          <div style={{ display: 'flex', alignItems: 'start', gap: '8px', marginBottom: '12px' }}>
            <MapPin size={16} style={{ color: '#666', marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: 'bold', margin: 0, fontSize: '14px' }}>{booking.source}</p>
              <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>to {booking.destination}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Calendar size={16} style={{ color: '#666' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>{booking.rideDate} at {booking.rideTime}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} style={{ color: '#666' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>{booking.seatsBooked} seat(s) booked</p>
          </div>
        </div>

        {/* Price */}
        <div style={{ 
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Price Breakdown</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: '#666' }}>Total Trip Cost</span>
            <span>₹{booking.totalTripCost?.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span style={{ color: '#666' }}>Your Seats</span>
            <span>× {booking.seatsBooked}</span>
          </div>

          <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '12px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>Final Amount</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <IndianRupee size={16} />
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#EF8F31' }}>
                {booking.finalPrice?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        {paymentStatus === 'processing' && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#DBEAFE', 
            border: '1px solid #93C5FD',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Loader2 size={20} style={{ color: '#3B82F6' }} className="animate-spin" />
            <div>
              <p style={{ fontWeight: 'bold', margin: 0, fontSize: '14px' }}>Processing Payment...</p>
              <p style={{ fontSize: '12px', margin: 0, marginTop: '4px' }}>Complete in Razorpay window</p>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#D1FAE5', 
            border: '1px solid #86EFAC',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <CheckCircle size={20} style={{ color: '#10B981' }} />
            <div>
              <p style={{ fontWeight: 'bold', margin: 0, fontSize: '14px' }}>Payment Successful!</p>
              <p style={{ fontSize: '12px', margin: 0, marginTop: '4px' }}>Booking confirmed!</p>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#FEE2E2', 
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <XCircle size={20} style={{ color: '#EF4444' }} />
            <div>
              <p style={{ fontWeight: 'bold', margin: 0, fontSize: '14px' }}>Payment Failed</p>
              <p style={{ fontSize: '12px', margin: 0, marginTop: '4px' }}>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Important Note */}
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#FEF3C7', 
          border: '1px solid #FCD34D',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          gap: '8px'
        }}>
          <AlertCircle size={16} style={{ color: '#F59E0B', marginTop: '2px', flexShrink: 0 }} />
          <p style={{ fontSize: '12px', margin: 0 }}>
            <strong>Important:</strong> Payment will be credited to driver's wallet after completion.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              console.log('🔴 Cancel clicked');
              onClose();
            }}
            disabled={isProcessing}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handlePayClick}
            disabled={isButtonDisabled}
            onMouseEnter={() => console.log('🖱️ Mouse ENTERED Pay button')}
            onMouseLeave={() => console.log('🖱️ Mouse LEFT Pay button')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: isButtonDisabled ? '#D1D5DB' : '#10B981',
              color: 'white',
              cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {!razorpayLoaded ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Loading...
              </>
            ) : isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard size={16} />
                Pay ₹{booking.finalPrice?.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
