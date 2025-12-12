import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRoutePolyline } from '../services/osmService';

// Fix for default markers not showing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different points
const createCustomIcon = (html: string, size: number) => {
  return L.divIcon({
    html: html,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
};

const sourceIcon = createCustomIcon('📍', 40);
const destinationIcon = createCustomIcon('🎯', 40);
const pickupIcon = createCustomIcon('🔵', 35);
const dropoffIcon = createCustomIcon('🟣', 35);

interface MapComponentProps {
  sourceLat?: number;
  sourceLng?: number;
  destLat?: number;
  destLng?: number;
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  sourceLabel?: string;
  destLabel?: string;
  pickupLabel?: string;
  dropLabel?: string;
  showRoute?: boolean;
  showPassengerPoints?: boolean;
  height?: string;
}

// Component to auto-fit bounds and fetch route
function MapController({ 
  bounds, 
  sourceLat,
  sourceLng,
  destLat,
  destLng,
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
  showRoute,
  showPassengerPoints,
  onRouteLoaded 
}: { 
  bounds: L.LatLngBoundsExpression | null;
  sourceLat?: number;
  sourceLng?: number;
  destLat?: number;
  destLng?: number;
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  showRoute?: boolean;
  showPassengerPoints?: boolean;
  onRouteLoaded: (route: Array<[number, number]>) => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (showRoute && sourceLat && sourceLng && destLat && destLng) {
        try {
          const route = await getRoutePolyline(sourceLat, sourceLng, destLat, destLng);
          onRouteLoaded(route);
        } catch (error) {
          console.error('Failed to fetch route:', error);
          // Fallback to straight line
          onRouteLoaded([[sourceLat, sourceLng], [destLat, destLng]]);
        }
      }
    };

    fetchRoute();
  }, [sourceLat, sourceLng, destLat, destLng, showRoute, onRouteLoaded]);

  useEffect(() => {
    const fetchPassengerRoute = async () => {
      if (showPassengerPoints && pickupLat && pickupLng && dropLat && dropLng) {
        // Passenger route will be handled separately in the rendering
      }
    };

    fetchPassengerRoute();
  }, [pickupLat, pickupLng, dropLat, dropLng, showPassengerPoints]);
  
  return null;
}

export function MapComponent({
  sourceLat,
  sourceLng,
  destLat,
  destLng,
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
  sourceLabel = 'Driver Start',
  destLabel = 'Driver End',
  pickupLabel = 'Your Pickup',
  dropLabel = 'Your Drop',
  showRoute = false,
  showPassengerPoints = false,
  height = '400px',
}: MapComponentProps) {
  const [routeLine, setRouteLine] = useState<Array<[number, number]>>([]);
  
  // Calculate center and bounds
  const points: L.LatLngTuple[] = [];
  
  if (sourceLat && sourceLng) points.push([sourceLat, sourceLng]);
  if (destLat && destLng) points.push([destLat, destLng]);
  if (showPassengerPoints && pickupLat && pickupLng) points.push([pickupLat, pickupLng]);
  if (showPassengerPoints && dropLat && dropLng) points.push([dropLat, dropLng]);
  
  // Default center (India)
  const defaultCenter: L.LatLngTuple = [20.5937, 78.9629];
  const center = points.length > 0 ? points[0] : defaultCenter;
  
  // Create bounds if we have points
  const bounds = points.length > 1 ? L.latLngBounds(points) : null;
  
  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map Controller */}
        <MapController 
          bounds={bounds}
          sourceLat={sourceLat}
          sourceLng={sourceLng}
          destLat={destLat}
          destLng={destLng}
          pickupLat={pickupLat}
          pickupLng={pickupLng}
          dropLat={dropLat}
          dropLng={dropLng}
          showRoute={showRoute}
          showPassengerPoints={showPassengerPoints}
          onRouteLoaded={setRouteLine}
        />
        
        {/* Source marker */}
        {sourceLat && sourceLng && (
          <Marker position={[sourceLat, sourceLng]} icon={sourceIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', color: '#3D5A5D', marginBottom: '4px' }}>
                  {sourceLabel}
                </p>
                <p style={{ fontSize: '12px', color: '#3D5A5D', opacity: 0.7 }}>
                  {sourceLat.toFixed(6)}, {sourceLng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Destination marker */}
        {destLat && destLng && (
          <Marker position={[destLat, destLng]} icon={destinationIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', color: '#3D5A5D', marginBottom: '4px' }}>
                  {destLabel}
                </p>
                <p style={{ fontSize: '12px', color: '#3D5A5D', opacity: 0.7 }}>
                  {destLat.toFixed(6)}, {destLng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Main route line (driver's route) */}
        {showRoute && routeLine.length > 1 && (
          <Polyline 
            positions={routeLine} 
            color="#3D5A5D" 
            weight={5}
            opacity={0.7}
          />
        )}
        
        {/* Passenger pickup marker */}
        {showPassengerPoints && pickupLat && pickupLng && (
          <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', color: '#3D5A5D', marginBottom: '4px' }}>
                  {pickupLabel}
                </p>
                <p style={{ fontSize: '12px', color: '#3D5A5D', opacity: 0.7 }}>
                  {pickupLat.toFixed(6)}, {pickupLng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Passenger dropoff marker */}
        {showPassengerPoints && dropLat && dropLng && (
          <Marker position={[dropLat, dropLng]} icon={dropoffIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', color: '#3D5A5D', marginBottom: '4px' }}>
                  {dropLabel}
                </p>
                <p style={{ fontSize: '12px', color: '#3D5A5D', opacity: 0.7 }}>
                  {dropLat.toFixed(6)}, {dropLng.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Passenger route segment (straight line for now) */}
        {showPassengerPoints && pickupLat && pickupLng && dropLat && dropLng && (
          <Polyline 
            positions={[[pickupLat, pickupLng], [dropLat, dropLng]]} 
            color="#EF8F31" 
            weight={4}
            opacity={0.9}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
      
      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 4px;
        }
        
        .leaflet-popup-content {
          margin: 8px 12px;
        }
      `}</style>
    </div>
  );
}
