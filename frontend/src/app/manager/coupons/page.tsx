'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Gift, CheckCircle, AlertCircle, TrendingUp, MapPin, Copy } from 'lucide-react';

interface RewardClaim {
  id: string;
  phoneNumber: string;
  isClaimed: boolean;
  claimedAt?: string;
  createdAt: string;
  campaign?: {
    rewardType: string;
    name: string;
  };
}

interface StationCouponData {
  stationId: string;
  stationName: string;
  stationCode: string;
  totalGenerated: number;
  totalClaimed: number;
  claimRate: string;
  byRewardType: Record<string, { total: number; claimed: number }>;
}

interface ManagerStation {
  id: string;
  name: string;
  stationCode: string;
}

export default function ManagerCouponsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managedStations, setManagedStations] = useState<ManagerStation[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [stationData, setStationData] = useState<StationCouponData | null>(null);
  const [couponClaims, setCouponClaims] = useState<RewardClaim[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'claimed' | 'pending'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchManagedStations();
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      fetchStationCouponData();
    }
  }, [selectedStationId]);

  const fetchManagedStations = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('managerToken') || localStorage.getItem('adminToken');
      const userStr = localStorage.getItem('user');

      if (!userStr) {
        throw new Error('User not found');
      }

      const user = JSON.parse(userStr);

      const response = await fetch(`${apiUrl}/stations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stations');
      }

      const allStations = await response.json();
      const stations = allStations.filter((s: any) => s.managerId === user.id);

      setManagedStations(stations);
      if (stations.length > 0) {
        setSelectedStationId(stations[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stations');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStationCouponData = async () => {
    if (!selectedStationId) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const token = localStorage.getItem('managerToken') || localStorage.getItem('adminToken');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Use the correct endpoint for manager station claims
      const response = await fetch(`${apiUrl}/campaigns/station/${selectedStationId}/claims`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized. Please login again.');
      }

      if (response.status === 403) {
        throw new Error('Access denied. You do not have permission to view this station.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch coupon data: ${response.status}`);
      }

      const claims = await response.json();
      
      if (!Array.isArray(claims)) {
        throw new Error('Invalid response format from server');
      }

      const totalGenerated = claims.length;
      const totalClaimed = claims.filter((c: any) => c.isClaimed).length;

      const byRewardType: Record<string, { total: number; claimed: number }> = {};
      claims.forEach((claim: any) => {
        const type = claim.campaign?.rewardType || 'unknown';
        if (!byRewardType[type]) {
          byRewardType[type] = { total: 0, claimed: 0 };
        }
        byRewardType[type].total++;
        if (claim.isClaimed) {
          byRewardType[type].claimed++;
        }
      });

      const station = managedStations.find(s => s.id === selectedStationId);

      setStationData({
        stationId: selectedStationId,
        stationName: station?.name || 'Unknown',
        stationCode: station?.stationCode || 'N/A',
        totalGenerated,
        totalClaimed,
        claimRate: totalGenerated > 0 ? ((totalClaimed / totalGenerated) * 100).toFixed(1) : '0',
        byRewardType,
      });

      setCouponClaims(claims);
      setError('');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load coupon data. Please try again.';
      setError(errorMessage);
      console.error('Error fetching coupon data:', err);
      setCouponClaims([]);
      setStationData(null);
    }
  };

  const getRewardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      discount_10_percent: '10% Off on A-Stop',
      free_tea: 'Free Tea',
      free_coffee: 'Free Coffee',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredClaims = couponClaims.filter(claim => {
    const matchesSearch = 
      claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.phoneNumber.includes(searchTerm);
    
    if (filterStatus === 'claimed') return matchesSearch && claim.isClaimed;
    if (filterStatus === 'pending') return matchesSearch && !claim.isClaimed;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="manager" />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading coupon data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || managedStations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="manager" />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-red-900 mb-2">
              {error ? 'Error Loading Coupons' : 'No Stations Assigned'}
            </h2>
            <p className="text-red-800 font-semibold mb-4">
              {error || 'No stations assigned to this manager. Please contact your administrator.'}
            </p>
            {error && (
              <div className="bg-red-100 border border-red-300 rounded p-3 mb-4 font-mono text-xs text-red-900 overflow-auto max-h-24">
                {error}
              </div>
            )}
            <button
              onClick={() => {
                setError('');
                fetchStationCouponData();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
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
      <TopNavigation userRole="manager" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Coupons & Rewards</h1>
          </div>
          <p className="text-gray-600">Track all coupons generated and claimed at your station</p>
        </div>

        {/* Station Selection */}
        {managedStations.length > 1 && (
          <Card className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Station</h2>
            <div className="flex gap-2 flex-wrap">
              {managedStations.map(station => (
                <button
                  key={station.id}
                  onClick={() => setSelectedStationId(station.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all border-2 ${
                    selectedStationId === station.id
                      ? 'bg-green-600 text-white border-green-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                  }`}
                >
                  {station.stationCode}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        {stationData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Total Generated</p>
                  <p className="text-4xl font-bold text-gray-900">{stationData.totalGenerated}</p>
                </div>
                <Gift className="text-yellow-600" size={32} />
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Total Claimed</p>
                  <p className="text-4xl font-bold text-green-600">{stationData.totalClaimed}</p>
                </div>
                <CheckCircle className="text-green-600" size={32} />
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Unclaimed</p>
                  <p className="text-4xl font-bold text-red-600">
                    {stationData.totalGenerated - stationData.totalClaimed}
                  </p>
                </div>
                <AlertCircle className="text-red-600" size={32} />
              </div>
            </Card>

            <Card hover>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Claim Rate</p>
                  <p className="text-4xl font-bold text-blue-600">{stationData.claimRate}%</p>
                </div>
                <TrendingUp className="text-blue-600" size={32} />
              </div>
            </Card>
          </div>
        )}

        {/* Reward Type Breakdown */}
        {stationData && Object.keys(stationData.byRewardType).length > 0 && (
          <Card className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Breakdown by Reward Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stationData.byRewardType).map(([type, stats]) => (
                <div key={type} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">{getRewardTypeLabel(type)}</p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Total: {stats.total}</p>
                    <p className="text-sm text-gray-600">Claimed: {stats.claimed}</p>
                    <p className="text-sm font-bold text-green-600">
                      Rate: {stats.total > 0 ? ((stats.claimed / stats.total) * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Search and Filter */}
        <Card className="mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search by Coupon ID or Phone
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Status
              </label>
              <div className="flex gap-2">
                {(['all', 'claimed', 'pending'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      filterStatus === status
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Coupons Table */}
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Coupons ({filteredClaims.length} of {couponClaims.length})
          </h2>

          {filteredClaims.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Coupon ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Generated Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reward Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Claimed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                            {claim.id.substring(0, 8)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(claim.id, claim.id)}
                            className={`p-1 rounded transition-all ${
                              copiedId === claim.id
                                ? 'bg-green-100 text-green-600'
                                : 'hover:bg-gray-200 text-gray-500'
                            }`}
                            title="Copy full ID"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDate(claim.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono text-sm">
                        {claim.phoneNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                          {getRewardTypeLabel(claim.campaign?.rewardType || 'unknown')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {claim.isClaimed ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            Claimed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {claim.isClaimed && claim.claimedAt ? (
                          formatDate(claim.claimedAt)
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">No coupons found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filter' : 'No coupons generated yet'}
              </p>
            </div>
          )}
        </Card>

        {/* Summary */}
        {stationData && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Station:</strong> {stationData.stationName} ({stationData.stationCode}) • 
              <strong className="ml-4">Total Coupons:</strong> {stationData.totalGenerated} • 
              <strong className="ml-4">Claimed:</strong> {stationData.totalClaimed} • 
              <strong className="ml-4">Pending:</strong> {stationData.totalGenerated - stationData.totalClaimed}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
