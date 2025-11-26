'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Search, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: string;
  rating: number;
  text: string;
  sentiment: string | null;
  createdAt: string;
  stationId: string;
  media?: any[];
}

interface Station {
  id: string;
  name: string;
  stationCode: string;
}

export default function ManagerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateRange: 'all',
    rating: 'all',
    sentiment: 'all',
  });

  useEffect(() => {
    fetchUserStations();
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      fetchReviews();
    }
  }, [selectedStationId, filters]);

  const fetchUserStations = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('managerToken') || localStorage.getItem('adminToken');
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        throw new Error('User not found');
      }

      const user = JSON.parse(userStr);
      
      const response = await fetch(`${baseUrl}/api/stations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stations');
      }

      const allStations = await response.json();
      const managedStations = allStations.filter((s: any) => s.managerId === user.id);
      
      setStations(managedStations);
      
      if (managedStations.length > 0) {
        setSelectedStationId(managedStations[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!selectedStationId) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('managerToken') || localStorage.getItem('adminToken');

      let url = `${baseUrl}/api/stations/${selectedStationId}/reviews?limit=100`;

      if (filters.rating !== 'all') {
        url += `&minRating=${filters.rating}&maxRating=${filters.rating}`;
      }

      if (filters.sentiment !== 'all') {
        // Note: Backend may need to support sentiment filtering
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      let reviewsData = data.data || data;

      // Filter by date range
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const filterDate = new Date();
        
        if (filters.dateRange === 'today') {
          filterDate.setHours(0, 0, 0, 0);
        } else if (filters.dateRange === 'week') {
          filterDate.setDate(filterDate.getDate() - 7);
        } else if (filters.dateRange === 'month') {
          filterDate.setMonth(filterDate.getMonth() - 1);
        }

        reviewsData = reviewsData.filter((r: Review) => {
          const reviewDate = new Date(r.createdAt);
          return reviewDate >= filterDate;
        });
      }

      // Filter by sentiment
      if (filters.sentiment !== 'all') {
        reviewsData = reviewsData.filter((r: Review) => {
          return r.sentiment?.toLowerCase() === filters.sentiment.toLowerCase();
        });
      }

      setReviews(reviewsData);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
    }
  };

  const sentimentColors = {
    positive: 'bg-green-100 text-green-800 border-green-300',
    neutral: 'bg-gray-100 text-gray-800 border-gray-300',
    negative: 'bg-red-100 text-red-800 border-red-300',
  };

  const filteredReviews = reviews.filter((r) =>
    r.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="manager" />
        <div className="pt-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="manager" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Reviews</h1>

          {/* Station Selector */}
          {stations.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mr-4">Station:</label>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} ({station.stationCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Date Range Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            {/* Rating Filter */}
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {/* Sentiment Filter */}
            <select
              value={filters.sentiment}
              onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card>
              <p className="text-center text-gray-600 py-8">No reviews found</p>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review.id} hover className="border-l-4 border-l-green-600">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  {/* Rating and Basic Info */}
                  <div className="flex items-start gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-400 mb-1">
                        {'⭐'.repeat(review.rating)}
                      </div>
                      <p className="text-xs text-gray-600 font-semibold">{review.rating}/5</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 mb-2">{review.text}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {review.sentiment && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${sentimentColors[review.sentiment as keyof typeof sentimentColors] || sentimentColors.neutral}`}>
                            {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                          </span>
                        )}
                        {review.media && review.media.length > 0 && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                            📷 Has Photos
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{formatTimeAgo(review.createdAt)}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/manager/reviews/${review.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm flex-shrink-0"
                  >
                    <Eye size={16} />
                    View Details
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
