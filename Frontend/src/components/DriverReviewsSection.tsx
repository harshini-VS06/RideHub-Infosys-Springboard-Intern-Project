import React, { useState, useEffect } from 'react';
import { Star, User, Calendar, Loader2, MessageSquare, MapPin, RefreshCw } from 'lucide-react';
import reviewService from '../services/reviewService';
import { authService } from '../services/authService';
import { toast } from 'sonner';

interface Review {
  id: number;
  rating: number;
  comment: string;
  passengerName: string;
  source: string;
  destination: string;
  rideDate: string;
  createdAt: string;
}

interface DriverRating {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

interface DriverReviewsSectionProps {
  refreshTrigger?: number; // Use this to trigger refresh from parent
}

export const DriverReviewsSection: React.FC<DriverReviewsSectionProps> = ({ refreshTrigger }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<DriverRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  // Refresh when trigger changes (e.g., when tab becomes active)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('Refresh triggered by parent component');
      fetchReviews(true);
    }
  }, [refreshTrigger]);

  const fetchReviews = async (isManualRefresh: boolean = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      }
      const userData = authService.getCurrentUser();
      if (!userData) {
        console.warn('No user data found');
        setRating({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {}
        });
        setReviews([]);
        setLoading(false);
        return;
      }

      if (!userData.id) {
        console.warn('User ID not found');
        setRating({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {}
        });
        setReviews([]);
        setLoading(false);
        return;
      }

      console.log('Fetching reviews for driver ID:', userData.id);

      // Fetch rating summary and reviews
      try {
        const ratingData = await reviewService.getDriverRating(userData.id);
        console.log('Rating data received:', ratingData);
        setRating(ratingData);
      } catch (ratingError: any) {
        console.log('No rating data found:', ratingError.response?.status);
        // If no rating found, set defaults
        setRating({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {}
        });
      }

      try {
        const reviewsData = await reviewService.getDriverReviews(userData.id);
        console.log('Reviews data received:', reviewsData.length, 'reviews');
        setReviews(reviewsData);
      } catch (reviewsError: any) {
        console.log('No reviews found:', reviewsError.response?.status);
        // If no reviews found, set empty array
        setReviews([]);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      
      // Set defaults for error cases
      setRating({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {}
      });
      setReviews([]);

      // Only show error toast for non-404 errors
      if (error.response?.status !== 404) {
        toast.error('Unable to load reviews', {
          description: 'This may be due to connectivity issues. Your data will load when available.'
        });
      }
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        setRefreshing(false);
      }
    }
  };

  const handleRefresh = () => {
    fetchReviews(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    return 'Below Average';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="animate-spin" size={48} style={{ color: '#EF8F31' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: '#3D5A5D' }}>
          Your Reviews
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#F9C05E', color: '#3D5A5D' }}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {/* Rating Summary Card */}
      {rating && rating.totalReviews > 0 ? (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <h3 className="text-4xl font-bold mb-2" style={{ color: '#3D5A5D' }}>
              {rating.averageRating.toFixed(1)}
            </h3>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(rating.averageRating))}
            </div>
            <p className="text-lg" style={{ color: '#EF8F31', fontWeight: 'bold' }}>
              {getRatingText(rating.averageRating)}
            </p>
            <p className="text-sm mt-1" style={{ color: '#3D5A5D', opacity: 0.7 }}>
              Based on {rating.totalReviews} {rating.totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = rating.ratingDistribution[star] || 0;
              const percentage = rating.totalReviews > 0 ? (count / rating.totalReviews) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-semibold w-8" style={{ color: '#3D5A5D' }}>
                    {star} ⭐
                  </span>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm w-12 text-right" style={{ color: '#3D5A5D', opacity: 0.7 }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 rounded-2xl p-8 text-center">
          <Star size={48} className="mx-auto mb-4 text-blue-400" />
          <h3 className="text-xl font-bold mb-2" style={{ color: '#3D5A5D' }}>
            No Reviews Yet
          </h3>
          <p style={{ color: '#3D5A5D', opacity: 0.7 }}>
            Complete your first ride to receive reviews from passengers
          </p>
        </div>
      )}

      {/* Individual Reviews */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold" style={{ color: '#3D5A5D' }}>
            Recent Reviews
          </h3>
          
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#F9C05E' }}
                  >
                    <User size={24} style={{ color: '#3D5A5D' }} />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: '#3D5A5D' }}>
                      {review.passengerName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                        {review.rating}.0
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: '#3D5A5D', opacity: 0.6 }}>
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>

              {/* Ride Details */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} style={{ color: '#EF8F31' }} />
                  <span style={{ color: '#3D5A5D' }}>
                    {review.source} → {review.destination}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <Calendar size={14} style={{ color: '#3D5A5D', opacity: 0.6 }} />
                  <span style={{ color: '#3D5A5D', opacity: 0.7 }}>
                    {formatDate(review.rideDate)}
                  </span>
                </div>
              </div>

              {/* Comment */}
              {review.comment && (
                <div className="flex gap-2">
                  <MessageSquare size={16} className="mt-1 flex-shrink-0" style={{ color: '#EF8F31' }} />
                  <p style={{ color: '#3D5A5D', lineHeight: '1.6' }}>
                    "{review.comment}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
