'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Plus, Search, X, Edit2, Trash2, Check } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  reviewThreshold: number;
  rewardType: 'discount_10_percent' | 'free_tea' | 'free_coffee';
  status: 'active' | 'inactive' | 'expired';
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    reviewThreshold: 5,
    rewardType: 'discount_10_percent' as 'discount_10_percent' | 'free_tea' | 'free_coffee',
    status: 'active' as 'active' | 'inactive' | 'expired',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newCampaign,
          startDate: newCampaign.startDate || undefined,
          endDate: newCampaign.endDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create campaign');
      }

      fetchCampaigns();
      setNewCampaign({
        name: '',
        description: '',
        reviewThreshold: 5,
        rewardType: 'discount_10_percent',
        status: 'active',
        startDate: '',
        endDate: '',
      });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      fetchCampaigns();
    } catch (err: any) {
      setError(err.message || 'Failed to delete campaign');
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'discount_10_percent':
        return '10% Off on A-Stop';
      case 'free_tea':
        return 'Free Tea';
      case 'free_coffee':
        return 'Free Coffee';
      default:
        return type;
    }
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" userName="Sarah" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Campaigns Management</h1>
            <p className="text-gray-600 mt-2">Create and manage reward campaigns for customers</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            Create Campaign
          </button>
        </div>

        {/* Add Campaign Form */}
        {showAddForm && (
          <Card className="mb-8 border-l-4 border-l-green-600">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create New Campaign</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAddCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g., 5th Review Reward"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Campaign description..."
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Review Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={newCampaign.reviewThreshold}
                    onChange={(e) => setNewCampaign({ ...newCampaign, reviewThreshold: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reward Type</label>
                  <select
                    value={newCampaign.rewardType}
                    onChange={(e) => setNewCampaign({ ...newCampaign, rewardType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="discount_10_percent">10% Off on A-Stop</option>
                    <option value="free_tea">Free Tea</option>
                    <option value="free_coffee">Free Coffee</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date (Optional)</label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date (Optional)</label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Campaign'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} hover className="border-l-4 border-l-blue-600">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{campaign.name}</h3>
                  {campaign.description && (
                    <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteCampaign(campaign.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Campaign"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Review Threshold:</span>
                  <span className="text-xs font-bold text-gray-900">{campaign.reviewThreshold} reviews</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Reward:</span>
                  <span className="text-xs font-bold text-green-600">{getRewardTypeLabel(campaign.rewardType)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      campaign.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : campaign.status === 'expired'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Created: {new Date(campaign.createdAt).toLocaleDateString()}
              </div>
            </Card>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading campaigns...</p>
          </div>
        )}

        {!loading && filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No campaigns found</p>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search term</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

