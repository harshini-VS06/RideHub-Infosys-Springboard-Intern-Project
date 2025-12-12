import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import reviewService, { ReviewRequest } from '../services/reviewService';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  driverName: string;
  rideSummary: {
    source: string;
    destination: string;
    date: string;
  };
  onReviewSubmitted?: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  driverName,
  rideSummary,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reviewRequest: ReviewRequest = {
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      };

      await reviewService.submitReview(reviewRequest);
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoveredRating || rating);
          return (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-all hover:scale-125 cursor-pointer"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              style={{
                filter: isActive ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' : 'none'
              }}
            >
              <Star
                size={48}
                fill={isActive ? '#FCD34D' : 'none'}
                stroke={isActive ? '#F59E0B' : '#D1D5DB'}
                strokeWidth={2}
                style={{
                  transition: 'all 0.2s ease'
                }}
              />
            </button>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Rate Your Ride</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Ride Summary */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Driver</span>
              <span className="font-semibold text-gray-800">{driverName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">From</span>
              <span className="font-medium text-gray-800">{rideSummary.source}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">To</span>
              <span className="font-medium text-gray-800">{rideSummary.destination}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Date</span>
              <span className="font-medium text-gray-800">{rideSummary.date}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <label className="block text-center text-gray-700 font-medium">
              How was your experience?
            </label>
            {renderStars()}
            {rating > 0 && (
              <p className="text-center text-sm text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Below Average'}
                {rating === 3 && 'Average'}
                {rating === 4 && 'Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">
              Share your feedback (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={1000}
              placeholder="Tell us about your ride experience..."
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg ${
                isSubmitting || rating === 0
                  ? 'bg-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 hover:shadow-xl'
              }`}
              style={{
                ...(rating > 0 && !isSubmitting ? {
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                  boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
                } : {})
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Submitting Review...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ⭐ Submit Review
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
