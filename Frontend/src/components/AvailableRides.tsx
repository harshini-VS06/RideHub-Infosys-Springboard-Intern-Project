import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Star, IndianRupee, ChevronDown, ChevronUp, Car, X, Loader2, Navigation } from 'lucide-react';
import { rideService } from '../services/rideService';
import { toast } from 'sonner';
import DriverRatingDisplay from './DriverRatingDisplay';

export function AvailableRides() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchData = location.state?.searchData;
  const selectedFilters = location.state?.filters || [];
  const [expandedRide, setExpandedRide] = useState<number | null>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      let data;
      
      // Check if women-only filter is selected
      if (selectedFilters.includes('women-only')) {
        data = await rideService.getAvailableRidesByGender('female');
      } else if (searchData?.source && searchData?.destination && searchData?.date) {
        // Use smart matching if coordinates are available
        if (searchData.useSmartMatch && searchData.sourceLat && searchData.sourceLng && 
            searchData.destLat && searchData.destLng) {
          console.log('Using smart match with coordinates');
          data = await rideService.searchRidesWithSmartMatch(
            searchData.source,
            searchData.destination,
            searchData.date,
            searchData.sourceLat,
            searchData.sourceLng,
            searchData.destLat,
            searchData.destLng
          );
          toast.success('Showing direct and enroute rides', { duration: 3000 });
        } else {
          // Fallback to regular search
          console.log('Using regular search');
          data = await rideService.searchRides(
            searchData.source,
            searchData.destination,
            searchData.date
          );
        }
      } else {
        // Get all available rides
        data = await rideService.getAvailableRides();
      }
      
      setRides(data);
    } catch (error: any) {
      console.error('Error fetching rides:', error);
      toast.error('Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (rideId: number) => {
    setExpandedRide(expandedRide === rideId ? null : rideId);
  };

  const calculateTotalFare = (farePerKm: number, distance: number) => {
    return Math.round(farePerKm * distance);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8E1' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-6 shadow-lg" style={{ backgroundColor: '#3D5A5D' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/passenger/dashboard')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} style={{ color: '#FFFFFF' }} />
          </button>
          <h1 className="text-2xl" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
            Available Rides
          </h1>
        </div>
      </div>

      {/* Exit Button */}
      <button
        type="button"
        onClick={() => navigate('/passenger/dashboard')}
        className="fixed top-6 right-6 z-30 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
        style={{ backgroundColor: '#EF8F31', color: '#FFFFFF' }}
      >
        <X size={24} />
      </button>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Active Filters Display */}
        {selectedFilters.length > 0 && (
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#F9C05E' }}>
            <p style={{ color: '#3D5A5D' }}>
              <span style={{ fontWeight: 'bold' }}>Active Filters:</span>{' '}
              {selectedFilters.includes('women-only') && (
                <span className="inline-flex items-center px-3 py-1 rounded-full ml-2" style={{ backgroundColor: '#EF8F31', color: '#FFFFFF' }}>
                  Women Drivers Only
                </span>
              )}
            </p>
          </div>
        )}

        {/* Search Info */}
        {searchData && (
          <div className="mb-6 space-y-3">
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#FFFFFF' }}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={20} style={{ color: '#EF8F31' }} />
                <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  {searchData.source} → {searchData.destination}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} style={{ color: '#3D5A5D', opacity: 0.6 }} />
                <p style={{ color: '#3D5A5D', opacity: 0.8 }}>
                  {searchData.date}
                </p>
              </div>
            </div>
            
            {searchData.useSmartMatch && (
              <div className="p-4 rounded-xl border-2" style={{ backgroundColor: '#F9C05E', borderColor: '#EF8F31' }}>
                <div className="flex items-center gap-2">
                  <Navigation size={18} style={{ color: '#3D5A5D' }} />
                  <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                    Smart Match Active
                  </p>
                </div>
                <p className="text-sm mt-1" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                  Showing direct rides + rides with your route enroute
                </p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin" size={48} style={{ color: '#EF8F31' }} />
          </div>
        ) : rides.length > 0 ? (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Collapsed View */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(ride.id)}
                  className="w-full p-6 text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <MapPin size={20} style={{ color: '#EF8F31' }} />
                        <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                          {ride.source} → {ride.destination}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} style={{ color: '#3D5A5D', opacity: 0.6 }} />
                          <span style={{ color: '#3D5A5D' }}>
                            {ride.rideDate} • {ride.rideTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IndianRupee size={16} style={{ color: '#EF8F31' }} />
                          <span style={{ color: '#EF8F31', fontWeight: 'bold' }}>
                            {ride.distance ? calculateTotalFare(ride.farePerKm, ride.distance) : `${ride.farePerKm}/km`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {expandedRide === ride.id ? (
                        <ChevronUp size={24} style={{ color: '#EF8F31' }} />
                      ) : (
                        <ChevronDown size={24} style={{ color: '#EF8F31' }} />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded View */}
                {expandedRide === ride.id && (
                  <div 
                    className="px-6 pb-6 border-t-2 pt-4 space-y-4"
                    style={{ borderColor: '#F9C05E' }}
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="mb-2" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                          Driver
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                              {ride.driver}
                            </p>
                            {ride.driverGender === 'female' && (
                              <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#F9C05E', color: '#3D5A5D' }}>
                                Female Driver
                              </span>
                            )}
                          </div>
                          <DriverRatingDisplay
                            averageRating={ride.driverAverageRating}
                            totalReviews={ride.driverTotalReviews}
                            size="sm"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="mb-2" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                          Vehicle
                        </p>
                        <div className="flex items-center gap-2">
                          <Car size={18} style={{ color: '#EF8F31' }} />
                          <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                            {ride.car}
                          </p>
                        </div>
                        <p style={{ color: '#3D5A5D', opacity: 0.7 }}>
                          {ride.licensePlate}
                        </p>
                      </div>

                      <div>
                        <p className="mb-2" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                          Available Seats
                        </p>
                        <div className="flex items-center gap-2">
                          <Users size={18} style={{ color: '#EF8F31' }} />
                          <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                            {ride.availableSeats} seats
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2" style={{ color: '#3D5A5D', opacity: 0.8 }}>
                          Fare Rate
                        </p>
                        <div className="flex items-center gap-2">
                          <IndianRupee size={18} style={{ color: '#EF8F31' }} />
                          <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                            ₹{ride.farePerKm}/km
                          </p>
                          {ride.distance && (
                            <span style={{ color: '#3D5A5D', opacity: 0.6 }}>
                              ({ride.distance} km total)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center pt-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/passenger/booking/${ride.id}`, { state: { ride } })}
                        className="w-full py-3 rounded-xl transition-all duration-300 hover:opacity-90"
                        style={{
                          backgroundColor: '#3D5A5D',
                          color: '#FFFFFF',
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}
                      >
                        BOOK A RIDE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl mb-4" style={{ color: '#3D5A5D', opacity: 0.6 }}>
              No rides available for your search
            </p>
            <button
              type="button"
              onClick={() => navigate('/passenger/dashboard')}
              className="px-6 py-3 rounded-xl transition-all duration-300 hover:opacity-90"
              style={{
                backgroundColor: '#EF8F31',
                color: '#FFFFFF',
                fontWeight: 'bold',
              }}
            >
              Search Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
