import api from './apiService';

export interface CreateRideData {
  source: string;
  destination: string;
  rideDate: string;
  rideTime: string;
  totalSeats: number;
  farePerKm: number;
  distance?: number;
}

export const rideService = {
  createRide: async (data: CreateRideData) => {
    const response = await api.post('/rides', data);
    return response.data;
  },

  getMyRides: async () => {
    const response = await api.get('/rides/my-rides');
    return response.data;
  },

  searchRides: async (source: string, destination: string, date: string) => {
    const response = await api.get('/rides/search', {
      params: { source, destination, date },
    });
    return response.data;
  },

  searchRidesWithSmartMatch: async (
    source: string, 
    destination: string, 
    date: string,
    pickupLat: number,
    pickupLng: number,
    dropLat: number,
    dropLng: number
  ) => {
    const response = await api.get('/rides/search/smart-match', {
      params: { source, destination, date, pickupLat, pickupLng, dropLat, dropLng },
    });
    return response.data;
  },

  getAvailableRides: async () => {
    const response = await api.get('/rides/available');
    return response.data;
  },

  getAvailableRidesByGender: async (gender: string) => {
    const response = await api.get(`/rides/available/gender/${gender}`);
    return response.data;
  },

  getRideById: async (id: number) => {
    const response = await api.get(`/rides/${id}`);
    return response.data;
  },

  cancelRide: async (id: number) => {
    const response = await api.delete(`/rides/${id}`);
    return response.data;
  },

  startRide: async (bookingId: number) => {
    const response = await api.post(`/rides/booking/${bookingId}/start`);
    return response.data;
  },

  endRide: async (bookingId: number) => {
    const response = await api.post(`/rides/booking/${bookingId}/end`);
    return response.data;
  },
};