import apiService from './apiService';

export interface ReviewRequest {
  bookingId: number;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: number;
  bookingId: number;
  rideId: number;
  driverId: number;
  driverName: string;
  passengerId: number;
  passengerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  source: string;
  destination: string;
  rideDate: string;
}

export interface DriverRatingResponse {
  driverId: number;
  driverName?: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

const reviewService = {
  /**
   * Submit a review for a completed booking
   */
  submitReview: async (request: ReviewRequest): Promise<ReviewResponse> => {
    const response = await apiService.post('/reviews/submit', request);
    return response.data.data; // Extract from ApiResponse wrapper
  },

  /**
   * Get review for a specific booking
   */
  getReviewByBooking: async (bookingId: number): Promise<ReviewResponse> => {
    const response = await apiService.get(`/reviews/booking/${bookingId}`);
    return response.data.data; // Extract from ApiResponse wrapper
  },

  /**
   * Check if a review exists for a booking
   */
  hasReview: async (bookingId: number): Promise<boolean> => {
    const response = await apiService.get(`/reviews/booking/${bookingId}/exists`);
    // Backend returns ApiResponse<Boolean> with structure: { success: true, message: "...", data: boolean }
    // We need to access the nested 'data' property to get the actual boolean value
    return response.data.data;
  },

  /**
   * Get all reviews for a driver
   */
  getDriverReviews: async (driverId: number): Promise<ReviewResponse[]> => {
    const response = await apiService.get(`/reviews/driver/${driverId}`);
    return response.data.data; // Extract from ApiResponse wrapper
  },

  /**
   * Get driver's rating summary
   */
  getDriverRating: async (driverId: number): Promise<DriverRatingResponse> => {
    const response = await apiService.get(`/reviews/driver/${driverId}/rating`);
    return response.data.data; // Extract from ApiResponse wrapper
  },

  /**
   * Get all reviews by a passenger
   */
  getPassengerReviews: async (passengerId: number): Promise<ReviewResponse[]> => {
    const response = await apiService.get(`/reviews/passenger/${passengerId}`);
    return response.data.data; // Extract from ApiResponse wrapper
  },

  /**
   * Get all reviews for a ride
   */
  getRideReviews: async (rideId: number): Promise<ReviewResponse[]> => {
    const response = await apiService.get(`/reviews/ride/${rideId}`);
    return response.data.data; // Extract from ApiResponse wrapper
  },
};

export default reviewService;
