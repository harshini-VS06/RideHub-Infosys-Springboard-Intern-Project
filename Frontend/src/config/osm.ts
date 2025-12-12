// OpenStreetMap Configuration
// Using Nominatim for geocoding and OSRM for routing
// All services are FREE and open-source!

export const OSM_CONFIG = {
  // Nominatim API for geocoding and reverse geocoding
  nominatimUrl: 'https://nominatim.openstreetmap.org',
  
  // OSRM (Open Source Routing Machine) for route calculation
  osrmUrl: 'https://router.project-osrm.org',
  
  // OpenRouteService as alternative (requires free API key but has better features)
  // Get free key from: https://openrouteservice.org/dev/#/signup
  openRouteServiceUrl: 'https://api.openrouteservice.org',
  openRouteServiceKey: '', // Optional - leave empty to use OSRM instead
  
  // Rate limiting - be respectful to free services
  requestDelay: 1000, // 1 second between requests for Nominatim
  
  // Default search parameters
  searchParams: {
    countrycodes: 'in', // Restrict to India
    limit: 7, // Number of results
    format: 'json',
    addressdetails: 1,
  },
  
  // User agent for API requests (required by Nominatim)
  userAgent: 'RideHub/1.0',
};

// Nominatim Usage Policy:
// 1. Max 1 request per second
// 2. Always include a valid User-Agent
// 3. Use for your own application only
// Read more: https://operations.osmfoundation.org/policies/nominatim/
