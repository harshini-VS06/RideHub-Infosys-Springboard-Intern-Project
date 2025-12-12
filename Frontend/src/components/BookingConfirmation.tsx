import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, IndianRupee, X, Loader2, MapPin, Calculator } from 'lucide-react';
import { LocationAutocomplete } from './LocationAutocomplete';
import { calculateRouteDistance } from '../services/osmService';
import { bookingService } from '../services/bookingService';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { MapComponent } from './MapComponent';

export function BookingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = authService.getCurrentUser();
  const ride = location.state?.ride;
  const passengerName = userData?.name || "Passenger";

  const [formData, setFormData] = useState({
    seats: '1',
    pickup: '',
    drop: '',
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [segmentDistance, setSegmentDistance] = useState<number>(0);
  const [totalFare, setTotalFare] = useState(0);
  const [perSeatCost, setPerSeatCost] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{lat: number; lng: number} | null>(null);
  const [dropCoords, setDropCoords] = useState<{lat: number; lng: number} | null>(null);

  // Calculate fare based on PER-SEAT cost (not segment distance)
  useEffect(() => {
    const calculateFare = () => {
      if (!ride) return;
      
      // Get ride details
      const fullDistance = ride.distance || 0;
      const farePerKm = parseFloat(String(ride.farePerKm)) || 0;
      const totalSeats = ride.totalSeats || 1;
      const seatsBooked = parseInt(formData.seats) || 1;
      
      // Validation
      if (fullDistance <= 0 || farePerKm <= 0 || totalSeats <= 0) {
        setTotalFare(0);
        setPerSeatCost(0);
        return;
      }
      
      // PER-SEAT CALCULATION
      // Step 1: Total trip cost (Full route × Rate)
      const totalTripCost = fullDistance * farePerKm;
      
      // Step 2: Per seat cost (Total ÷ Seats)
      const calculatedPerSeatCost = totalTripCost / totalSeats;
      
      // Step 3: Passenger fare (Per seat × Booked seats)
      const passengerFare = calculatedPerSeatCost * seatsBooked;
      
      // Round to 2 decimals
      const finalFare = Math.round(passengerFare * 100) / 100;
      const roundedPerSeatCost = Math.round(calculatedPerSeatCost * 100) / 100;
      
      setPerSeatCost(roundedPerSeatCost);
      setTotalFare(finalFare);
      
      console.log('[BookingConfirmation] Per-Seat Fare Calculated:', {
        fullDistance,
        farePerKm,
        totalSeats,
        seatsBooked,
        totalTripCost: totalTripCost.toFixed(2),
        perSeatCost: roundedPerSeatCost,
        finalFare
      });
    };
    
    calculateFare();
  }, [ride, formData.seats]);

  // Calculate segment distance for validation only (not used for fare)
  useEffect(() => {
    const calculateSegment = async () => {
      if (!pickupCoords || !dropCoords || !ride) return;
      
      const pickupValid = pickupCoords.lat !== null && pickupCoords.lat !== 0 && 
                         pickupCoords.lng !== null && pickupCoords.lng !== 0;
      const dropValid = dropCoords.lat !== null && dropCoords.lat !== 0 && 
                       dropCoords.lng !== null && dropCoords.lng !== 0;
      
      if (!pickupValid || !dropValid) {
        setSegmentDistance(0);
        return;
      }
      
      setIsCalculating(true);
      try {
        const distance = await calculateRouteDistance(
          pickupCoords.lat,
          pickupCoords.lng,
          dropCoords.lat,
          dropCoords.lng
        );
        
        if (typeof distance === 'number' && !isNaN(distance) && distance > 0) {
          setSegmentDistance(distance);
          console.log('[BookingConfirmation] Segment distance (for reference only):', distance);
        }
      } catch (error) {
        console.error('[BookingConfirmation] Error calculating segment:', error);
      } finally {
        setIsCalculating(false);
      }
    };
    
    calculateSegment();
  }, [pickupCoords, dropCoords, ride]);

  const handlePickupChange = (value: string, lat: number, lng: number) => {
    setFormData({ ...formData, pickup: value });
    setPickupCoords({ lat, lng });
  };

  const handleDropChange = (value: string, lat: number, lng: number) => {
    setFormData({ ...formData, drop: value });
    setDropCoords({ lat, lng });
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Enhanced validation
      if (!pickupCoords || !dropCoords) {
        toast.error('Please select both pickup and drop locations');
        setLoading(false);
        return;
      }

      const pickupValid = pickupCoords.lat !== null && pickupCoords.lat !== 0 && 
                         pickupCoords.lng !== null && pickupCoords.lng !== 0;
      const dropValid = dropCoords.lat !== null && dropCoords.lat !== 0 && 
                       dropCoords.lng !== null && dropCoords.lng !== 0;

      if (!pickupValid || !dropValid) {
        toast.error('Please select valid pickup and drop locations');
        setLoading(false);
        return;
      }
      
      if (totalFare <= 0 || isNaN(totalFare)) {
        toast.error('Invalid fare amount. Please try again.');
        setLoading(false);
        return;
      }
      
      // Use segment distance or default to 1 if not calculated
      const validSegmentDistance = segmentDistance > 0 ? segmentDistance : 1.0;
      
      // Final validation before sending
      const bookingData = {
        rideId: ride.id,
        seatsBooked: parseInt(formData.seats),
        pickupLocation: formData.pickup.trim(),
        dropLocation: formData.drop.trim(),
        segmentDistance: Number(validSegmentDistance.toFixed(2)),
        pickupLat: Number(pickupCoords.lat.toFixed(6)),
        pickupLng: Number(pickupCoords.lng.toFixed(6)),
        dropLat: Number(dropCoords.lat.toFixed(6)),
        dropLng: Number(dropCoords.lng.toFixed(6)),
        totalFare: Number(totalFare.toFixed(2)),
      };

      console.log('Sending booking data:', bookingData);
      
      await bookingService.createBooking(bookingData);
      
      toast.success('Booking confirmed! Check your email for details.');
      navigate('/passenger/dashboard');
    } catch (error: any) {
      console.error('Booking error:', error);
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
      }
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Booking failed. Please try again.';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF8E1' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: '#3D5A5D' }}>Ride not found</p>
          <button
            type="button"
            onClick={() => navigate('/passenger/dashboard')}
            className="px-6 py-3 rounded-xl"
            style={{ backgroundColor: '#EF8F31', color: '#FFFFFF', fontWeight: 'bold' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate for display
  const totalTripCost = (ride.distance || 0) * (ride.farePerKm || 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8E1' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-6 shadow-lg" style={{ backgroundColor: '#3D5A5D' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} style={{ color: '#FFFFFF' }} />
          </button>
          <h1 className="text-2xl" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
            Booking Confirmation
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
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <form onSubmit={handleConfirm} className="space-y-6">
            {/* Passenger Info */}
            <div>
              <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                Passenger Name
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2" style={{ borderColor: '#F9C05E', backgroundColor: '#FFF8E1' }}>
                <User size={20} style={{ color: '#EF8F31' }} />
                <span style={{ color: '#3D5A5D' }}>{passengerName}</span>
              </div>
            </div>

            {/* Number of Seats */}
            <div>
              <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                Number of Seats <span style={{ color: '#EF8F31' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                max={ride.availableSeats}
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2"
                style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                required
                disabled={loading}
              />
              <p className="mt-1 text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                Available seats: {ride.availableSeats}
              </p>
            </div>

            {/* Original Route Info */}
            <div>
              <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                Original Route (Driver's Journey)
              </label>
              <div className="px-4 py-4 rounded-xl border-2" style={{ borderColor: '#F9C05E', backgroundColor: '#FFF8E1' }}>
                <div className="flex items-center gap-3 mb-2">
                  <MapPin size={20} style={{ color: '#EF8F31' }} />
                  <div className="flex-1">
                    <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                      {ride.source} → {ride.destination}
                    </p>
                  </div>
                </div>
                <p className="text-sm ml-8" style={{ color: '#3D5A5D', opacity: 0.7 }}>
                  Total Distance: {ride.distance ? `${ride.distance} km` : 'N/A'} • Driver Rate: ₹{ride.farePerKm}/km
                </p>
              </div>
            </div>

            {/* Pickup Location */}
            <LocationAutocomplete
              value={formData.pickup}
              onChange={(value) => setFormData({ ...formData, pickup: value })}
              onLocationSelect={({ address, lat, lng }) => handlePickupChange(address, lat, lng)}
              placeholder="    Search for your pickup point"
              label="Pickup Location"
              required
              disabled={loading}
            />

            {/* Drop Location */}
            <LocationAutocomplete
              value={formData.drop}
              onChange={(value) => setFormData({ ...formData, drop: value })}
              onLocationSelect={({ address, lat, lng }) => handleDropChange(address, lat, lng)}
              placeholder="    Search for your drop point"
              label="Drop Location"
              required
              disabled={loading}
            />

            {/* Segment Distance (Info Only) */}
            {segmentDistance > 0 && (
              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Your Journey Distance (Reference Only)
                </label>
                <div className="px-4 py-3 rounded-xl border-2" style={{ borderColor: '#F9C05E', backgroundColor: '#FFF8E1' }}>
                  <p style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                    {segmentDistance.toFixed(2)} km
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                    Note: Fare is calculated per-seat, not by distance traveled
                  </p>
                </div>
              </div>
            )}

            {/* Interactive Map */}
            {(ride.sourceLat && ride.sourceLng && ride.destLat && ride.destLng) && (
              <div>
                <label className="block mb-3" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Route Visualization
                </label>
                <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: '#3D5A5D' }}>
                  <MapComponent
                    sourceLat={ride.sourceLat}
                    sourceLng={ride.sourceLng}
                    destLat={ride.destLat}
                    destLng={ride.destLng}
                    pickupLat={pickupCoords?.lat}
                    pickupLng={pickupCoords?.lng}
                    dropLat={dropCoords?.lat}
                    dropLng={dropCoords?.lng}
                    sourceLabel={ride.source}
                    destLabel={ride.destination}
                    pickupLabel={formData.pickup || 'Your Pickup'}
                    dropLabel={formData.drop || 'Your Drop'}
                    showRoute={true}
                    showPassengerPoints={!!(pickupCoords && dropCoords && pickupCoords.lat !== 0 && dropCoords.lat !== 0)}
                    height="400px"
                  />
                </div>
                <p className="mt-2 text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                  📍 Driver Source • 🎯 Driver Destination • 🔵 Your Pickup • 🟣 Your Drop
                </p>
              </div>
            )}

            {/* PER-SEAT FARE DISPLAY - Prominent */}
            <div className="p-8 rounded-2xl border-4" style={{ backgroundColor: '#FFFFFF', borderColor: '#EF8F31' }}>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calculator size={24} style={{ color: '#EF8F31' }} />
                  <p className="text-lg font-bold" style={{ color: '#3D5A5D' }}>
                    Per-Seat Fare Calculation
                  </p>
                </div>
                <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                  Fair pricing: Everyone pays equal per seat
                </p>
              </div>

              {/* Calculation Breakdown */}
              <div className="space-y-3 mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FFF8E1' }}>
                <div className="flex justify-between items-center">
                  <span style={{ color: '#3D5A5D' }}>Full Route Distance:</span>
                  <span style={{ color: '#3D5A5D', fontWeight: 'bold' }}>{ride.distance} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: '#3D5A5D' }}>Rate per Km:</span>
                  <span style={{ color: '#3D5A5D', fontWeight: 'bold' }}>₹{ride.farePerKm}</span>
                </div>
                <div className="border-t pt-3" style={{ borderColor: '#F9C05E' }}>
                  <div className="flex justify-between items-center">
                    <span style={{ color: '#3D5A5D' }}>Total Trip Cost:</span>
                    <span style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                      ₹{totalTripCost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: '#3D5A5D' }}>÷ Total Seats:</span>
                  <span style={{ color: '#3D5A5D', fontWeight: 'bold' }}>{ride.totalSeats}</span>
                </div>
                <div className="border-t pt-3" style={{ borderColor: '#F9C05E' }}>
                  <div className="flex justify-between items-center">
                    <span style={{ color: '#EF8F31', fontWeight: 'bold' }}>Per Seat Cost:</span>
                    <span style={{ color: '#EF8F31', fontWeight: 'bold', fontSize: '18px' }}>
                      ₹{perSeatCost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: '#3D5A5D' }}>× Your Seats:</span>
                  <span style={{ color: '#3D5A5D', fontWeight: 'bold' }}>{formData.seats}</span>
                </div>
              </div>

              {/* Final Amount */}
              <div className="text-center pt-6 border-t-4" style={{ borderColor: '#EF8F31' }}>
                <p className="text-sm mb-3" style={{ color: '#3D5A5D', opacity: 0.7 }}>
                  YOUR TOTAL FARE
                </p>
                <div className="flex items-center justify-center gap-2">
                  <IndianRupee size={56} style={{ color: '#EF8F31' }} />
                  <span style={{ 
                    fontSize: '56px', 
                    color: '#EF8F31', 
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    {totalFare.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-sm mt-3" style={{ color: '#3D5A5D', opacity: 0.7 }}>
                  This amount will be charged via Razorpay
                </p>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={loading || isCalculating || totalFare === 0 || !pickupCoords || !dropCoords}
                className="w-full py-4 rounded-xl transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: '#3D5A5D',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                {loading ? 'CONFIRMING...' : 'CONFIRM BOOKING'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
