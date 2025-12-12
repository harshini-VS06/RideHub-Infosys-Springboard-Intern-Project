// Mock distance calculator for Indian cities
// In production, this would use Google Routes API: Compute Routes
// https://developers.google.com/maps/documentation/routes/compute_route_directions

interface CityCoordinates {
  [key: string]: { lat: number; lng: number };
}

// Major Indian city coordinates
const cityCoordinates: CityCoordinates = {
  'Mumbai, Maharashtra': { lat: 19.0760, lng: 72.8777 },
  'Pune, Maharashtra': { lat: 18.5204, lng: 73.8567 },
  'Delhi, Delhi': { lat: 28.7041, lng: 77.1025 },
  'New Delhi, Delhi': { lat: 28.6139, lng: 77.2090 },
  'Bangalore, Karnataka': { lat: 12.9716, lng: 77.5946 },
  'Chennai, Tamil Nadu': { lat: 13.0827, lng: 80.2707 },
  'Kolkata, West Bengal': { lat: 22.5726, lng: 88.3639 },
  'Hyderabad, Telangana': { lat: 17.3850, lng: 78.4867 },
  'Ahmedabad, Gujarat': { lat: 23.0225, lng: 72.5714 },
  'Surat, Gujarat': { lat: 21.1702, lng: 72.8311 },
  'Jaipur, Rajasthan': { lat: 26.9124, lng: 75.7873 },
  'Lucknow, Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
  'Kanpur, Uttar Pradesh': { lat: 26.4499, lng: 80.3319 },
  'Nagpur, Maharashtra': { lat: 21.1458, lng: 79.0882 },
  'Indore, Madhya Pradesh': { lat: 22.7196, lng: 75.8577 },
  'Thane, Maharashtra': { lat: 19.2183, lng: 72.9781 },
  'Bhopal, Madhya Pradesh': { lat: 23.2599, lng: 77.4126 },
  'Visakhapatnam, Andhra Pradesh': { lat: 17.6868, lng: 83.2185 },
  'Pimpri-Chinchwad, Maharashtra': { lat: 18.6298, lng: 73.7997 },
  'Patna, Bihar': { lat: 25.5941, lng: 85.1376 },
  'Vadodara, Gujarat': { lat: 22.3072, lng: 73.1812 },
  'Ghaziabad, Uttar Pradesh': { lat: 28.6692, lng: 77.4538 },
  'Ludhiana, Punjab': { lat: 30.9010, lng: 75.8573 },
  'Agra, Uttar Pradesh': { lat: 27.1767, lng: 78.0081 },
  'Nashik, Maharashtra': { lat: 19.9975, lng: 73.7898 },
  'Faridabad, Haryana': { lat: 28.4089, lng: 77.3178 },
  'Meerut, Uttar Pradesh': { lat: 28.9845, lng: 77.7064 },
  'Rajkot, Gujarat': { lat: 22.3039, lng: 70.8022 },
  'Varanasi, Uttar Pradesh': { lat: 25.3176, lng: 82.9739 },
  'Srinagar, Jammu and Kashmir': { lat: 34.0837, lng: 74.7973 },
  'Aurangabad, Maharashtra': { lat: 19.8762, lng: 75.3433 },
  'Dhanbad, Jharkhand': { lat: 23.7957, lng: 86.4304 },
  'Amritsar, Punjab': { lat: 31.6340, lng: 74.8723 },
  'Navi Mumbai, Maharashtra': { lat: 19.0330, lng: 73.0297 },
  'Allahabad, Uttar Pradesh': { lat: 25.4358, lng: 81.8463 },
  'Ranchi, Jharkhand': { lat: 23.3441, lng: 85.3096 },
  'Howrah, West Bengal': { lat: 22.5958, lng: 88.2636 },
  'Coimbatore, Tamil Nadu': { lat: 11.0168, lng: 76.9558 },
  'Jabalpur, Madhya Pradesh': { lat: 23.1815, lng: 79.9864 },
  'Gwalior, Madhya Pradesh': { lat: 26.2183, lng: 78.1828 },
  'Vijayawada, Andhra Pradesh': { lat: 16.5062, lng: 80.6480 },
  'Jodhpur, Rajasthan': { lat: 26.2389, lng: 73.0243 },
  'Madurai, Tamil Nadu': { lat: 9.9252, lng: 78.1198 },
  'Raipur, Chhattisgarh': { lat: 21.2514, lng: 81.6296 },
  'Kota, Rajasthan': { lat: 25.2138, lng: 75.8648 },
  'Chandigarh, Punjab': { lat: 30.7333, lng: 76.7794 },
  'Gurgaon, Haryana': { lat: 28.4595, lng: 77.0266 },
  'Mysore, Karnataka': { lat: 12.2958, lng: 76.6394 },
  'Bareilly, Uttar Pradesh': { lat: 28.3670, lng: 79.4304 },
  'Goa, Goa': { lat: 15.2993, lng: 74.1240 },
  'Mangalore, Karnataka': { lat: 12.9141, lng: 74.8560 },
};

