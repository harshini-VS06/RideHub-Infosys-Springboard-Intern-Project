import { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentButtonProps {
  bookingId: number;
  amount: number;
  onSuccess: () => void;
}

export function PaymentButton({ bookingId, amount, onSuccess }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create order
      const order = await paymentService.createPaymentOrder(bookingId);
      
      // Configure Razorpay
      const options = {
        key: order.razorpayKey,
        amount: order.amount * 100,
        currency: order.currency,
        name: 'RideHub',
        description: `Booking #${bookingId}`,
        order_id: order.razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId: bookingId
            });
            
            toast.success('Payment successful!');
            onSuccess();
          } catch (error: any) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#3D5A5D'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (error: any) {
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full py-3 rounded-xl transition-all duration-300 hover:opacity-90"
      style={{
        backgroundColor: '#3D5A5D',
        color: '#FFFFFF',
        fontWeight: 'bold',
      }}
    >
      {loading ? 'Processing...' : `Pay ₹${amount.toFixed(2)}`}
    </button>
  );
}
```

**2. Add Razorpay Script to index.html**
```html
<!-- Add this in public/index.html before closing </body> tag -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

**3. Update Booking Component**
Add PaymentButton where booking status is PAYMENT_PENDING:
```typescript
{booking.status === 'PAYMENT_PENDING' && (
  <PaymentButton
    bookingId={booking.id}
    amount={booking.finalPrice}
    onSuccess={() => {
      // Refresh bookings
      fetchBookings();
    }}
  />
)}
```
