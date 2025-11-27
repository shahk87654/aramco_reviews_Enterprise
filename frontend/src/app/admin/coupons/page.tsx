'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Gift, MapPin, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface StationCouponData {
  stationId: string;
  stationName: string;
  stationCode: string;
  totalGenerated: number;
  totalClaimed: number;
  claimRate: string;
  byRewardType: Record<string, { total: number; claimed: number }>;
}

interface CouponDashboardData {
  stations: StationCouponData[];
  totalGenerated: number;
  totalClaimed: number;
}

export default function AdminCouponsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<CouponDashboardData | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [stationClaims, setStationClaims] = useState<any[]>([]);

  useEffect(() => {
    fetchCouponData();
  }, []);

  const fetchCouponData = async () => {
    try {
      setLoading(true);
      setError('');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/campaigns/admin/claims-by-station`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch coupon data');
      }

      const result = await response.json();
      setData(result);
      if (result.stations.length > 0) {
        setSelectedStationId(result.stations[0].stationId);
        fetchStationClaims(result.stations[0].stationId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load coupon data');
      console.error('Error fetching coupon data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStationClaims = async (stationId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/campaigns/admin/station/${stationId}/claims`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch station claims');
      }

      const result = await response.json();
      setStationClaims(result.claims || []);
    } catch (err: any) {
      console.error('Error fetching station claims:', err);
      setStationClaims([]);
    }
  };

  const handleStationSelect = (stationId: string) => {
    setSelectedStationId(stationId);
    fetchStationClaims(stationId);
  };

  const getRewardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      discount_10_percent: '10% Off on A-Stop',
      free_tea: 'Free Tea',
      free_coffee: 'Free Coffee',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="admin" />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading coupon data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="admin" />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-red-800 font-semibold">{error}</p>
            <button
              onClick={fetchCouponData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="admin" />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No coupon data available</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedStation = data.stations.find(s => s.stationId === selectedStationId);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Coupon Dashboard</h1>
          </div>
          <p className="text-gray-600">Track where coupons are generated and claimed across all stations</p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Total Coupons Generated</p>
                <p className="text-4xl font-bold text-gray-900">{data.totalGenerated}</p>
              </div>
              <Gift className="text-yellow-600" size={32} />
            </div>
          </Card>

          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Total Coupons Claimed</p>
                <p className="text-4xl font-bold text-green-600">{data.totalClaimed}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </Card>

          <Card hover>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 font-semibold mb-2">Claim Rate</p>
                <p className="text-4xl font-bold text-blue-600">
                  {data.totalGenerated > 0 ? ((data.totalClaimed / data.totalGenerated) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </Card>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Station List */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Stations</h2>
              <div className="space-y-2">
                {data.stations.map((station) => (
                  <button
                    key={station.stationId}
                    onClick={() => handleStationSelect(station.stationId)}
                    className={`w-full text-left p-3 rounded-lg transition-all border-2 ${
                      selectedStationId === station.stationId
                        ? 'bg-green-50 border-green-500'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{station.stationCode}</p>
                    <p className="text-xs text-gray-600 mt-1">{station.stationName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {station.totalGenerated} generated
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {station.totalClaimed} claimed
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Station Details */}
          <div className="lg:col-span-2">
            {selectedStation ? (
              <Card>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  {selectedStation.stationName}
                </h2>

                {/* Station Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">Generated</p>
                    <p className="text-2xl font-bold text-yellow-600">{selectedStation.totalGenerated}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">Claimed</p>
                    <p className="text-2xl font-bold text-green-600">{selectedStation.totalClaimed}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">Claim Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedStation.claimRate}%</p>
                  </div>
                </div>

                {/* Reward Types Breakdown */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">By Reward Type</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedStation.byRewardType).map(([type, stats]: [string, any]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{getRewardTypeLabel(type)}</p>
                          <p className="text-xs text-gray-600">
                            {stats.claimed} of {stats.total} claimed
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {stats.total > 0 ? ((stats.claimed / stats.total) * 100).toFixed(0) : 0}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <p className="text-center text-gray-600 py-8">Select a station to view details</p>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Claims */}
        {stationClaims.length > 0 && (
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Claims for {selectedStation?.stationCode}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Reward Type</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Generated</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stationClaims.slice(0, 10).map((claim) => (
                    <tr key={claim.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3 text-gray-600">{claim.phoneNumber}</td>
                      <td className="py-3 px-3">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {getRewardTypeLabel(claim.campaign?.rewardType)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        {claim.isClaimed ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            <CheckCircle className="w-3 h-3" />
                            Claimed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stationClaims.length > 10 && (
              <p className="text-xs text-gray-600 mt-4 text-center">Showing 10 of {stationClaims.length} claims</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
