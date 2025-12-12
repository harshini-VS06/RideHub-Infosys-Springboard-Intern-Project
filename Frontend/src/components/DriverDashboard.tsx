import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Calendar, Users, IndianRupee, Loader2, Wallet, XCircle, CheckCircle, Clock, Star } from 'lucide-react';
import { ProfileSidebar } from './ProfileSidebar';
import { WalletSection } from './WalletSection';
import { DriverReviewsSection } from './DriverReviewsSection';
import { rideService } from '../services/rideService';
import { authService } from '../services/authService';
import { toast } from 'sonner';

export function DriverDashboard() {
  const navigate = useNavigate();
  const userData = authService.getCurrentUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'rides' | 'wallet' | 'history' | 'reviews'>('rides');
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsRefreshTrigger, setReviewsRefreshTrigger] = useState(0);

  const driverName = userData?.name || "Driver";

  const handleProfileOpen = () => {
    console.log('Opening profile sidebar');
    setIsProfileOpen(true);
  };

  const handleProfileClose = () => {
    console.log('Closing profile sidebar');
    setIsProfileOpen(false);
  };

  useEffect(() => {
    fetchMyRides();
  }, []);

  const fetchMyRides = async () => {
    try {
      console.log('Fetching driver rides...');
      const data = await rideService.getMyRides();
      console.log('Rides fetched successfully:', data.length, 'rides');
      setRides(data);
    } catch (error: any) {
      console.error('Error fetching rides:', error);
      
      // Handle different error types
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Authentication error - user may need to re-login');
        toast.error('Authentication error', {
          description: 'Please try logging out and logging in again'
        });
      } else if (error.response?.status === 404) {
        console.log('No rides found - this is normal for new drivers');
        setRides([]);
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        console.error('Error details:', errorMessage);
        toast.error('Failed to fetch rides', {
          description: errorMessage
        });
      }
      
      // Set empty array so UI still renders properly
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async (rideId: number) => {
    if (!confirm('Are you sure you want to cancel this ride? All passengers will be notified and refunded.')) {
      return;
    }

    try {
      await rideService.cancelRide(rideId);
      toast.success('Ride cancelled successfully', {
        description: 'All passengers have been notified and will be refunded.',
      });
      fetchMyRides(); // Refresh the list
    } catch (error: any) {
      console.error('Cancel ride error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      toast.error('Failed to cancel ride', {
        description: errorMessage,
      });
    }
  };

  // Filter rides
  const activeRides = rides.filter(r => r.status === 'AVAILABLE' || r.status === 'FULL');
  const pastRides = rides.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  const renderRideCard = (ride: any, showCancelButton: boolean = true) => (
    <div
      key={ride.id}
      className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all"
    >
      <div className="flex items-start gap-3 mb-4">
        <MapPin size={20} style={{ color: '#EF8F31', flexShrink: 0 }} />
        <div className="flex-1">
          <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
            {ride.source} → {ride.destination}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: '#3D5A5D', opacity: 0.6 }} />
          <span style={{ color: '#3D5A5D' }}>
            {ride.rideDate} at {ride.rideTime}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: '#3D5A5D', opacity: 0.6 }} />
          <span style={{ color: '#3D5A5D' }}>
            {ride.availableSeats} / {ride.totalSeats} seats available
          </span>
        </div>

        <div className="flex items-center gap-2">
          <IndianRupee size={16} style={{ color: '#3D5A5D', opacity: 0.6 }} />
          <span style={{ color: '#3D5A5D' }}>
            ₹{ride.farePerKm}/km
          </span>
        </div>

        {ride.distance && (
          <div className="pt-2 border-t" style={{ borderColor: '#F9C05E' }}>
            <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.7 }}>
              Distance: {ride.distance} km
            </p>
          </div>
        )}

        <div className="pt-2 flex items-center justify-between">
          <span 
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
            style={{ 
              backgroundColor: ride.status === 'AVAILABLE' ? '#F9C05E' : 
                             ride.status === 'FULL' ? '#EF8F31' : 
                             ride.status === 'COMPLETED' ? '#10B981' :
                             ride.status === 'CANCELLED' ? '#EF4444' : '#E5E7EB',
              color: ride.status === 'COMPLETED' || ride.status === 'CANCELLED' ? '#FFFFFF' : '#3D5A5D',
              fontWeight: 'bold'
            }}
          >
            {ride.status === 'AVAILABLE' && <Clock size={14} />}
            {ride.status === 'COMPLETED' && <CheckCircle size={14} />}
            {ride.status === 'CANCELLED' && <XCircle size={14} />}
            {ride.status}
          </span>
        </div>

        {showCancelButton && (ride.status === 'AVAILABLE' || ride.status === 'FULL') && (
          <div className="pt-3">
            <button
              type="button"
              onClick={() => handleCancelRide(ride.id)}
              className="w-full px-4 py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontWeight: 'bold',
              }}
            >
              <XCircle size={16} />
              Cancel Ride
            </button>
          </div>
        )}
      </div>
    </div>
  );

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
                Hey {driverName}!
              </p>
              <p className="text-sm mt-1" style={{ color: '#FFFFFF', opacity: 0.8 }}>
                Where are you up to?
              </p>
            </div>
            <button
              type="button"
              onClick={handleProfileOpen}
              className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
              style={{ backgroundColor: '#EF8F31', color: '#FFFFFF', fontWeight: 'bold' }}
            >
              {driverName.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('rides')}
            className="px-6 py-3 rounded-xl transition-all duration-300 whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'rides' ? '#3D5A5D' : '#F9C05E',
              color: activeTab === 'rides' ? '#FFFFFF' : '#3D5A5D',
              fontWeight: 'bold',
            }}
          >
            Active Rides
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className="px-6 py-3 rounded-xl transition-all duration-300 whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'history' ? '#3D5A5D' : '#F9C05E',
              color: activeTab === 'history' ? '#FFFFFF' : '#3D5A5D',
              fontWeight: 'bold',
            }}
          >
            Your Rides ({pastRides.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('reviews');
              // Trigger refresh when Reviews tab is clicked
              setReviewsRefreshTrigger(prev => prev + 1);
            }}
            className="px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'reviews' ? '#3D5A5D' : '#F9C05E',
              color: activeTab === 'reviews' ? '#FFFFFF' : '#3D5A5D',
              fontWeight: 'bold',
            }}
          >
            <Star size={20} />
            Reviews
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className="px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'wallet' ? '#3D5A5D' : '#F9C05E',
              color: activeTab === 'wallet' ? '#FFFFFF' : '#3D5A5D',
              fontWeight: 'bold',
            }}
          >
            <Wallet size={20} />
            HubWallet
          </button>
        </div>

        {/* Content based on active tab */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin" size={48} style={{ color: '#EF8F31' }} />
          </div>
        ) : activeTab === 'rides' ? (
          activeRides.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeRides.map((ride) => renderRideCard(ride, true))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl mb-4" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                No active rides
              </p>
              <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.5 }}>
                Click the + button below to create your first ride
              </p>
            </div>
          )
        ) : activeTab === 'history' ? (
          <div>
            <h2 className="text-2xl mb-6" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
              Your Ride History
            </h2>
            {pastRides.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastRides.map((ride) => renderRideCard(ride, false))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl">
                <CheckCircle size={48} style={{ color: '#3D5A5D', opacity: 0.3 }} className="mx-auto mb-4" />
                <p className="text-xl mb-2" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                  No ride history yet
                </p>
                <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.5 }}>
                  Your completed and cancelled rides will appear here
                </p>
              </div>
            )}
          </div>
        ) : activeTab === 'reviews' ? (
          /* Reviews Tab */
          <DriverReviewsSection refreshTrigger={reviewsRefreshTrigger} />
        ) : (
          /* Wallet Tab */
          <div>
            <h2 className="text-2xl mb-6" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
              HubWallet
            </h2>
            <WalletSection />
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => navigate('/driver/create-ride')}
        className="fixed w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 group"
        style={{ 
          backgroundColor: '#EF8F31',
          bottom: '2rem',
          right: '2rem',
          zIndex: 30,
          cursor: 'pointer'
        }}
        title="Post a ride"
        aria-label="Post a ride"
      >
        <Plus size={32} style={{ color: '#FFFFFF' }} />
        <span 
          className="absolute bottom-full mb-2 right-0 bg-black text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Post a ride
        </span>
      </button>

      {/* Profile Sidebar */}
      <ProfileSidebar isOpen={isProfileOpen} onClose={handleProfileClose} />
    </div>
  );
}
