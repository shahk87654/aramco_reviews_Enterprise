'use client';

import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { AlertTriangle, TrendingDown, Lightbulb, Target } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminAIInsightsPage() {
  // Mock data
  const topComplaints = [
    { issue: 'Cleanliness (Washrooms)', count: 156, percentage: 15, trend: 'up' },
    { issue: 'Convenience store inventory', count: 124, percentage: 12, trend: 'up' },
    { issue: 'Long waiting times', count: 98, percentage: 9, trend: 'stable' },
    { issue: 'Payment processing issues', count: 76, percentage: 7, trend: 'down' },
    { issue: 'Limited fuel grades', count: 65, percentage: 6, trend: 'up' },
  ];

  const positiveThemes = [
    { aspect: 'Staff friendliness', count: 542, percentage: 52 },
    { aspect: 'Fuel quality', count: 498, percentage: 48 },
    { aspect: 'Overall cleanliness', count: 456, percentage: 44 },
    { aspect: 'Convenient location', count: 389, percentage: 37 },
    { aspect: 'Fast service', count: 367, percentage: 35 },
  ];

  const regionRiskScores = [
    { region: 'Eastern', riskScore: 42, avgRating: 4.6, reviews: 12400 },
    { region: 'Central', riskScore: 28, avgRating: 4.5, reviews: 15600 },
    { region: 'Western', riskScore: 58, avgRating: 4.2, reviews: 8900 },
  ];

  const suggestedActions = [
    {
      priority: 'Critical',
      issue: 'Washroom cleanliness issues in Western region',
      impact: 'Affecting 15% of feedback',
      action: 'Implement 2-hourly cleaning schedule in Western stations',
      expectedImprovement: '12-18% satisfaction increase',
    },
    {
      priority: 'High',
      issue: 'Convenience store inventory gaps',
      impact: 'Affecting 12% of feedback',
      action: 'Review and optimize stocking strategy based on location',
      expectedImprovement: '8-12% convenience ratings',
    },
    {
      priority: 'Medium',
      issue: 'Waiting time complaints in Central region',
      impact: 'Affecting 9% of feedback',
      action: 'Analyze peak hours and adjust staff accordingly',
      expectedImprovement: '6-10% efficiency improvement',
    },
  ];

  const categoryPerformance = [
    { category: 'Washroom', avgRating: 4.1, trend: -0.3 },
    { category: 'Staff', avgRating: 4.6, trend: 0.2 },
    { category: 'Fuel', avgRating: 4.7, trend: 0.1 },
    { category: 'Cleanliness', avgRating: 4.2, trend: -0.4 },
    { category: 'Convenience', avgRating: 4.0, trend: -0.2 },
    { category: 'Safety', avgRating: 4.5, trend: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" userName="Sarah" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">AI Insights</h1>
          <p className="text-gray-600">System-wide AI analysis and recommendations</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">System Health Score</p>
                <p className="text-4xl font-bold text-gray-900">76/100</p>
                <p className="text-xs text-green-600 mt-2">↑ +3 from last week</p>
              </div>
              <Target className="text-green-600" size={32} />
            </div>
          </Card>

          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Critical Issues</p>
                <p className="text-4xl font-bold text-red-600">3</p>
                <p className="text-xs text-gray-600 mt-2">Require immediate action</p>
              </div>
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </Card>

          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Overall Sentiment</p>
                <p className="text-4xl font-bold text-green-600">62%</p>
                <p className="text-xs text-gray-600 mt-2">Positive feedback ratio</p>
              </div>
              <span className="text-3xl">😊</span>
            </div>
          </Card>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Complaints */}
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Top Complaints Analysis</h2>
            <div className="space-y-4">
              {topComplaints.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${item.trend === 'up' ? '⬆️ text-red-600' : item.trend === 'down' ? '⬇️ text-green-600' : '➡️ text-gray-600'}`}></span>
                      <p className="font-semibold text-gray-900 text-sm">{item.issue}</p>
                    </div>
                    <span className="text-sm font-bold text-red-600">{item.count} mentions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Positives */}
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Top Positive Mentions</h2>
            <div className="space-y-4">
              {positiveThemes.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{item.aspect}</p>
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

        {/* Regional Risk Assessment */}
        <Card className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Regional Risk Assessment</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionRiskScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="riskScore" fill="#ef4444" name="Risk Score (0-100)" />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            {regionRiskScores.map((region) => (
              <div key={region.region} className="text-center">
                <p className="font-semibold text-gray-900 mb-1">{region.region}</p>
                <p className={`text-2xl font-bold ${region.riskScore > 50 ? 'text-red-600' : region.riskScore > 35 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {region.riskScore}
                </p>
                <p className="text-xs text-gray-600 mt-1">Risk Score</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Category Trend Analysis */}
        <Card className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Category Performance Trends</h2>
          <div className="space-y-4">
            {categoryPerformance.map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{item.category}</h3>
                  <span className={`text-lg ${item.trend > 0 ? '📈 text-green-600' : item.trend < 0 ? '📉 text-red-600' : '➡️ text-gray-600'}`}></span>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{item.avgRating.toFixed(1)}/5</p>
                    <p className={`text-xs font-semibold ${item.trend > 0 ? 'text-green-600' : item.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {item.trend > 0 ? '+' : ''}{item.trend.toFixed(1)} from last week
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-600 h-3 rounded-full" style={{ width: `${(item.avgRating / 5) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Suggested Actions */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="text-amber-600" size={24} />
            <h2 className="text-lg font-bold text-gray-900">AI Recommended Actions</h2>
          </div>
          <div className="space-y-4">
            {suggestedActions.map((action, idx) => (
              <div key={idx} className={`border-l-4 p-4 rounded-lg ${
                action.priority === 'Critical'
                  ? 'border-l-red-600 bg-red-50'
                  : action.priority === 'High'
                    ? 'border-l-orange-600 bg-orange-50'
                    : 'border-l-yellow-600 bg-yellow-50'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{action.issue}</h3>
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold flex-shrink-0 ${
                      action.priority === 'Critical'
                        ? 'bg-red-200 text-red-900'
                        : action.priority === 'High'
                          ? 'bg-orange-200 text-orange-900'
                          : 'bg-yellow-200 text-yellow-900'
                    }`}
                  >
                    {action.priority} Priority
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Action:</strong> {action.action}
                </p>
                <div className="flex gap-4 text-xs text-gray-600">
                  <span><strong>Impact:</strong> {action.impact}</span>
                  <span><strong>Expected:</strong> {action.expectedImprovement}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
