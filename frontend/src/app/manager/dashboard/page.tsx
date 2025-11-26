'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { TrendingUp, AlertCircle, Smile, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Station {
  id: string;
  name: string;
  stationCode: string;
}

interface ReviewStats {
  total: number;
  averageRating: number;
  ratingDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  sentimentDistribution: Record<string, number>;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  sentiment: string;
  createdAt: string;
}

export default function ManagerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchUserStations();
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      fetchStationData();
    }
  }, [selectedStationId]);

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
      
      // Fetch stations where this user is manager
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
      // Filter stations where this user is the manager
      const managedStations = allStations.filter((s: any) => s.managerId === user.id);
      
      setStations(managedStations);
      
      if (managedStations.length > 0) {
        setSelectedStationId(managedStations[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStationData = async () => {
    if (!selectedStationId) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('managerToken') || localStorage.getItem('adminToken');

      // Fetch stats
      const statsResponse = await fetch(`${baseUrl}/api/stations/${selectedStationId}/reviews/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch recent reviews
      const reviewsResponse = await fetch(`${baseUrl}/api/stations/${selectedStationId}/reviews?limit=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.data || []);
      }

      // Fetch alerts
      const alertsResponse = await fetch(`${baseUrl}/api/stations/${selectedStationId}/alerts?resolved=false`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.data || []);
      }
    } catch (err: any) {
      console.error('Error fetching station data:', err);
    }
  };

  // Calculate derived stats
  const calculatedStats = stats ? {
    averageRating: stats.averageRating || 0,
    todayReviews: reviews.filter(r => {
      const reviewDate = new Date(r.createdAt);
      const today = new Date();
      return reviewDate.toDateString() === today.toDateString();
    }).length,
    weekReviews: reviews.filter(r => {
      const reviewDate = new Date(r.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reviewDate >= weekAgo;
    }).length,
    monthReviews: reviews.filter(r => {
      const reviewDate = new Date(r.createdAt);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return reviewDate >= monthAgo;
    }).length,
    negativeAlerts: alerts.length,
    positiveReviews: stats.sentimentDistribution?.positive || 0,
    neutralReviews: stats.sentimentDistribution?.neutral || 0,
    negativeReviews: stats.sentimentDistribution?.negative || 0,
  } : {
    averageRating: 0,
    todayReviews: 0,
    weekReviews: 0,
    monthReviews: 0,
    negativeAlerts: 0,
    positiveReviews: 0,
    neutralReviews: 0,
    negativeReviews: 0,
  };

  // Generate chart data from real reviews
  const ratingsTrendData = reviews.length > 0 ? (() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayReviews = reviews.filter(r => {
        const reviewDate = new Date(r.createdAt);
        return reviewDate.toDateString() === date.toDateString();
      });
      const avgRating = dayReviews.length > 0
        ? dayReviews.reduce((sum, r) => sum + r.rating, 0) / dayReviews.length
        : 0;
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        rating: parseFloat(avgRating.toFixed(1)),
      };
    });
  })() : [];

  const sentimentData = [
    { name: 'Positive', value: calculatedStats.positiveReviews, fill: '#10b981' },
    { name: 'Neutral', value: calculatedStats.neutralReviews, fill: '#6b7280' },
    { name: 'Negative', value: calculatedStats.negativeReviews, fill: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="manager" />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="manager" />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="manager" />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">No stations assigned to you.</p>
          </div>
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Dashboard</h1>

          {/* Station Selector */}
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-semibold text-gray-700">Select Station:</label>
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
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Average Rating */}
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Average Rating</p>
                <p className="text-4xl font-bold text-gray-900">{calculatedStats.averageRating.toFixed(1)}</p>
                <p className="text-xs text-gray-600 mt-2">Out of 5.0</p>
              </div>
              <div className="text-3xl text-amber-400">⭐</div>
            </div>
          </Card>

          {/* Today's Reviews */}
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Reviews Today</p>
                <p className="text-4xl font-bold text-gray-900">{calculatedStats.todayReviews}</p>
                <p className="text-xs text-green-600 mt-2">📈 Recent activity</p>
              </div>
              <BarChart3 className="text-green-600" size={32} />
            </div>
          </Card>

          {/* Negative Alerts */}
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Negative Alerts</p>
                <p className="text-4xl font-bold text-red-600">{calculatedStats.negativeAlerts}</p>
                <p className="text-xs text-gray-600 mt-2">Needs attention</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </Card>

          {/* Sentiment Breakdown */}
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Positive Ratio</p>
                <p className="text-4xl font-bold text-green-600">
                  {calculatedStats.positiveReviews + calculatedStats.neutralReviews + calculatedStats.negativeReviews > 0
                    ? Math.round((calculatedStats.positiveReviews / (calculatedStats.positiveReviews + calculatedStats.neutralReviews + calculatedStats.negativeReviews)) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-gray-600 mt-2">Excellent</p>
              </div>
              <Smile className="text-green-600" size={32} />
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Ratings Trend */}
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Ratings Over Time</h2>
            {ratingsTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ratingsTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rating" stroke="#16a34a" strokeWidth={3} dot={{ fill: '#16a34a' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </Card>

          {/* Sentiment Distribution */}
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Sentiment Distribution</h2>
            {sentimentData.some(s => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value">
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </Card>
        </div>

        {/* Recent Reviews */}
        <Card className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-bold">⭐</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {review.rating}-star review submitted
                    </p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{review.text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No reviews yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
