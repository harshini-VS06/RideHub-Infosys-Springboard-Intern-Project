import { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { searchLocations, Location } from '../services/osmService';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  onLocationSelect?: (location: { address: string; lat: number; lng: number }) => void;
}

export function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  required = false,
  disabled = false,
  onLocationSelect 
}: LocationAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [predictions, setPredictions] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch predictions when user types
  useEffect(() => {
    if (!value || value.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const results = await searchLocations(value);
        setPredictions(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error('Error fetching predictions:', error);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchPredictions, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [value]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePlaceSelect = (location: Location) => {
    onChange(location.displayName);
    setShowDropdown(false);

    // Call the onLocationSelect callback with coordinates
    if (onLocationSelect) {
      onLocationSelect({
        address: location.displayName,
        lat: location.lat,
        lng: location.lng
      });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
        {label} {required && <span style={{ color: '#EF8F31' }}>*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-10 rounded-xl border-2"
          style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="animate-spin" size={20} style={{ color: '#EF8F31' }} />
          </div>
        )}
      </div>
      
      {showDropdown && predictions.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border-2 overflow-hidden max-h-80 overflow-y-auto"
          style={{ borderColor: '#F9C05E' }}
        >
          {predictions.map((prediction, index) => (
            <button
              key={`${prediction.lat}-${prediction.lng}-${index}`}
              type="button"
              onClick={() => handlePlaceSelect(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-opacity-100 transition-colors flex items-start gap-2"
              style={{ 
                backgroundColor: '#FFF8E1',
                color: '#3D5A5D'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9C05E'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFF8E1'}
            >
              <MapPin size={18} className="flex-shrink-0 mt-1" style={{ color: '#EF8F31' }} />
              <span className="text-sm">{prediction.displayName}</span>
            </button>
          ))}
        </div>
      )}

      {showDropdown && predictions.length === 0 && !loading && value.length >= 3 && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border-2 p-4 text-center"
          style={{ borderColor: '#F9C05E', color: '#3D5A5D' }}
        >
          <p className="text-sm opacity-60">No locations found</p>
        </div>
      )}
    </div>
  );
}
