import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Loader2 } from 'lucide-react';
import { LocationAutocomplete } from './LocationAutocomplete';
import { calculateRouteDistance } from '../services/osmService';
import { rideService } from '../services/rideService';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { MapComponent } from './MapComponent';

export function CreateRide() {
  const navigate = useNavigate();
  const userData = authService.getCurrentUser();
  
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    rideDate: '',
    rideTime: '',
    totalSeats: '',
    farePerKm: '',
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [sourceCoords, setSourceCoords] = useState<{lat: number; lng: number} | null>(null);
  const [destCoords, setDestCoords] = useState<{lat: number; lng: number} | null>(null);

  // Calculate distance and fare when coordinates or farePerKm change
  useEffect(() => {
    const calculateRoute = async () => {
      if (sourceCoords && destCoords && sourceCoords.lat !== 0 && destCoords.lat !== 0) {
        setIsCalculating(true);
        try {
          const distance = await calculateRouteDistance(
            sourceCoords.lat,
            sourceCoords.lng,
            destCoords.lat,
            destCoords.lng
          );
          setRouteDistance(distance);
          
          // Calculate fare using driver's custom rate
          const rate = parseFloat(formData.farePerKm) || 0;
          const fare = Math.round(distance * rate);
          setEstimatedAmount(fare);
        } catch (error) {
          console.error('Error calculating route:', error);
          toast.error('Failed to calculate route distance');
        } finally {
          setIsCalculating(false);
        }
      } else {
        setRouteDistance(0);
        setEstimatedAmount(0);
      }
    };

    calculateRoute();
  }, [sourceCoords, destCoords, formData.farePerKm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!sourceCoords || !destCoords || sourceCoords.lat === 0 || destCoords.lat === 0) {
        toast.error('Please select valid source and destination locations from the suggestions');
        setLoading(false);
        return;
      }
      
      if (routeDistance === 0) {
        toast.error('Please wait for distance calculation to complete');
        setLoading(false);
        return;
      }
      
      await rideService.createRide({
        source: formData.source,
        destination: formData.destination,
        rideDate: formData.rideDate,
        rideTime: formData.rideTime,
        totalSeats: parseInt(formData.totalSeats),
        farePerKm: parseFloat(formData.farePerKm),
        distance: routeDistance,
        sourceLat: sourceCoords.lat,
        sourceLng: sourceCoords.lng,
        destLat: destCoords.lat,
        destLng: destCoords.lng,
      });

      toast.success('Ride created successfully! Check your email for confirmation.');
      navigate('/driver/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8E1' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-6 shadow-lg" style={{ backgroundColor: '#3D5A5D' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/driver/dashboard')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} style={{ color: '#FFFFFF' }} />
          </button>
          <h1 className="text-2xl" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
            Create Ride
          </h1>
        </div>
      </div>

      {/* Exit Button */}
      <button
        type="button"
        onClick={() => navigate('/driver/dashboard')}
        className="fixed top-6 right-6 z-30 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
        style={{ backgroundColor: '#EF8F31', color: '#FFFFFF' }}
      >
        <X size={24} />
      </button>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <LocationAutocomplete
                value={formData.source}
                onChange={(value) => setFormData({ ...formData, source: value })}
                onLocationSelect={(location) => {
                  setFormData(prev => ({ ...prev, source: location.address }));
                  setSourceCoords({ lat: location.lat, lng: location.lng });
                }}
                placeholder="    Search for pickup location"
                label="Source"
                required
                disabled={loading}
              />

              <LocationAutocomplete
                value={formData.destination}
                onChange={(value) => setFormData({ ...formData, destination: value })}
                onLocationSelect={(location) => {
                  setFormData(prev => ({ ...prev, destination: location.address }));
                  setDestCoords({ lat: location.lat, lng: location.lng });
                }}
                placeholder="    Search for drop location"
                label="Destination"
                required
                disabled={loading}
              />

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Date <span style={{ color: '#EF8F31' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.rideDate}
                  onChange={(e) => setFormData({ ...formData, rideDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Time <span style={{ color: '#EF8F31' }}>*</span>
                </label>
                <input
                  type="time"
                  value={formData.rideTime}
                  onChange={(e) => setFormData({ ...formData, rideTime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Available Seats <span style={{ color: '#EF8F31' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={userData?.capacity || "10"}
                  value={formData.totalSeats}
                  onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Fare per Km (₹) <span style={{ color: '#EF8F31' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 18.50"
                  value={formData.farePerKm}
                  onChange={(e) => setFormData({ ...formData, farePerKm: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                  Set your custom rate per kilometer
                </p>
              </div>
            </div>

            <div>
              <label className="block mb-3" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                Vehicle Details
              </label>
              <div className="px-4 py-3 rounded-xl border-2" style={{ borderColor: '#F9C05E', backgroundColor: '#FFF8E1' }}>
                <p style={{ color: '#3D5A5D' }}>
                  {userData?.carModel || 'Toyota Camry 2020'} • {userData?.licensePlate || 'ABC-123'} • {userData?.capacity || '4'} seats
                </p>
              </div>
            </div>

            {/* Route Distance Calculation */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Total Route (kms)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={isCalculating ? 'Calculating...' : routeDistance > 0 ? `${routeDistance} km` : 'Select source & destination'}
                    className="w-full px-4 py-3 rounded-xl border-2"
                    style={{ 
                      borderColor: '#F9C05E', 
                      backgroundColor: '#FFF8E1',
                      color: '#3D5A5D',
                      fontWeight: 'bold'
                    }}
                    readOnly
                  />
                  {isCalculating && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="animate-spin" size={20} style={{ color: '#EF8F31' }} />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                  Calculated using actual road routes
                </p>
              </div>

              <div>
                <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Estimated Total Amount (₹)
                </label>
                <input
                  type="text"
                  value={estimatedAmount > 0 ? `₹${estimatedAmount.toLocaleString('en-IN')}` : '₹0'}
                  className="w-full px-4 py-3 rounded-xl border-2"
                  style={{ 
                    borderColor: '#F9C05E', 
                    backgroundColor: '#FFF8E1',
                    color: '#EF8F31',
                    fontWeight: 'bold',
                    fontSize: '1.25rem'
                  }}
                  readOnly
                />
                <p className="mt-1 text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                  {routeDistance > 0 && formData.farePerKm ? 
                    `${routeDistance} km × ₹${parseFloat(formData.farePerKm).toFixed(2)}/km = ₹${estimatedAmount.toLocaleString('en-IN')}` : 
                    'Enter fare rate to calculate'
                  }
                </p>
              </div>
            </div>

            {/* Interactive Map */}
            {(sourceCoords && destCoords && sourceCoords.lat !== 0 && destCoords.lat !== 0) && (
              <div>
                <label className="block mb-3" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
                  Route Visualization
                </label>
                <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: '#3D5A5D' }}>
                  <MapComponent
                    sourceLat={sourceCoords.lat}
                    sourceLng={sourceCoords.lng}
                    destLat={destCoords.lat}
                    destLng={destCoords.lng}
                    sourceLabel={formData.source || 'Pickup Location'}
                    destLabel={formData.destination || 'Drop Location'}
                    showRoute={true}
                    height="450px"
                  />
                </div>
                <p className="mt-2 text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                  📍 Source • 🎯 Destination | Route shows actual driving path
                </p>
              </div>
            )}

            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={loading || isCalculating || routeDistance === 0}
                className="w-full py-4 rounded-xl transition-all duration-300 hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: '#3D5A5D',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                {loading ? 'POSTING RIDE...' : 'POST A RIDE'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
