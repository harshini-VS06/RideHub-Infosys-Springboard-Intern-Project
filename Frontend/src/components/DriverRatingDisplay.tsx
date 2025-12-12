import React from 'react';
import { Star } from 'lucide-react';

interface DriverRatingDisplayProps {
  averageRating: number | null;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
  showReviewCount?: boolean;
}

const DriverRatingDisplay: React.FC<DriverRatingDisplayProps> = ({
  averageRating,
  totalReviews,
  size = 'md',
  showReviewCount = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const starSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  if (!averageRating || totalReviews === 0) {
    return (
      <div className={`flex items-center gap-1 text-gray-400 ${sizeClasses[size]}`}>
        <Star size={starSizes[size]} className="text-gray-300" />
        <span>No reviews yet</span>
      </div>
    );
  }

  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => {
          const starNumber = index + 1;
          
          if (starNumber <= fullStars) {
            return (
              <Star
                key={index}
                size={starSizes[size]}
                className="fill-yellow-400 text-yellow-400"
              />
            );
          } else if (starNumber === fullStars + 1 && hasHalfStar) {
            return (
              <div key={index} className="relative">
                <Star
                  size={starSizes[size]}
                  className="text-gray-300"
                />
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star
                    size={starSizes[size]}
                    className="fill-yellow-400 text-yellow-400"
                  />
                </div>
              </div>
            );
          } else {
            return (
              <Star
                key={index}
                size={starSizes[size]}
                className="text-gray-300"
              />
            );
          }
        })}
      </div>
      <span className="font-semibold text-gray-800">
        {averageRating.toFixed(1)}
      </span>
      {showReviewCount && (
        <span className="text-gray-500">
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

export default DriverRatingDisplay;
