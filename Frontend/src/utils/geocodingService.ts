// Real-time geocoding service using OpenStreetMap Nominatim API
// This is free and doesn't require an API key
// For production, consider using Google Places API with proper API key

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Search for locations in real-time using OpenStreetMap Nominatim
 * @param query - The search string entered by user
 * @returns Array of location suggestions with coordinates
 */
export async function searchLocations(query: string): Promise<LocationResult[]> {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    // Using Nominatim API (OpenStreetMap)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=10&` +
      `countrycodes=in`, // Restrict to India
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data: LocationResult[] = await response.json();
    return data;
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Get coordinates for a specific address/location
 * @param address - The complete address string
 * @returns Coordinates object with lat and lng
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(address)}&` +
      `format=json&` +
      `limit=1&` +
      `countrycodes=in`
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data: LocationResult[] = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode - get address from coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address string
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${lat}&` +
      `lon=${lng}&` +
      `format=json&` +
      `addressdetails=1`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Calculate route distance using OSRM (Open Source Routing Machine)
 * This provides actual road distances, not straight-line
 * @param sourceLat - Source latitude
 * @param sourceLng - Source longitude
 * @param destLat - Destination latitude
 * @param destLng - Destination longitude
 * @returns Distance in kilometers
 */
export async function calculateRealRouteDistance(
  sourceLat: number,
  sourceLng: number,
  destLat: number,
  destLng: number
): Promise<number> {
  try {
    // Using OSRM (Open Source Routing Machine) for actual road distances
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/` +
      `${sourceLng},${sourceLat};${destLng},${destLat}?` +
      `overview=false`
    );

    if (!response.ok) {
      throw new Error('Route calculation failed');
    }

    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // Distance is in meters, convert to kilometers
      const distanceMeters = data.routes[0].distance;
      const distanceKm = distanceMeters / 1000;
      return Math.round(distanceKm * 100) / 100; // Round to 2 decimal places
    }

    // Fallback to Haversine if routing fails
    return haversineDistance(sourceLat, sourceLng, destLat, destLng);
  } catch (error) {
    console.error('Route calculation error:', error);
    // Fallback to Haversine formula
    return haversineDistance(sourceLat, sourceLng, destLat, destLng);
  }
}

/**
 * Haversine formula for calculating straight-line distance
 * Used as fallback when routing API fails
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
  const distance = R * c;
  
  // Apply 1.3x multiplier to approximate road distance
  return Math.round(distance * 1.3 * 100) / 100;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get route polyline for map visualization
 * @returns Array of coordinate points for drawing the route
 */
export async function getRoutePolyline(
  sourceLat: number,
  sourceLng: number,
  destLat: number,
  destLng: number
): Promise<Array<[number, number]>> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/` +
      `${sourceLng},${sourceLat};${destLng},${destLat}?` +
      `overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error('Route polyline failed');
    }

    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates;
      // Convert from [lng, lat] to [lat, lng] for Leaflet
      return coordinates.map((coord: number[]) => [coord[1], coord[0]]);
    }

    // Fallback to straight line
    return [[sourceLat, sourceLng], [destLat, destLng]];
  } catch (error) {
    console.error('Route polyline error:', error);
    // Fallback to straight line
    return [[sourceLat, sourceLng], [destLat, destLng]];
  }
}
