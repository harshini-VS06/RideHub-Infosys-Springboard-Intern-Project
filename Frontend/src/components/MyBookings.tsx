import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  IndianRupee,
  Info,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { bookingService } from '../services/bookingService';
import { rideService } from '../services/rideService';
import PaymentModal from './PaymentModal';
import ReviewModal from './ReviewModal';
import reviewService from '../services/reviewService';
import { toast } from 'sonner';

interface Booking {
  id: number;
  ride: any;
  passenger: any;
  seatsBooked: number;
  pickupLocation: string;
  dropLocation: string;
  segmentDistance: number;
  totalFare: number;
  totalTripCost: number;
  maximumPrice: number;
  finalPrice?: number;
  finalSeatRate?: number;
  totalBookedSeats?: number;
  status: 'TENTATIVE' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ONBOARDED' | 'DEBOARDED' | 'COMPLETED';
  bookingDate: string;
  paymentDueAt?: string;
  paidAt?: string;
  driverStartedRide?: boolean;
  passengerStartedRide?: boolean;
  rideStartedAt?: string;
  rideEndedAt?: string;
}

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Debug: Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('Auth Check:', { hasToken: !!token, hasUser: !!user });
    
    if (!token) {
      toast.error('Not authenticated', {
        description: 'Please log in to view your bookings',
      });
      return;
    }
    
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('Fetching bookings...');
      const data = await bookingService.getMyBookings();
      console.log('Bookings fetched:', data);
      setBookings(data);
    } catch (error: any) {
      console.error('Fetch bookings error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      
      toast.error('Failed to fetch bookings', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingService.cancelBooking(bookingId);
      toast.success('Booking cancelled successfully', {
        description: 'The driver has been notified and seats have been restored.',
      });
      fetchBookings(); // Refresh the list
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      toast.error('Failed to cancel booking', {
        description: errorMessage,
      });
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh bookings after successful payment
    fetchBookings();
    setShowPaymentModal(false);
    setSelectedBooking(null);
  };

  const handleReviewClick = async (booking: Booking) => {
    // Check if already reviewed
    try {
      const hasReview = await reviewService.hasReview(booking.id);
      if (hasReview) {
        toast.info('You have already reviewed this ride');
        return;
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    }
    
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const handleStartRide = async (bookingId: number) => {
    try {
      await rideService.startRide(bookingId);
      toast.success('Ride started!', {
        description: 'Your ride has been started. Enjoy your journey!',
      });
      fetchBookings(); // Refresh to show updated status
    } catch (error: any) {
      console.error('Start ride error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      toast.error('Failed to start ride', {
        description: errorMessage,
      });
    }
  };

  const handleEndRide = async (bookingId: number) => {
    if (!confirm('Are you sure you want to end this ride?')) {
      return;
    }

    try {
      await rideService.endRide(bookingId);
      toast.success('Ride completed!', {
        description: 'Thank you for riding with us. Please rate your experience!',
      });
      fetchBookings(); // Refresh to show completed status
    } catch (error: any) {
      console.error('End ride error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      toast.error('Failed to end ride', {
        description: errorMessage,
      });
    }
  };

  const handleReviewSubmitted = () => {
    if (selectedBooking) {
      setReviewedBookings(prev => new Set([...prev, selectedBooking.id]));
      toast.success('Thank you for your review!');
    }
    setShowReviewModal(false);
    setSelectedBooking(null);
  };

  useEffect(() => {
    // Check which completed bookings have reviews
    const checkReviews = async () => {
      const completed = bookings.filter(b => b.status === 'COMPLETED');
      const reviewed = new Set<number>();
      
      for (const booking of completed) {
        try {
          const hasReview = await reviewService.hasReview(booking.id);
          if (hasReview) {
            reviewed.add(booking.id);
          }
        } catch (error) {
          console.error(`Error checking review for booking ${booking.id}:`, error);
        }
      }
      
      setReviewedBookings(reviewed);
    };
    
    if (bookings.length > 0) {
      checkReviews();
    }
  }, [bookings]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string; icon: any }> = {
      TENTATIVE: { 
        variant: 'secondary', 
        label: 'Tentative', 
        icon: <Clock className="h-3 w-3" /> 
      },
      PAYMENT_PENDING: { 
        variant: 'default', 
        label: 'Payment Pending', 
        icon: <AlertCircle className="h-3 w-3" /> 
      },
      CONFIRMED: { 
        variant: 'default', 
        label: 'Confirmed', 
        icon: <CheckCircle className="h-3 w-3" /> 
      },
      ONBOARDED: { 
        variant: 'default', 
        label: 'In Progress', 
        icon: <Clock className="h-3 w-3" /> 
      },
      CANCELLED: { 
        variant: 'destructive', 
        label: 'Cancelled', 
        icon: <XCircle className="h-3 w-3" /> 
      },
      COMPLETED: { 
        variant: 'outline', 
        label: 'Completed', 
        icon: <CheckCircle className="h-3 w-3" /> 
      },
    };

    const config = statusConfig[status] || statusConfig.TENTATIVE;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isPaymentDue = (booking: Booking) => {
    return booking.status === 'PAYMENT_PENDING' && booking.paymentDueAt;
  };

  const getTimeUntilPaymentDue = (paymentDueAt: string) => {
    const now = new Date();
    const dueDate = new Date(paymentDueAt);
    const diffMs = dueDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) return 'Overdue';
    if (diffHours < 1) return `${diffMinutes} minutes`;
    return `${diffHours} hours ${diffMinutes} minutes`;
  };

  const renderBookingCard = (booking: Booking) => {
    const isPending = isPaymentDue(booking);
    const isTentative = booking.status === 'TENTATIVE';
    const isConfirmed = booking.status === 'CONFIRMED';
    const isOnboarded = booking.status === 'ONBOARDED';
    const isCompleted = booking.status === 'COMPLETED';
    const hasReview = reviewedBookings.has(booking.id);
    
    // Check if ride is ready to start (within 2 hours before scheduled time)
    const isRideReadyToStart = () => {
      const now = new Date();
      const rideDateTime = new Date(`${booking.ride.rideDate}T${booking.ride.rideTime}`);
      const twoHoursBefore = new Date(rideDateTime.getTime() - (2 * 60 * 60 * 1000));
      const twoHoursAfter = new Date(rideDateTime.getTime() + (2 * 60 * 60 * 1000));
      
      // Allow starting 2 hours before to 2 hours after scheduled time
      return now >= twoHoursBefore && now <= twoHoursAfter;
    };
    
    const canStartRide = isConfirmed && isRideReadyToStart() && !booking.passengerStartedRide;
    const canEndRide = (isConfirmed || isOnboarded) && booking.passengerStartedRide && booking.driverStartedRide && !booking.rideEndedAt;
    
    // Debug logging
    if (isConfirmed) {
      console.log(`Booking #${booking.id} - Confirmed:`, {
        rideDate: booking.ride.rideDate,
        rideTime: booking.ride.rideTime,
        isReadyToStart: isRideReadyToStart(),
        passengerStarted: booking.passengerStartedRide,
        driverStarted: booking.driverStartedRide,
        canStartRide,
        canEndRide
      });
    }

    return (
      <Card key={booking.id} className={`${isPending ? 'border-orange-500 border-2' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Booking #{booking.id}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-3 w-3" />
                Booked on {formatDate(booking.bookingDate)}
              </CardDescription>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Ride Details */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="font-medium">{booking.ride.source}</p>
                <p className="text-sm text-muted-foreground">to {booking.ride.destination}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatDate(booking.ride.rideDate)} at {formatTime(booking.ride.rideTime)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{booking.seatsBooked} seat(s)</span>
            </div>
          </div>

          <Separator />

          {/* Pricing Information */}
          {isTentative && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                <strong>Tentative Booking</strong>
                <p className="mt-1">
                  Maximum Price: <strong>₹{booking.maximumPrice?.toFixed(2)}</strong>
                </p>
                <p className="text-xs mt-2">
                  Your final price will be calculated 24 hours before the ride and will likely be lower due to price sharing!
                </p>
                {booking.paymentDueAt && (
                  <p className="text-xs mt-1">
                    Payment due: {formatDate(booking.paymentDueAt)} at {new Date(booking.paymentDueAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {isPending && (
            <>
              <Alert className="bg-orange-50 border-orange-300">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-sm text-orange-900">
                  <strong>Payment Required!</strong>
                  <p className="mt-1">
                    Time remaining: <strong>{getTimeUntilPaymentDue(booking.paymentDueAt!)}</strong>
                  </p>
                </AlertDescription>
              </Alert>

              <div className="bg-white border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Trip Cost</span>
                  <span>₹{booking.totalTripCost?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confirmed Passengers</span>
                  <span>{booking.totalBookedSeats}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Per Seat Rate</span>
                  <span>₹{booking.finalSeatRate?.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Final Amount</span>
                  <div className="flex items-center gap-1">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold text-primary">
                      {booking.finalPrice?.toFixed(2)}
                    </span>
                  </div>
                </div>
                {booking.maximumPrice && booking.finalPrice! < booking.maximumPrice && (
                  <p className="text-xs text-green-600">
                    🎉 You're saving ₹{(booking.maximumPrice - booking.finalPrice!).toFixed(2)}!
                  </p>
                )}
              </div>
            </>
          )}

          {isConfirmed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-900">Payment Confirmed</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Amount Paid</span>
                  <span className="font-semibold text-green-900">₹{booking.finalPrice?.toFixed(2)}</span>
                </div>
                {booking.paidAt && (
                  <p className="text-xs text-green-600">
                    Paid on {formatDate(booking.paidAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {isConfirmed && !canStartRide && !canEndRide && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                <strong>Ride Confirmed!</strong>
                <p className="mt-1">
                  The "Start Ride" button will appear 2 hours before your scheduled ride time.
                </p>
                {booking.paymentDueAt && (
                  <p className="text-xs mt-1">
                    Scheduled: {formatDate(booking.ride.rideDate)} at {formatTime(booking.ride.rideTime)}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Journey Details */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Pickup</span>
              <span className="text-right max-w-[200px] truncate">{booking.pickupLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Drop</span>
              <span className="text-right max-w-[200px] truncate">{booking.dropLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distance</span>
              <span>{booking.segmentDistance?.toFixed(2)} km</span>
            </div>
          </div>
        </CardContent>

        {isPending && (
          <CardFooter className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={() => handlePaymentClick(booking)}
              size="lg"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now - ₹{booking.finalPrice?.toFixed(2)}
            </Button>
            <Button 
              variant="outline"
              className="flex-1" 
              onClick={() => handleCancelBooking(booking.id)}
              size="lg"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </CardFooter>
        )}

        {(isTentative || (isConfirmed && !canStartRide && !canEndRide)) && (
          <CardFooter>
            <Button 
              variant="destructive"
              className="w-full" 
              onClick={() => handleCancelBooking(booking.id)}
              size="lg"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Booking
            </Button>
          </CardFooter>
        )}

        {canStartRide && (
          <CardFooter className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={() => handleStartRide(booking.id)}
              size="lg"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Start Ride
            </Button>
            <Button 
              variant="outline"
              className="flex-1" 
              onClick={() => handleCancelBooking(booking.id)}
              size="lg"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </CardFooter>
        )}

        {canEndRide && (
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => handleEndRide(booking.id)}
              size="lg"
              variant="default"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              End Ride
            </Button>
          </CardFooter>
        )}

        {isCompleted && (
          <CardFooter>
            {hasReview ? (
              <Button 
                variant="outline"
                className="w-full" 
                disabled
                size="lg"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Review Submitted
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => handleReviewClick(booking)}
                size="lg"
              >
                <Star className="mr-2 h-4 w-4" />
                Rate Your Experience
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Helper function to check if ride date has passed
  const isRideDatePassed = (rideDate: string, rideTime: string) => {
    const now = new Date();
    const rideDateTimeStr = `${rideDate}T${rideTime}`;
    const rideDateTime = new Date(rideDateTimeStr);
    return rideDateTime < now;
  };

  // Categorize bookings
  const tentativeBookings = bookings.filter(b => b.status === 'TENTATIVE');
  const paymentPendingBookings = bookings.filter(b => b.status === 'PAYMENT_PENDING');
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');
  
  // Separate into active and past rides
  const activeRides = bookings.filter(b => 
    (b.status === 'TENTATIVE' || b.status === 'PAYMENT_PENDING' || b.status === 'CONFIRMED' || b.status === 'ONBOARDED') &&
    !isRideDatePassed(b.ride.rideDate, b.ride.rideTime)
  );
  
  const pastRides = bookings.filter(b => 
    b.status === 'COMPLETED' || 
    b.status === 'CANCELLED' ||
    ((b.status === 'CONFIRMED' || b.status === 'TENTATIVE' || b.status === 'PAYMENT_PENDING' || b.status === 'ONBOARDED') && 
     isRideDatePassed(b.ride.rideDate, b.ride.rideTime))
  );

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your ride bookings and payments
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
            <p className="text-muted-foreground text-center">
              Start by searching for available rides and book your first journey!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">
              Active Rides
              {activeRides.length > 0 && (
                <Badge variant="default" className="ml-2">
                  {activeRides.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Rides
              {pastRides.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pastRides.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeRides.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No active rides</p>
                  <p className="text-sm text-muted-foreground mt-2">Book a ride to see it here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeRides.map(booking => (
                  <div key={booking.id}>
                    {renderBookingCard(booking)}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastRides.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No past rides</p>
                  <p className="text-sm text-muted-foreground mt-2">Your completed and cancelled rides will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastRides.map(booking => {
                  const isPastConfirmed = booking.status === 'CONFIRMED' && 
                    isRideDatePassed(booking.ride.rideDate, booking.ride.rideTime);
                  const hasReview = reviewedBookings.has(booking.id);
                  
                  return (
                    <Card key={booking.id} className={isPastConfirmed ? 'border-green-500 border-2' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">Booking #{booking.id}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3" />
                              Booked on {formatDate(booking.bookingDate)}
                            </CardDescription>
                          </div>
                          {isPastConfirmed ? (
                            <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Successful
                            </Badge>
                          ) : (
                            getStatusBadge(booking.status)
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Ride Details */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <div className="flex-1">
                              <p className="font-medium">{booking.ride.source}</p>
                              <p className="text-sm text-muted-foreground">to {booking.ride.destination}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatDate(booking.ride.rideDate)} at {formatTime(booking.ride.rideTime)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.seatsBooked} seat(s)</span>
                          </div>
                        </div>

                        <Separator />

                        {/* Fare Information */}
                        {booking.finalPrice && (
                          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Amount Paid</span>
                              <span className="font-semibold">₹{booking.finalPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>

                      {(isPastConfirmed || booking.status === 'COMPLETED') && (
                        <CardFooter>
                          {hasReview ? (
                            <Button 
                              variant="outline"
                              className="w-full" 
                              disabled
                              size="lg"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Review Submitted
                            </Button>
                          ) : (
                            <Button 
                              className="w-full" 
                              onClick={() => handleReviewClick(booking)}
                              size="lg"
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Rate Your Experience
                            </Button>
                          )}
                        </CardFooter>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Payment Modal */}
      {selectedBooking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Review Modal */}
      {selectedBooking && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBooking(null);
          }}
          bookingId={selectedBooking.id}
          driverName={selectedBooking.ride.driver.name}
          rideSummary={{
            source: selectedBooking.ride.source,
            destination: selectedBooking.ride.destination,
            date: formatDate(selectedBooking.ride.rideDate),
          }}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default MyBookings;
