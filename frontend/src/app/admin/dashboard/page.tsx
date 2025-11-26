'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { BarChart3, AlertCircle, TrendingUp, Globe } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GlobalStats {
  totalReviews: number;
  globalAverage: number;
  negativeAlerts: number;
  activeStations: number;
  topRegions: string[];
}

interface StationLeaderboardItem {
  rank: number;
  name: string;
  region: string;
  rating: number;
  reviews: number;
  status: string;
}

export default function AdminDashboardPage() {
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalReviews: 0,
    globalAverage: 0,
    negativeAlerts: 0,
    activeStations: 0,
    topRegions: [],
  });
  const [stationLeaderboard, setStationLeaderboard] = useState<StationLeaderboardItem[]>([]);
  const [trendData, setTrendData] = useState<Array<{ date: string; reviews: number; avgRating: number }>>([]);
  const [regionPerformance, setRegionPerformance] = useState<Array<{ region: string; avgRating: number; stations: number; reviews: number }>>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<Array<{ category: string; avgRating: number; trend: string }>>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const [statsRes, leaderboardRes, trendsRes, regionsRes, categoriesRes] = await Promise.all([
        fetch(`${baseUrl}/api/analytics/global-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/analytics/station-leaderboard?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/analytics/review-trends?days=30`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/analytics/region-performance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${baseUrl}/api/analytics/category-performance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsRes.ok || !leaderboardRes.ok || !trendsRes.ok || !regionsRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [stats, leaderboard, trends, regions, categories] = await Promise.all([
        statsRes.json(),
        leaderboardRes.json(),
        trendsRes.json(),
        regionsRes.json(),
        categoriesRes.json(),
      ]);

      setGlobalStats(stats);
      setStationLeaderboard(leaderboard);
      setTrendData(trends);
      setRegionPerformance(regions);
      setCategoryPerformance(categories);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="admin" userName="Sarah" />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="admin" userName="Sarah" />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-red-800 font-semibold">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" userName="Sarah" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Global Dashboard</h1>
          <p className="text-gray-600">System-wide insights across all stations</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Total Reviews</p>
                <p className="text-4xl font-bold text-gray-900">{(globalStats.totalReviews / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-600 mt-2">Total reviews</p>
              </div>
              <Globe className="text-green-600" size={32} />
            </div>
          </Card>

          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Global Average</p>
                <p className="text-4xl font-bold text-gray-900">{globalStats.globalAverage.toFixed(1)}</p>
                <p className="text-xs text-gray-600 mt-2">Out of 5.0</p>
              </div>
              <span className="text-3xl">⭐</span>
            </div>
          </Card>

          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Active Stations</p>
                <p className="text-4xl font-bold text-gray-900">{globalStats.activeStations}</p>
                <p className="text-xs text-gray-600 mt-2">Nationwide</p>
              </div>
              <BarChart3 className="text-blue-600" size={32} />
            </div>
          </Card>

          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Critical Alerts</p>
                <p className="text-4xl font-bold text-red-600">{globalStats.negativeAlerts}</p>
                <p className="text-xs text-gray-600 mt-2">Requiring attention</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Review Trends */}
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Review Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[3, 5]} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="reviews" stroke="#3b82f6" strokeWidth={2} name="Review Count" />
                <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="#16a34a" strokeWidth={2} name="Avg Rating" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Regional Performance */}
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Regional Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgRating" fill="#16a34a" name="Avg Rating" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Station Leaderboard */}
        <Card className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Station Performance Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Station</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Region</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Rating</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Reviews</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {stationLeaderboard.map((station) => (
                  <tr key={station.rank} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-block w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-sm">
                        {station.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{station.name}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{station.region}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-gray-900">{station.rating.toFixed(1)}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">{station.reviews}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          station.status === 'excellent'
                            ? 'bg-green-100 text-green-800'
                            : station.status === 'good'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {station.status.replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Category Performance */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-6">Category Performance Across All Stations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categoryPerformance.map((item) => (
              <div key={item.category} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{item.category}</h3>
                  <span className={`text-lg ${item.trend === 'up' ? '📈 text-green-600' : item.trend === 'down' ? '📉 text-red-600' : '➡️ text-gray-600'}`}></span>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">{item.avgRating.toFixed(1)}</p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all"
                    style={{ width: `${(item.avgRating / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
