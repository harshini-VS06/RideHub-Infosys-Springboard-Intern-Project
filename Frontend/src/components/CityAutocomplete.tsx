import { useState, useRef, useEffect } from 'react';
import { indianCities } from '../data/indianCities';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  required?: boolean;
}

export function CityAutocomplete({ value, onChange, placeholder, label, required = false }: CityAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const filtered = indianCities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setFilteredCities(filtered);
      setShowDropdown(filtered.length > 0 && value.length > 0);
    } else {
      setShowDropdown(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (city: string) => {
    onChange(city);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block mb-2" style={{ color: '#3D5A5D', fontWeight: 'bold' }}>
        {label} {required && <span style={{ color: '#EF8F31' }}>*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-2"
        style={{ borderColor: '#3D5A5D', backgroundColor: '#FFFFFF' }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      
      {showDropdown && filteredCities.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border-2 overflow-hidden"
          style={{ borderColor: '#F9C05E' }}
        >
          {filteredCities.map((city, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleCitySelect(city)}
              className="w-full px-4 py-3 text-left hover:bg-opacity-100 transition-colors"
              style={{ 
                backgroundColor: '#FFF8E1',
                color: '#3D5A5D'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9C05E'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFF8E1'}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
