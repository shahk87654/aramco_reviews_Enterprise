'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { TrendingDown, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ManagerAISummaryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stationData, setStationData] = useState<any>(null);

  useEffect(() => {
    const fetchStationData = async () => {
      try {
        const token = localStorage.getItem('token');
        const stationId = sessionStorage.getItem('selectedStationId');
        if (!stationId) {
          throw new Error('No station selected');
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const baseUrl = apiUrl.replace(/\/api$/, '');
        
        const response = await fetch(`${baseUrl}/api/analytics/station/${stationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStationData(data);
        }
      } catch (err) {
        console.error('Failed to fetch station data:', err);
        setError('Failed to load station analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchStationData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="manager" userName="Manager" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">AI Summary</h1>
          <p className="text-gray-600">AI-powered analysis of your station reviews</p>
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
        ) : !stationData ? (
          <Card className="bg-yellow-50 border-2 border-yellow-200">
            <p className="text-yellow-800 font-semibold">No data available yet. Submit reviews to see analytics.</p>
          </Card>
        ) : (
          <>
            {/* Key Insights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-2">Avg Rating</p>
                    <p className="text-4xl font-bold text-gray-900">{stationData.avgRating?.toFixed(1) || 'N/A'}</p>
                    <p className="text-xs text-gray-600 mt-2">Out of 5 stars</p>
                  </div>
                  <TrendingUp className="text-green-600" size={32} />
                </div>
              </Card>

              <Card hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-2">Total Reviews</p>
                    <p className="text-4xl font-bold text-gray-900">{stationData.totalReviews || 0}</p>
                    <p className="text-xs text-gray-600 mt-2">All time</p>
                  </div>
                  <TrendingUp className="text-blue-600" size={32} />
                </div>
              </Card>

              <Card hover>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-2">Positive Feedback</p>
                    <p className="text-4xl font-bold text-gray-900">{stationData.positivePercentage || 0}%</p>
                    <p className="text-xs text-gray-600 mt-2">Satisfaction rate</p>
                  </div>
                  <Target className="text-amber-600" size={32} />
                </div>
              </Card>
            </div>

            <Card className="bg-blue-50 border-2 border-blue-200">
              <p className="text-blue-800 font-semibold text-center">
                AI insights are generated from your station's actual review data. More reviews provide better analysis.
              </p>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