/**
 * Calculate straight-line distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate route distance between two cities
 * In production: Use Google Routes API - Compute Routes
 * https://routes.googleapis.com/directions/v2:computeRoutes
 * 
 * Mock implementation: Uses Haversine formula with 1.3x multiplier
 * to approximate actual road distance
 */
export async function calculateRouteDistance(
  source: string,
  destination: string
): Promise<number> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!source || !destination) {
    return 0;
  }

  const sourceCoords = cityCoordinates[source];
  const destCoords = cityCoordinates[destination];

  if (!sourceCoords || !destCoords) {
    // Fallback: return a random distance for unknown cities
    console.warn(`Coordinates not found for ${source} or ${destination}`);
    return Math.round(Math.random() * 300 + 100); // 100-400 km
  }

  // Calculate straight-line distance
  const straightLine = haversineDistance(
    sourceCoords.lat,
    sourceCoords.lng,
    destCoords.lat,
    destCoords.lng
  );

  // Apply 1.3x multiplier to approximate actual road distance
  // Real roads are not straight lines
  const roadDistance = straightLine * 1.3;

  // Round to 2 decimal places
  return Math.round(roadDistance * 100) / 100;
}

/**
 * Calculate fare based on distance and custom rate per kilometer
 * @param distanceKm - Distance in kilometers
 * @param ratePerKm - Custom rate per kilometer set by driver
 * @returns Fare rounded to nearest whole rupee
 */
export function calculateFare(distanceKm: number, ratePerKm: number): number {
  const validRate = parseFloat(String(ratePerKm)) || 0;
  return Math.round(distanceKm * validRate);
}

/**
 * Calculate distance for a segment of the route
 * Used when passenger selects pickup/drop within a larger route
 */
export async function calculateSegmentDistance(
  pickup: string,
  drop: string,
  originalSource: string,
  originalDestination: string
): Promise<number> {
  // In production, this would validate that pickup/drop are on the route
  // and calculate the actual segment distance using Routes API
  
  // For mock: Calculate distance between pickup and drop
  const segmentDistance = await calculateRouteDistance(pickup, drop);
  
  // Validate segment is not larger than original route
  const fullDistance = await calculateRouteDistance(originalSource, originalDestination);
  
  if (segmentDistance > fullDistance) {
    // If segment is longer, it's likely the points are not on the route
    // Return a proportional distance instead
    return fullDistance * 0.7; // Assume 70% of route
  }
  
  return segmentDistance;
}

/**
 * Check if a city exists in our database
 */
export function isCityKnown(city: string): boolean {
  return city in cityCoordinates;
}

/**
 * Get approximate coordinates for a city (for map centering)
 */
export function getCityCoordinates(city: string): { lat: number; lng: number } | null {
  return cityCoordinates[city] || null;
}

/**
 * Get all city coordinates (for autocomplete with coordinates)
 */
export function getAllCityCoordinates(): CityCoordinates {
  return cityCoordinates;
}
