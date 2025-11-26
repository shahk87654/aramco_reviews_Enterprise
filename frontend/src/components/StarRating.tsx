'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export default function StarRating({ value, onChange, size = 'lg', disabled = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerGap = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  };

  return (
    <div className={`flex ${containerGap[size]} items-center`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          disabled={disabled}
          className={`${sizeClasses[size]} transition-all cursor-pointer hover:scale-110 ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <Star
            className={`w-full h-full ${
              star <= (hoverValue || value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
