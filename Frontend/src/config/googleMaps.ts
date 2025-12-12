// Google Maps API Key Configuration
// Get your API key from: https://console.cloud.google.com/

export const GOOGLE_MAPS_CONFIG = {
  // Replace this with your actual Google Maps API Key
  apiKey: 'AIzaSyCJVHy0SHNz-b9E0B_MqYqz0vEI1FXxxx', // ⚠️ REPLACE THIS
  
  libraries: ['places', 'geometry', 'drawing'] as const,
  
  // API endpoints
  enabled: true, // Set to false to disable map features
};

// Check if API key is set
export const isGoogleMapsConfigured = () => {
  return GOOGLE_MAPS_CONFIG.apiKey !== 'AIzaSyCJVHy0SHNz-b9E0B_MqYqz0vEI1FXxxx' && 
         GOOGLE_MAPS_CONFIG.enabled;
};

// Instructions to get your API key:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project
// 3. Enable these APIs:
//    - Maps JavaScript API
//    - Places API  
//    - Geocoding API
//    - Distance Matrix API
// 4. Create credentials (API Key)
// 5. Copy the API key and paste it above
