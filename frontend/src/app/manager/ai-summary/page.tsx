'use client';

import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { TrendingDown, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ManagerAISummaryPage() {
  // Mock data for last 7 days
  const summaryData = [
    { date: 'Mon', avgRating: 4.3, reviews: 12 },
    { date: 'Tue', avgRating: 4.5, reviews: 15 },
    { date: 'Wed', avgRating: 4.2, reviews: 10 },
    { date: 'Thu', avgRating: 4.6, reviews: 18 },
    { date: 'Fri', avgRating: 4.7, reviews: 22 },
    { date: 'Sat', avgRating: 4.4, reviews: 25 },
    { date: 'Sun', avgRating: 4.5, reviews: 20 },
  ];

  const commonComplaints = [
    { issue: 'Washroom cleanliness', count: 8, percentage: 12 },
    { issue: 'Convenience store inventory', count: 6, percentage: 9 },
    { issue: 'Payment processing speed', count: 5, percentage: 7 },
  ];

  const positiveAspects = [
    { aspect: 'Staff friendliness', count: 45, percentage: 68 },
    { aspect: 'Fuel quality', count: 38, percentage: 57 },
    { aspect: 'Overall cleanliness', count: 52, percentage: 78 },
  ];

  const suggestedActions = [
    {
      priority: 'High',
      action: 'Increase washroom cleaning frequency to hourly during peak hours',
      impact: 'Could improve satisfaction by ~15%',
    },
    {
      priority: 'Medium',
      action: 'Expand convenience store product range based on customer feedback',
      impact: 'Could improve convenience ratings by ~8%',
    },
    {
      priority: 'Low',
      action: 'Add digital payment option feedback in next survey',
      impact: 'Better understanding of customer needs',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="manager" userName="Ahmed" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">AI Summary</h1>
          <p className="text-gray-600">Analysis of reviews from the last 7 days</p>
        </div>

        {/* Key Insights Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Avg Rating (7 Days)</p>
                <p className="text-4xl font-bold text-gray-900">4.5</p>
                <p className="text-xs text-green-600 mt-2">⬆ +0.2 from previous week</p>
              </div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </Card>

          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Total Reviews</p>
                <p className="text-4xl font-bold text-gray-900">122</p>
                <p className="text-xs text-gray-600 mt-2">↑ +8 more than average</p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </Card>

          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Station Score</p>
                <p className="text-4xl font-bold text-gray-900">78/100</p>
                <p className="text-xs text-gray-600 mt-2">Excellent Performance</p>
              </div>
              <Target className="text-amber-600" size={32} />
            </div>
          </Card>
        </div>

        {/* Rating Trend */}
        <Card className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Rating Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summaryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" />
              <YAxis domain={[3.5, 5]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgRating" stroke="#16a34a" strokeWidth={3} name="Average Rating" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Common Complaints */}
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="text-red-600" size={24} />
              <h2 className="text-lg font-bold text-gray-900">Top Complaints</h2>
            </div>
            <div className="space-y-4">
              {commonComplaints.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-gray-900">{item.issue}</p>
                    <span className="text-sm font-bold text-red-600">{item.count} mentions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Positive Aspects */}
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-green-600" size={24} />
              <h2 className="text-lg font-bold text-gray-900">Top Positives</h2>
            </div>
            <div className="space-y-4">
              {positiveAspects.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-semibold text-gray-900">{item.aspect}</p>
                    <span className="text-sm font-bold text-green-600">{item.count} mentions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Suggested Actions */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-6">Suggested Improvements</h2>
          <div className="space-y-4">
            {suggestedActions.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{item.action}</h3>
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold flex-shrink-0 ${
                      item.priority === 'High'
                        ? 'bg-red-100 text-red-800'
                        : item.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.priority} Priority
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.impact}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
