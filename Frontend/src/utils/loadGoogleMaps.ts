import { GOOGLE_MAPS_CONFIG } from '../config/googleMaps';

let isLoading = false;
let isLoaded = false;

export const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (isLoaded && window.google && window.google.maps) {
      resolve();
      return;
    }

    // Currently loading
    if (isLoading) {
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          isLoaded = true;
          isLoading = false;
          resolve();
        }
      }, 100);
      return;
    }

    // Check if API key is configured
    if (!GOOGLE_MAPS_CONFIG.apiKey || GOOGLE_MAPS_CONFIG.apiKey.includes('xxx')) {
      console.error('Google Maps API key not configured!');
      console.error('Please update the API key in: src/config/googleMaps.ts');
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    isLoading = true;

    // Create script element
    const script = document.createElement('script');
    const libraries = GOOGLE_MAPS_CONFIG.libraries.join(',');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.apiKey}&libraries=${libraries}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      console.log('✅ Google Maps API loaded successfully');
      resolve();
    };

    script.onerror = () => {
      isLoading = false;
      console.error('❌ Failed to load Google Maps API');
      console.error('Check your API key in: src/config/googleMaps.ts');
      console.error('Get your API key from: https://console.cloud.google.com/');
      reject(new Error('Failed to load Google Maps API'));
    };

    document.head.appendChild(script);
  });
};

// Check if Google Maps is already loaded
export const isGoogleMapsLoaded = (): boolean => {
  return !!(window.google && window.google.maps);
};

// Declare global window types
declare global {
  interface Window {
    google: typeof google;
  }
}
