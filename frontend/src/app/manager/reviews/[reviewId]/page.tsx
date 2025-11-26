'use client';

import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Star, AlertCircle, TrendingUp, MessageSquare } from 'lucide-react';

export default function ManagerReviewDetailPage({ params }: { params: { reviewId: string } }) {
  // Mock review data
  const review = {
    id: params.reviewId,
    rating: 5,
    categories: {
      washroom: 5,
      staff: 5,
      fuel: 4,
      cleanliness: 5,
      convenience: 4,
      safety: 5,
    },
    feedback: 'Excellent service overall! The staff was very friendly and helpful. The facility was clean and well-maintained. Only minor issue is the convenience store could have more variety.',
    sentiment: 'positive' as const,
    submittedAt: '2024-01-15 14:30',
    photos: [
      'https://images.unsplash.com/photo-1593642632500-2f3dd6ecda51?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=400&h=300&fit=crop',
    ],
    aiSummary: 'Highly positive review. Customer appreciated cleanliness, staff behavior, and overall experience. Suggested minor improvement in convenience store product range.',
    issues: [],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="manager" userName="Ahmed" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/manager/reviews" className="text-green-600 hover:text-green-700 font-semibold mb-4 inline-flex items-center">
            ← Back to Reviews
          </a>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Review Details</h1>
        </div>

        {/* Main Review Card */}
        <Card className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 pb-8 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-4xl">{'⭐'.repeat(review.rating)}</div>
                <p className="text-sm font-semibold text-gray-600">{review.rating} out of 5</p>
              </div>
              <p className="text-sm text-gray-600 mb-4">Submitted on {review.submittedAt}</p>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-300">
                Positive Sentiment
              </span>
            </div>
          </div>

          {/* Category Ratings */}
          <h3 className="text-lg font-bold text-gray-900 mb-6">Category Ratings</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pb-8 border-b border-gray-200">
            {Object.entries(review.categories).map(([category, rating]) => (
              <div key={category}>
                <p className="text-sm font-semibold text-gray-700 capitalize mb-3">{category.replace('_', ' ')}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${(rating / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{rating}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Feedback Text */}
          <h3 className="text-lg font-bold text-gray-900 mb-4 mt-8">Customer Feedback</h3>
          <p className="text-gray-700 leading-relaxed mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {review.feedback}
          </p>

          {/* Photos */}
          {review.photos.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Uploaded Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {review.photos.map((photo, idx) => (
                  <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                    <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* AI Analysis */}
        <Card className="border-l-4 border-l-blue-600 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <TrendingUp className="text-blue-600 flex-shrink-0" size={24} />
            <h2 className="text-lg font-bold text-gray-900">AI Summary</h2>
          </div>
          <p className="text-gray-700 leading-relaxed text-base mb-4">{review.aiSummary}</p>
          {review.issues.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                Detected Issues
              </h3>
              <ul className="space-y-2">
                {review.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-red-700">
                    <span className="text-lg">⚠️</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Action Section */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Actions</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
              <MessageSquare className="inline-block mr-2" size={18} />
              Send Response
            </button>
            <button className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
              Mark as Addressed
            </button>
            <button className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
              Archive
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
