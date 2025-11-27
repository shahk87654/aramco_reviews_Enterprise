'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { AlertTriangle, TrendingDown, Lightbulb, Target } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminAIInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const baseUrl = apiUrl.replace(/\/api$/, '');
        
        const response = await fetch(`${baseUrl}/api/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load AI insights');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" userName="Admin" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">AI Insights</h1>
          <p className="text-gray-600">System-wide AI analysis and recommendations</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading analytics...</p>
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-2 border-red-200">
            <p className="text-red-800 font-semibold">{error}</p>
          </Card>
        ) : !analyticsData ? (
          <Card className="bg-yellow-50 border-2 border-yellow-200">
            <p className="text-yellow-800 font-semibold">No analytics data available yet. Check back after reviews are submitted.</p>
          </Card>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <Card hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-2">Total Reviews</p>
                    <p className="text-4xl font-bold text-gray-900">{analyticsData.totalReviews || 0}</p>
                    <p className="text-xs text-green-600 mt-2">Across all stations</p>
                  </div>
                  <Target className="text-green-600" size={32} />
                </div>
              </Card>

              <Card hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-2">Average Rating</p>
                    <p className="text-4xl font-bold text-gray-900">{analyticsData.avgRating?.toFixed(1) || 'N/A'}</p>
                    <p className="text-xs text-gray-600 mt-2">Out of 5 stars</p>
                  </div>
                  <Target className="text-blue-600" size={32} />
                </div>
              </Card>

              <Card hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-2">Total Stations</p>
                    <p className="text-4xl font-bold text-gray-900">{analyticsData.totalStations || 0}</p>
                    <p className="text-xs text-gray-600 mt-2">Active stations</p>
                  </div>
                  <AlertTriangle className="text-amber-600" size={32} />
                </div>
              </Card>
            </div>

            <Card className="bg-blue-50 border-2 border-blue-200 mb-8">
              <p className="text-blue-800 font-semibold text-center">
                AI insights are generated from real review data. Submit more reviews to get detailed analysis and recommendations.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
