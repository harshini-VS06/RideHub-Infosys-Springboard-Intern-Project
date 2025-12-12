import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, AlertCircle, ChevronDown, ChevronUp, Loader2, CreditCard, XCircle, Clock, CheckCircle, Info, Star } from 'lucide-react';
import { ProfileSidebar } from './ProfileSidebar';
import { SOSModal } from './SOSModal';
import { LocationAutocomplete } from './LocationAutocomplete';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import PaymentModal from './PaymentModal';
import ReviewModal from './ReviewModal';
import reviewService from '../services/reviewService';

export function PassengerDashboard() {
  const navigate = useNavigate();
  const userData = authService.getCurrentUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewedBookings, setReviewedBookings] = useState<Set<number>>(new Set());
  const [startingRide, setStartingRide] = useState<number | null>(null);
  const [endingRide, setEndingRide] = useState<number | null>(null);
  const [searchData, setSearchData] = useState({
    source: '',
    destination: '',
    date: '',
    sourceLat: null as number | null,
    sourceLng: null as number | null,
    destLat: null as number | null,
    destLng: null as number | null,
  });
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const passengerName = userData?.name || "Passenger";

  const handleProfileOpen = () => {
    console.log('Opening profile sidebar');
    setIsProfileOpen(true);
  };

  const handleProfileClose = () => {
    console.log('Closing profile sidebar');
    setIsProfileOpen(false);
  };

  const filters = [
    { id: 'women-only', label: 'Women Drivers Only' },
    { id: 'price-low', label: 'Price: Low to High' },
    { id: 'price-high', label: 'Price: High to Low' },
    { id: 'sedan', label: 'Sedan' },
    { id: 'suv', label: 'SUV' },
    { id: 'rating-high', label: 'Rating: High' },
    { id: 'rating-4plus', label: 'Rating: 4+' },
  ];

  useEffect(() => {
    fetchMyBookings();
    // Trigger payment processing check on component mount
    triggerPaymentProcessingCheck();
  }, []);

  const triggerPaymentProcessingCheck = async () => {
    try {
      // Call the admin endpoint to process any pending payments
      await fetch('http://localhost:8080/api/bookings/admin/trigger-payment-processing', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Payment processing check triggered');
      // Wait a moment then refresh bookings to show updated payment status
      setTimeout(() => {
        fetchMyBookings();
      }, 1000);
    } catch (error) {
      console.error('Error triggering payment processing:', error);
    }
  };

  useEffect(() => {
    // Check which completed bookings have reviews
    const checkReviews = async () => {
      const completed = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'DEBOARDED');
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

  const fetchMyBookings = async () => {
    try {
      console.log('Fetching bookings...');
      console.log('Token:', localStorage.getItem('token'));
      const data = await bookingService.getMyBookings();
      console.log('Bookings data received:', JSON.stringify(data, null, 2));
      console.log('Booking statuses:', data.map((b: any) => ({ id: b.id, status: b.status })));
      setBookings(data);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      toast.error('Failed to fetch bookings', {
        description: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if coordinates are available for smart matching
    const hasCoordinates = searchData.sourceLat && searchData.sourceLng && 
                          searchData.destLat && searchData.destLng;
    
    navigate('/passenger/available-rides', { 
      state: { 
        searchData: {
          source: searchData.source,
          destination: searchData.destination,
          date: searchData.date,
          sourceLat: searchData.sourceLat,
          sourceLng: searchData.sourceLng,
          destLat: searchData.destLat,
          destLng: searchData.destLng,
          useSmartMatch: hasCoordinates
        },
        filters: selectedFilters 
      } 
    });
  };

  const handlePaymentClick = (booking: any) => {
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
      fetchMyBookings(); // Refresh the list
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      toast.error('Failed to cancel booking', {
        description: errorMessage,
      });
    }
  };

  const handleStartRide = async (bookingId: number) => {
    try {
      setStartingRide(bookingId);
      const response = await fetch(`http://localhost:8080/api/rides/bookings/${bookingId}/start-ride`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to start ride');
      }

      const result = await response.json();
      toast.success(result.message || 'Ride started successfully!', {
        description: 'Have a safe journey!',
      });

      // Wait a moment for DB transaction to commit, then refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchMyBookings(); // Refresh bookings
    } catch (error: any) {
      console.error('Start ride error:', error);
      toast.error('Failed to start ride', {
        description: error.message,
      });
    } finally {
      setStartingRide(null);
    }
  };

  const canStartRide = (booking: any) => {
    if (booking.status !== 'CONFIRMED') {
      console.log(`[canStartRide] Booking ${booking.id} status is ${booking.status}, not CONFIRMED`);
      return false;
    }

    const rideDateTime = new Date(`${booking.rideDate} ${booking.rideTime}`);
    const now = new Date();
    const oneHourBefore = new Date(rideDateTime.getTime() - 60 * 60 * 1000);
    const twoHoursAfter = new Date(rideDateTime.getTime() + 2 * 60 * 60 * 1000);

    console.log(`[canStartRide] Booking ${booking.id}:`, {
      rideDateTime: rideDateTime.toISOString(),
      now: now.toISOString(),
      oneHourBefore: oneHourBefore.toISOString(),
      twoHoursAfter: twoHoursAfter.toISOString(),
      canStart: now >= oneHourBefore && now <= twoHoursAfter
    });

    // Can start ride if current time is within 1 hour before to 2 hours after ride time
    return now >= oneHourBefore && now <= twoHoursAfter;
  };

  const handleEndRide = async (bookingId: number) => {
    if (!confirm('Are you sure you want to end this ride?')) {
      return;
    }

    try {
      setEndingRide(bookingId);
      const response = await fetch(`http://localhost:8080/api/rides/bookings/${bookingId}/end-ride`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to end ride');
      }

      const result = await response.json();
      toast.success(result.message || 'Ride ended successfully!', {
        description: 'Thank you for riding with us!',
      });

      fetchMyBookings(); // Refresh bookings
    } catch (error: any) {
      console.error('End ride error:', error);
      toast.error('Failed to end ride', {
        description: error.message,
      });
    } finally {
      setEndingRide(null);
    }
  };

  const canEndRide = (booking: any) => {
    // Can only end ride if it's ONBOARDED (ride has started)
    return booking.status === 'ONBOARDED';
  };

  const handlePaymentSuccess = () => {
    // Refresh bookings after successful payment
    fetchMyBookings();
    setShowPaymentModal(false);
    setSelectedBooking(null);
  };

  const handleReviewClick = async (booking: any) => {
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

  const handleReviewSubmitted = () => {
    if (selectedBooking) {
      setReviewedBookings(prev => new Set([...prev, selectedBooking.id]));
      toast.success('Thank you for your review!');
    }
    setShowReviewModal(false);
    setSelectedBooking(null);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'TENTATIVE':
        return { bg: '#93C5FD', color: '#1E3A8A' };
      case 'PAYMENT_PENDING':
        return { bg: '#FED7AA', color: '#9A3412' };
      case 'CONFIRMED':
        return { bg: '#86EFAC', color: '#14532D' };
      case 'ONBOARDED':
        return { bg: '#60A5FA', color: '#1E3A8A' };
      case 'DEBOARDED':
        return { bg: '#A78BFA', color: '#FFFFFF' };
      case 'COMPLETED':
        return { bg: '#10B981', color: '#FFFFFF' };
      case 'CANCELLED':
        return { bg: '#FCA5A5', color: '#7F1D1D' };
      default:
        return { bg: '#E5E7EB', color: '#3D5A5D' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TENTATIVE':
        return <Clock size={14} />;
      case 'PAYMENT_PENDING':
        return <AlertCircle size={14} />;
      case 'CONFIRMED':
        return <CheckCircle size={14} />;
      case 'ONBOARDED':
        return <CheckCircle size={14} />;
      case 'DEBOARDED':
        return <CheckCircle size={14} />;
      case 'COMPLETED':
        return <CheckCircle size={14} />;
      case 'CANCELLED':
        return <XCircle size={14} />;
      default:
        return <Info size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const isPaymentDue = (booking: any) => {
    const isPending = booking.status === 'PAYMENT_PENDING';
    const hasDueDate = booking.paymentDueAt != null;
    console.log(`Booking ${booking.id}: status=${booking.status}, hasDueDate=${hasDueDate}, isPending=${isPending}`);
    return isPending && hasDueDate;
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

  // Filter bookings by status
  const activeBookings = bookings.filter(b => 
    b.status === 'TENTATIVE' || b.status === 'PAYMENT_PENDING' || b.status === 'CONFIRMED' || b.status === 'ONBOARDED'
  );
  const pastBookings = bookings.filter(b => 
    b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'DEBOARDED'
  );

  const renderBookingCard = (booking: any) => {
    console.log('Rendering booking:', {
      id: booking.id,
      status: booking.status,
      paymentDueAt: booking.paymentDueAt,
      finalPrice: booking.finalPrice,
      maximumPrice: booking.maximumPrice,
    });

    const isPending = isPaymentDue(booking);
    const isTentative = booking.status === 'TENTATIVE';
    const isConfirmed = booking.status === 'CONFIRMED';
    const isOnboarded = booking.status === 'ONBOARDED';
    const badgeStyle = getStatusBadgeStyle(booking.status);
    
    console.log('Booking flags:', {
      id: booking.id,
      isTentative,
      isConfirmed,
      isOnboarded,
      canStart: isConfirmed && canStartRide(booking),
      canEnd: canEndRide(booking),
      showCancel: (isTentative || (isConfirmed && !canStartRide(booking))) && !isOnboarded
    });

    return (
      <div
        key={booking.id}
        className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all"
      >
        {/* Header with Status Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <MapPin size={20} style={{ color: '#EF8F31', flexShrink: 0 }} />
            <div className="flex-1">
              <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                {booking.source} → {booking.destination}
              </p>
            </div>
          </div>
          <span 
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap"
            style={{ 
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.color,
              fontWeight: 'bold'
            }}
          >
            {getStatusIcon(booking.status)}
            {booking.status}
          </span>
        </div>

        <div className="space-y-3">
          {/* Ride Details */}
          <div className="flex items-center gap-2">
            <Calendar size={16} style={{ color: '#3D5A5D', opacity: 0.6 }} />
            <span style={{ color: '#3D5A5D', fontSize: '0.9rem' }}>
              {booking.rideDate} at {booking.rideTime}
            </span>
          </div>

          <div className="pt-2 border-t" style={{ borderColor: '#F9C05E' }}>
            <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.8 }}>
              Driver: {booking.driver}
            </p>
            <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.8 }}>
              Seats: {booking.seatsBooked}
            </p>
          </div>

          {/* Pricing Information */}
          {isTentative && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-bold mb-1">Tentative Booking</p>
                  <p>Maximum Price: <strong>₹{booking.maximumPrice?.toFixed(2)}</strong></p>
                  <p className="mt-1 opacity-80">
                    Final price calculated 24 hours before ride
                  </p>
                </div>
              </div>
            </div>
          )}

          {isPending && (
            <>
              <div className="bg-orange-50 border border-orange-300 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-orange-900">
                    <p className="font-bold mb-1">Payment Required!</p>
                    <p>Time remaining: <strong>{getTimeUntilPaymentDue(booking.paymentDueAt!)}</strong></p>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold" style={{ color: '#3D5A5D' }}>Final Amount</span>
                  <span className="text-lg font-bold" style={{ color: '#EF8F31' }}>
                    ₹{booking.finalPrice?.toFixed(2)}
                  </span>
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle size={16} className="text-green-600" />
                <span className="font-semibold text-green-900 text-sm">Payment Confirmed</span>
              </div>
              <div className="text-xs text-green-700">
                Amount Paid: <strong>₹{booking.finalPrice?.toFixed(2) || booking.totalFare?.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Debug info for start ride */}
          {booking.status === 'CONFIRMED' && !canStartRide(booking) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-yellow-600" />
                <span className="font-semibold text-yellow-900 text-sm">Not Yet Time to Start</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                You can start the ride 1 hour before: {booking.rideTime}
              </p>
            </div>
          )}

          {/* Start Ride Button - Only show for CONFIRMED status within time window */}
          {booking.status === 'CONFIRMED' && canStartRide(booking) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-blue-600" />
                <span className="font-semibold text-blue-900 text-sm">Ready to Start Ride</span>
              </div>
              <button
                onClick={() => handleStartRide(booking.id)}
                disabled={startingRide === booking.id}
                className="w-full py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                {startingRide === booking.id ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Starting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Start Ride
                  </>
                )}
              </button>
            </div>
          )}

          {/* End Ride Button - Only show for ONBOARDED status */}
          {booking.status === 'ONBOARDED' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-purple-600" />
                <span className="font-semibold text-purple-900 text-sm">Ride In Progress</span>
              </div>
              <p className="text-xs text-purple-700 mb-2">
                Click below when you've reached your destination
              </p>
              <button
                onClick={() => handleEndRide(booking.id)}
                disabled={endingRide === booking.id}
                className="w-full py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                style={{
                  backgroundColor: '#9333EA',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                {endingRide === booking.id ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Ending...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    End Ride
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          {isPending && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handlePaymentClick(booking)}
                className="flex-1 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                <CreditCard size={16} />
                Pay ₹{booking.finalPrice?.toFixed(2)}
              </button>
              <button
                onClick={() => handleCancelBooking(booking.id)}
                className="flex-1 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                <XCircle size={16} />
                Cancel
              </button>
            </div>
          )}

          {/* Cancel Booking Button - Only for TENTATIVE or CONFIRMED (not ready to start) */}
          {(isTentative || (isConfirmed && !canStartRide(booking))) && !isOnboarded && (
            <div className="pt-2">
              <button
                onClick={() => handleCancelBooking(booking.id)}
                className="w-full py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }}
              >
                <XCircle size={16} />
                Cancel Booking
              </button>
            </div>
          )}

          {/* Review Button for Completed Rides */}
          {(booking.status === 'COMPLETED' || booking.status === 'DEBOARDED') && (
            <div className="pt-2">
              {reviewedBookings.has(booking.id) ? (
                <button
                  disabled
                  className="w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm opacity-60 cursor-not-allowed"
                  style={{
                    backgroundColor: '#9CA3AF',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                  }}
                >
                  <CheckCircle size={16} />
                  Review Submitted
                </button>
              ) : (
                <button
                  onClick={() => handleReviewClick(booking)}
                  className="w-full py-2 rounded-lg transition-all duration-300 hover:opacity-90 flex items-center justify-center gap-2 text-sm"
                  style={{
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                  }}
                >
                  <Star size={16} />
                  Rate Your Experience
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8E1', fontFamily: 'Lora, serif' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-6 py-6 shadow-lg" style={{ backgroundColor: '#3D5A5D' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-1" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                RideHub
              </h1>
              <p className="text-xl" style={{ color: '#F9C05E' }}>
                Hey {passengerName}!
              </p>
            </div>
            <button
              type="button"
              onClick={handleProfileOpen}
              className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
              style={{ backgroundColor: '#EF8F31', color: '#FFFFFF', fontWeight: 'bold' }}
            >
              {passengerName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            {!isSearchExpanded ? (
              <button
                type="button"
                onClick={() => setIsSearchExpanded(true)}
                className="w-full flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <Search size={24} style={{ color: '#EF8F31' }} />
                <span style={{ color: '#3D5A5D', opacity: 0.6 }}>
                  Search for rides
                </span>
              </button>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                    Search Rides
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSearchExpanded(false)}
                    className="transition-transform hover:scale-110"
                  >
                    <ChevronUp size={24} style={{ color: '#EF8F31' }} />
                  </button>
                </div>

                <form className="space-y-4" onSubmit={handleSearch}>
                  <LocationAutocomplete
                    value={searchData.source}
                    onChange={(value) => setSearchData({ ...searchData, source: value })}
                    onLocationSelect={(location) => {
                      setSearchData(prev => ({
                        ...prev,
                        source: location.address,
                        sourceLat: location.lat,
                        sourceLng: location.lng
                      }));
                    }}
                    placeholder="Enter pickup location"
                    label="Pickup Location"
                    required
                  />

                  <LocationAutocomplete
                    value={searchData.destination}
                    onChange={(value) => setSearchData({ ...searchData, destination: value })}
                    onLocationSelect={(location) => {
                      setSearchData(prev => ({
                        ...prev,
                        destination: location.address,
                        destLat: location.lat,
                        destLng: location.lng
                      }));
                    }}
                    placeholder="Enter drop location"
                    label="Drop Location"
                    required
                  />

                  <div>
                    <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                      Date <span style={{ color: '#EF8F31' }}>*</span>
                    </label>
                    <input
                      type="date"
                      value={searchData.date}
                      onChange={(e) => setSearchData({ ...searchData, date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2"
                      style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  {/* Filters */}
                  <div className="pt-4 border-t-2" style={{ borderColor: '#F9C05E' }}>
                    <h4 className="mb-3" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                      Filters
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {filters.map((filter) => (
                        <button
                          key={filter.id}
                          type="button"
                          onClick={() => toggleFilter(filter.id)}
                          className="px-3 py-2 rounded-full transition-all text-sm"
                          style={{
                            backgroundColor: selectedFilters.includes(filter.id) ? '#EF8F31' : '#F9C05E',
                            color: selectedFilters.includes(filter.id) ? '#FFFFFF' : '#3D5A5D',
                            fontWeight: selectedFilters.includes(filter.id) ? 'bold' : 'normal',
                          }}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl transition-all duration-300 hover:opacity-90 flex items-center justify-center gap-3"
                      style={{
                        backgroundColor: '#3D5A5D',
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                      }}
                    >
                      <Search size={20} />
                      SEARCH
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className="px-6 py-3 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: activeTab === 'active' ? '#3D5A5D' : '#F9C05E',
              color: activeTab === 'active' ? '#FFFFFF' : '#3D5A5D',
              fontWeight: 'bold',
            }}
          >
            Active Rides ({activeBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className="px-6 py-3 rounded-xl transition-all duration-300"
            style={{
              backgroundColor: activeTab === 'past' ? '#3D5A5D' : '#F9C05E',
              color: activeTab === 'past' ? '#FFFFFF' : '#3D5A5D',
              fontWeight: 'bold',
            }}
          >
            Past Rides ({pastBookings.length})
          </button>
        </div>

        {/* Rides Content */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin" size={48} style={{ color: '#EF8F31' }} />
          </div>
        ) : (
          <>
            {activeTab === 'active' && (
              <>
                <h2 className="text-2xl mb-6" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Active Rides
                </h2>
                {activeBookings.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeBookings.map(renderBookingCard)}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-xl mb-4" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                      No active rides
                    </p>
                    <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.5 }}>
                      Search for rides above to book your trip
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'past' && (
              <>
                <h2 className="text-2xl mb-6" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Past Rides
                </h2>
                {pastBookings.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pastBookings.map(renderBookingCard)}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-xl mb-4" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                      No past rides
                    </p>
                    <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.5 }}>
                      Your completed and cancelled rides will appear here
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* SOS Button */}
      <button
        type="button"
        onClick={() => setIsSOSOpen(true)}
        className="fixed w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
        style={{ 
          backgroundColor: '#DC2626',
          bottom: '2rem',
          right: '2rem',
          zIndex: 30,
          cursor: 'pointer'
        }}
        title="Emergency SOS"
        aria-label="Emergency SOS"
      >
        <AlertCircle size={32} style={{ color: '#FFFFFF' }} />
      </button>

      {/* Profile Sidebar */}
      <ProfileSidebar isOpen={isProfileOpen} onClose={handleProfileClose} />

      {/* SOS Modal */}
      <SOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />

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
          driverName={selectedBooking.driver}
          rideSummary={{
            source: selectedBooking.source,
            destination: selectedBooking.destination,
            date: formatDate(selectedBooking.rideDate),
          }}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
