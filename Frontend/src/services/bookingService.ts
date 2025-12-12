import api from './apiService';

export interface CreateBookingData {
  rideId: number;
  seatsBooked: number;
  pickupLocation: string;
  dropLocation: string;
  segmentDistance: number; // Required - not optional
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  totalFare: number; // Required by backend validation
}

export const bookingService = {
  createBooking: async (data: CreateBookingData) => {
    // Ensure all numeric fields are valid numbers, not NaN or Infinity
    const sanitizedData = {
      rideId: Number(data.rideId),
      seatsBooked: Number(data.seatsBooked),
      pickupLocation: String(data.pickupLocation).trim(),
      dropLocation: String(data.dropLocation).trim(),
      segmentDistance: Number(data.segmentDistance),
      pickupLat: Number(data.pickupLat),
      pickupLng: Number(data.pickupLng),
      dropLat: Number(data.dropLat),
      dropLng: Number(data.dropLng),
      totalFare: Number(data.totalFare),
    };

    // Validate all required fields are present and valid
    if (!sanitizedData.rideId || isNaN(sanitizedData.rideId)) {
      throw new Error('Invalid ride ID');
    }
    if (!sanitizedData.seatsBooked || isNaN(sanitizedData.seatsBooked) || sanitizedData.seatsBooked < 1) {
      throw new Error('Invalid number of seats');
    }
    if (!sanitizedData.pickupLocation || sanitizedData.pickupLocation.length === 0) {
      throw new Error('Pickup location is required');
    }
    if (!sanitizedData.dropLocation || sanitizedData.dropLocation.length === 0) {
      throw new Error('Drop location is required');
    }
    if (isNaN(sanitizedData.segmentDistance) || sanitizedData.segmentDistance <= 0) {
      throw new Error('Invalid segment distance');
    }
    if (isNaN(sanitizedData.pickupLat) || isNaN(sanitizedData.pickupLng)) {
      throw new Error('Invalid pickup coordinates');
    }
    if (isNaN(sanitizedData.dropLat) || isNaN(sanitizedData.dropLng)) {
      throw new Error('Invalid drop coordinates');
    }
    if (isNaN(sanitizedData.totalFare) || sanitizedData.totalFare < 0) {
      throw new Error('Invalid total fare');
    }

    console.log('[bookingService] Sending sanitized booking data:', sanitizedData);
    const response = await api.post('/bookings', sanitizedData);
    return response.data;
  },

  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  getRideBookings: async (rideId: number) => {
    const response = await api.get(`/bookings/ride/${rideId}`);
    return response.data;
  },

  getBookingById: async (id: number) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  cancelBooking: async (id: number) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  },

  startRide: async (bookingId: number) => {
    const response = await api.post(`/rides/bookings/${bookingId}/start-ride`);
    return response.data;
  },

  endRide: async (bookingId: number) => {
    const response = await api.post(`/rides/bookings/${bookingId}/end-ride`);
    return response.data;
  },
};
