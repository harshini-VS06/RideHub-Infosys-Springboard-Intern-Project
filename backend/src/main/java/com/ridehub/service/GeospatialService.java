package com.ridehub.service;

import org.springframework.stereotype.Service;

@Service
public class GeospatialService {
    
    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double ROUTE_TOLERANCE_KM = 5.0; // 5km tolerance for route matching
    
    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    public double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return EARTH_RADIUS_KM * c;
    }
    
    /**
     * Calculate fare based on distance and rate per kilometer
     */
    public double calculateFare(double distanceKm, double ratePerKm) {
        return Math.round(distanceKm * ratePerKm * 100.0) / 100.0;
    }
    
    /**
     * Check if a point lies on or near a route (within tolerance)
     * Uses perpendicular distance from point to line segment
     */
    public boolean isPointOnRoute(
            double pointLat, double pointLng,
            double routeStartLat, double routeStartLng,
            double routeEndLat, double routeEndLng) {
        
        // Calculate perpendicular distance from point to line segment
        double distance = perpendicularDistance(
            pointLat, pointLng,
            routeStartLat, routeStartLng,
            routeEndLat, routeEndLng
        );
        
        // Check if point is within tolerance
        return distance <= ROUTE_TOLERANCE_KM;
    }
    
    /**
     * Check if both pickup and dropoff points match the driver's route
     */
    public boolean doPointsMatchRoute(
            double pickupLat, double pickupLng,
            double dropLat, double dropLng,
            double routeStartLat, double routeStartLng,
            double routeEndLat, double routeEndLng) {
        
        // Check if pickup point is on route
        boolean pickupOnRoute = isPointOnRoute(
            pickupLat, pickupLng,
            routeStartLat, routeStartLng,
            routeEndLat, routeEndLng
        );
        
        // Check if drop point is on route
        boolean dropOnRoute = isPointOnRoute(
            dropLat, dropLng,
            routeStartLat, routeStartLng,
            routeEndLat, routeEndLng
        );
        
        // Ensure pickup comes before drop along the route
        boolean correctOrder = isPickupBeforeDrop(
            pickupLat, pickupLng,
            dropLat, dropLng,
            routeStartLat, routeStartLng,
            routeEndLat, routeEndLng
        );
        
        return pickupOnRoute && dropOnRoute && correctOrder;
    }
    
    /**
     * Calculate perpendicular distance from point to line segment
     */
    private double perpendicularDistance(
            double pointLat, double pointLng,
            double lineStartLat, double lineStartLng,
            double lineEndLat, double lineEndLng) {
        
        // Convert to radians
        double lat1 = Math.toRadians(lineStartLat);
        double lng1 = Math.toRadians(lineStartLng);
        double lat2 = Math.toRadians(lineEndLat);
        double lng2 = Math.toRadians(lineEndLng);
        double latP = Math.toRadians(pointLat);
        double lngP = Math.toRadians(pointLng);
        
        // Calculate distances
        double d13 = calculateDistance(lineStartLat, lineStartLng, pointLat, pointLng);
        double d23 = calculateDistance(lineEndLat, lineEndLng, pointLat, pointLng);
        double d12 = calculateDistance(lineStartLat, lineStartLng, lineEndLat, lineEndLng);
        
        // Handle edge cases
        if (d12 < 0.001) { // Points are essentially the same
            return d13;
        }
        
        // Use cross-track distance formula
        double bearing13 = getBearing(lineStartLat, lineStartLng, pointLat, pointLng);
        double bearing12 = getBearing(lineStartLat, lineStartLng, lineEndLat, lineEndLng);
        
        double crossTrackDistance = Math.asin(
            Math.sin(d13 / EARTH_RADIUS_KM) * 
            Math.sin(bearing13 - bearing12)
        ) * EARTH_RADIUS_KM;
        
        return Math.abs(crossTrackDistance);
    }
    
    /**
     * Calculate bearing between two points
     */
    private double getBearing(double lat1, double lng1, double lat2, double lng2) {
        double dLng = Math.toRadians(lng2 - lng1);
        lat1 = Math.toRadians(lat1);
        lat2 = Math.toRadians(lat2);
        
        double y = Math.sin(dLng) * Math.cos(lat2);
        double x = Math.cos(lat1) * Math.sin(lat2) -
                   Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
        
        return Math.atan2(y, x);
    }
    
    /**
     * Check if pickup point comes before drop point along the route
     */
    private boolean isPickupBeforeDrop(
            double pickupLat, double pickupLng,
            double dropLat, double dropLng,
            double routeStartLat, double routeStartLng,
            double routeEndLat, double routeEndLng) {
        
        // Calculate distances from route start to each point
        double distToPickup = calculateDistance(routeStartLat, routeStartLng, pickupLat, pickupLng);
        double distToDrop = calculateDistance(routeStartLat, routeStartLng, dropLat, dropLng);
        
        // Pickup should be closer to start than drop
        return distToPickup < distToDrop;
    }
    
    /**
     * Calculate segment distance between pickup and drop points
     */
    public double calculateSegmentDistance(
            double pickupLat, double pickupLng,
            double dropLat, double dropLng) {
        
        return calculateDistance(pickupLat, pickupLng, dropLat, dropLng);
    }
}
