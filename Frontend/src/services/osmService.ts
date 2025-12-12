import { OSM_CONFIG } from '../config/osm';

// Rate limiting for Nominatim (1 request per second)
let lastRequestTime = 0;
const waitForRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < OSM_CONFIG.requestDelay) {
    await new Promise(resolve => setTimeout(resolve, OSM_CONFIG.requestDelay - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

export interface Location {
  address: string;
  lat: number;
  lng: number;
  displayName: string;
}

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

/**
 * Search for locations using Nominatim API
 */
export const searchLocations = async (query: string): Promise<Location[]> => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    await waitForRateLimit();

    const params = new URLSearchParams({
      q: query,
      ...OSM_CONFIG.searchParams,
    });

    const response = await fetch(`${OSM_CONFIG.nominatimUrl}/search?${params}`, {
      headers: {
        'User-Agent': OSM_CONFIG.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search locations');
    }

    const results: NominatimResult[] = await response.json();

    return results.map(result => ({
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      displayName: result.display_name,
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    await waitForRateLimit();

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(`${OSM_CONFIG.nominatimUrl}/reverse?${params}`, {
      headers: {
        'User-Agent': OSM_CONFIG.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to reverse geocode');
    }

    const result = await response.json();
    return result.display_name || 'Unknown location';
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return 'Unknown location';
  }
};

/**
 * Calculate route distance using OSRM
 */
export const calculateRouteDistance = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<number> => {
  try {
    const coordinates = `${startLng},${startLat};${endLng},${endLat}`;
    const url = `${OSM_CONFIG.osrmUrl}/route/v1/driving/${coordinates}?overview=false`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to calculate route');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    // Distance is in meters, convert to kilometers
    const distanceInKm = data.routes[0].distance / 1000;
    return Math.round(distanceInKm * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating route distance:', error);
    
    // Fallback to straight-line distance if routing fails
    const straightLineDistance = calculateStraightLineDistance(startLat, startLng, endLat, endLng);
    console.warn('Using straight-line distance as fallback:', straightLineDistance);
    return straightLineDistance;
  }
};

/**
 * Get route polyline for map display using OSRM
 */
export const getRoutePolyline = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<[number, number][]> => {
  try {
    const coordinates = `${startLng},${startLat};${endLng},${endLat}`;
    const url = `${OSM_CONFIG.osrmUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to get route polyline');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    // Convert GeoJSON coordinates [lng, lat] to [lat, lng] for Leaflet
    const coordinates_geojson = data.routes[0].geometry.coordinates;
    return coordinates_geojson.map((coord: [number, number]) => [coord[1], coord[0]]);
  } catch (error) {
    console.error('Error getting route polyline:', error);
    // Return straight line as fallback
    return [[startLat, startLng], [endLat, endLng]];
  }
};

/**
 * Calculate straight-line distance between two points (Haversine formula)
 * Used as fallback when routing fails
 */
export const calculateStraightLineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get detailed route information including duration
 */
export const getRouteDetails = async (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) => {
  try {
    const coordinates = `${startLng},${startLat};${endLng},${endLat}`;
    const url = `${OSM_CONFIG.osrmUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to get route details');
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];

    return {
      distance: Math.round((route.distance / 1000) * 100) / 100, // km
      duration: Math.round(route.duration / 60), // minutes
      polyline: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
    };
  } catch (error) {
    console.error('Error getting route details:', error);
    const straightLineDistance = calculateStraightLineDistance(startLat, startLng, endLat, endLng);
    return {
      distance: straightLineDistance,
      duration: Math.round((straightLineDistance / 60) * 60), // Rough estimate: 60 km/h average
      polyline: [[startLat, startLng], [endLat, endLng]],
    };
  }
};

/**
 * Batch geocode multiple addresses
 * Note: Be careful with rate limits!
 */
export const batchGeocode = async (addresses: string[]): Promise<Location[]> => {
  const results: Location[] = [];
  
  for (const address of addresses) {
    const locations = await searchLocations(address);
    if (locations.length > 0) {
      results.push(locations[0]);
    }
    // Wait for rate limit between requests
    await waitForRateLimit();
  }
  
  return results;
};
