'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type TabKey = 'overview' | 'reviews' | 'alerts';
type SentimentLabel = 'positive' | 'neutral' | 'negative';
type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
type AlertStatus = 'new' | 'acknowledged' | 'resolved' | 'escalated';
type ReviewStatus = 'new' | 'in_review' | 'responded' | 'resolved' | 'archived';

interface ReviewStats {
  total: number;
  averageRating: number;
  ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
  sentimentDistribution: Record<SentimentLabel, number>;
  statusDistribution: Record<ReviewStatus, number>;
}

interface AlertItem {
  id: string;
  priority: AlertPriority;
  status: AlertStatus;
  reason: string;
}

interface ReviewListItem {
  id: string;
  title: string;
  content: string;
  rating: number;
  status: ReviewStatus;
  sentiment?: SentimentLabel | null;
}

interface PaginatedReviews {
  data: ReviewListItem[];
}

export default function ManagerDashboard({ stationId }: { stationId: string }) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TabKey>('overview');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const [statsRes, alertsRes, reviewsRes] = await Promise.all([
          axios.get<ReviewStats>(`/api/stations/${stationId}/reviews/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<AlertItem[]>(`/api/stations/${stationId}/alerts`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<PaginatedReviews>(`/api/stations/${stationId}/reviews?limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setStats(statsRes.data);
        setAlerts(alertsRes.data);
        setReviews(reviewsRes.data.data ?? []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [stationId]);

  const handleAlertAction = async (
    alertId: string,
    action: 'acknowledge' | 'resolve',
    resolutionNote?: string
  ) => {
    const token = localStorage.getItem('accessToken');
    try {
      if (action === 'acknowledge') {
        await axios.patch(
          `/api/stations/${stationId}/alerts/${alertId}/acknowledge`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        await axios.patch(
          `/api/stations/${stationId}/alerts/${alertId}/resolve`,
          { resolutionNote },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // Refresh alerts
      const res = await axios.get<AlertItem[]>(`/api/stations/${stationId}/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(res.data);
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading dashboard...</div>;
  }

  const ratingChartData = stats
    ? [
        { name: '⭐⭐⭐⭐⭐', value: stats.ratingDistribution['5'] },
        { name: '⭐⭐⭐⭐', value: stats.ratingDistribution['4'] },
        { name: '⭐⭐⭐', value: stats.ratingDistribution['3'] },
        { name: '⭐⭐', value: stats.ratingDistribution['2'] },
        { name: '⭐', value: stats.ratingDistribution['1'] },
      ]
    : [];

  const sentimentColors: Record<SentimentLabel, string> = {
    positive: '#10b981',
    neutral: '#6b7280',
    negative: '#ef4444',
  };
  const tabs: TabKey[] = ['overview', 'reviews', 'alerts'];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-8">Manager Dashboard</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-6 py-2 rounded font-semibold ${
              selectedTab === tab ? 'btn-primary' : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card">
              <p className="text-gray-600 text-sm">Total Reviews</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm">Average Rating</p>
              <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}/5</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm">Positive Reviews</p>
              <p className="text-3xl font-bold text-green-600">{stats.sentimentDistribution.positive}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm">Negative Reviews</p>
              <p className="text-3xl font-bold text-red-600">{stats.sentimentDistribution.negative}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Sentiment Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Positive', value: stats.sentimentDistribution.positive },
                      { name: 'Neutral', value: stats.sentimentDistribution.neutral },
                      { name: 'Negative', value: stats.sentimentDistribution.negative },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={sentimentColors.positive} />
                    <Cell fill={sentimentColors.neutral} />
                    <Cell fill={sentimentColors.negative} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Review Status</h3>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(stats.statusDistribution).map(([status, count]) => (
                <div key={status} className="text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {selectedTab === 'reviews' && (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Recent Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-lg">{review.title}</h4>
                    <p className="text-gray-600 text-sm">
                      {'⭐'.repeat(review.rating)} ({review.rating}/5)
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${
                    review.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    review.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {review.status}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{review.content.substring(0, 200)}...</p>
                {review.sentiment && (
                  <p className="text-sm" style={{ color: sentimentColors[review.sentiment as keyof typeof sentimentColors] }}>
                    Sentiment: <strong>{review.sentiment}</strong>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4">Active Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-gray-600">No active alerts</p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`border-l-4 p-4 rounded ${
                  alert.priority === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                  alert.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{alert.reason}</h4>
                      <p className="text-sm text-gray-600">Priority: <strong>{alert.priority}</strong></p>
                    </div>
                    <span className="px-3 py-1 rounded text-sm font-semibold bg-gray-200">
                      {alert.status}
                    </span>
                  </div>
                  {alert.status === 'new' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                        className="btn-secondary text-sm"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleAlertAction(alert.id, 'resolve', 'Issue resolved')}
                        className="btn-primary text-sm"
                      >
                        Mark as Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
