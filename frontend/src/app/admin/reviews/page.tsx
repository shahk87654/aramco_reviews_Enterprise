'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Search, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: string;
  stationId: string;
  rating: number;
  text: string;
  sentiment: string | null;
  createdAt: string;
  media?: any[];
}

interface Station {
  id: string;
  name: string;
  stationCode: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    station: 'all',
    dateRange: 'all',
    sentiment: 'all',
    rating: 'all',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchStations();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const fetchStations = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      
      const response = await fetch(`${baseUrl}/api/stations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStations(data);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      // Fetch reviews from all stations
      const allReviews: Review[] = [];
      
      if (filters.station === 'all') {
        // Fetch from all stations
        for (const station of stations) {
          try {
            let url = `${baseUrl}/api/stations/${station.id}/reviews?limit=100`;
            
            if (filters.rating !== 'all') {
              url += `&minRating=${filters.rating}&maxRating=${filters.rating}`;
            }

            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              const stationReviews = (data.data || data).map((r: Review) => ({
                ...r,
                stationId: station.id,
              }));
              allReviews.push(...stationReviews);
            }
          } catch (err) {
            console.error(`Error fetching reviews for station ${station.id}:`, err);
          }
        }
      } else {
        // Fetch from selected station
        let url = `${baseUrl}/api/stations/${filters.station}/reviews?limit=100`;
        
        if (filters.rating !== 'all') {
          url += `&minRating=${filters.rating}&maxRating=${filters.rating}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          allReviews.push(...(data.data || data));
        }
      }

      // Filter by date range
      let filtered = allReviews;
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

        filtered = filtered.filter((r) => {
          const reviewDate = new Date(r.createdAt);
          return reviewDate >= filterDate;
        });
      }

      // Filter by sentiment
      if (filters.sentiment !== 'all') {
        filtered = filtered.filter((r) => {
          return r.sentiment?.toLowerCase() === filters.sentiment.toLowerCase();
        });
      }

      // Sort by date (newest first)
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setReviews(filtered);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const sentimentColors = {
    positive: 'bg-green-100 text-green-800 border-green-300',
    neutral: 'bg-gray-100 text-gray-800 border-gray-300',
    negative: 'bg-red-100 text-red-800 border-red-300',
  };

  const getStationName = (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    return station ? `${station.name} (${station.stationCode})` : 'Unknown Station';
  };

  const handleDeleteReview = async (reviewId: string, stationId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(reviewId);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/stations/${stationId}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete review');
      }

      // Refresh reviews list
      fetchReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    } finally {
      setDeleting(null);
    }
  };

  const filteredReviews = reviews.filter((r) =>
    r.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">All Reviews</h1>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Station Filter */}
            <select
              value={filters.station}
              onChange={(e) => setFilters({ ...filters, station: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Stations</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>

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
          </div>

          {/* Sentiment Filter */}
          <div className="mb-6">
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
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <p className="text-center text-gray-600 py-8">No reviews found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} hover className="border-l-4 border-l-green-600">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-400 mb-1">
                        {'⭐'.repeat(review.rating)}
                      </div>
                      <p className="text-xs text-gray-600 font-semibold">{review.rating}/5</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">{getStationName(review.stationId)}</p>
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
                      <p className="text-xs text-gray-600">
                        {new Date(review.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/reviews/${review.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                    >
                      <Eye size={16} />
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteReview(review.id, review.stationId)}
                      disabled={deleting === review.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Review"
                    >
                      <Trash2 size={16} />
                      {deleting === review.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
