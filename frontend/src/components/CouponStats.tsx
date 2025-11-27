'use client';

import { useState, useEffect } from 'react';
import { Gift, CheckCircle, AlertCircle, TrendingUp, Eye } from 'lucide-react';

interface CouponStatsProps {
  stationId: string;
}

interface CouponClaim {
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

interface CouponData {
  totalGenerated: number;
  totalClaimed: number;
  unclaimedCoupons: number;
  claimRate: string;
}

export default function CouponStats({ stationId }: CouponStatsProps) {
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [couponClaims, setCouponClaims] = useState<CouponClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponClaim | null>(null);

  useEffect(() => {
    if (!stationId) return;

    const fetchCouponData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const baseUrl = apiUrl.replace(/\/api$/, '');
        const token = localStorage.getItem('managerToken') || localStorage.getItem('adminToken');

        const response = await fetch(`${baseUrl}/api/campaigns/station/${stationId}/claims`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch coupon data');
        }

        const result = await response.json();
        const claims = result.length > 0 ? result : [];

        const totalGenerated = claims.length;
        const totalClaimed = claims.filter((c: any) => c.isClaimed).length;
        const unclaimedCoupons = totalGenerated - totalClaimed;
        const claimRate = totalGenerated > 0 ? ((totalClaimed / totalGenerated) * 100).toFixed(1) : '0';

        setCouponData({
          totalGenerated,
          totalClaimed,
          unclaimedCoupons,
          claimRate,
        });

        setCouponClaims(claims);
      } catch (err: any) {
        console.error('Error fetching coupon data:', err);
        setError(err.message);
        setCouponData({
          totalGenerated: 0,
          totalClaimed: 0,
          unclaimedCoupons: 0,
          claimRate: '0',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCouponData();
  }, [stationId]);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!couponData) {
    return (
      <div className="py-8 text-center text-gray-600">
        {error ? `Error: ${error}` : 'No coupon data available'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold">Generated</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{couponData.totalGenerated}</p>
            </div>
            <Gift className="text-yellow-600" size={28} />
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold">Claimed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{couponData.totalClaimed}</p>
            </div>
            <CheckCircle className="text-green-600" size={28} />
          </div>
        </div>

        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold">Unclaimed</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{couponData.unclaimedCoupons}</p>
            </div>
            <AlertCircle className="text-red-600" size={28} />
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-semibold">Claim Rate</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{couponData.claimRate}%</p>
            </div>
            <TrendingUp className="text-blue-600" size={28} />
          </div>
        </div>
      </div>

      {/* View Details Toggle */}
      {couponClaims.length > 0 && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
        >
          <Eye className="w-4 h-4" />
          {showDetails ? 'Hide' : 'View'} Coupon Details ({couponClaims.length})
        </button>
      )}

      {/* Detailed Coupons Table */}
      {showDetails && couponClaims.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {couponClaims.map((claim) => (
                  <tr key={claim.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                          {claim.id.substring(0, 8)}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(claim.id)}
                          title="Copy full ID"
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono">
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
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedCoupon(claim)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-semibold transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coupon Detail Modal */}
      {selectedCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Coupon Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 font-semibold mb-2">Coupon ID</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-800 flex-1 break-all">
                    {selectedCoupon.id}
                  </code>
                  <button
                    onClick={() => {
                      copyToClipboard(selectedCoupon.id);
                      alert('Coupon ID copied to clipboard!');
                    }}
                    className="p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-2">Generated</p>
                  <p className="text-sm text-gray-800">
                    {formatDate(selectedCoupon.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-2">Status</p>
                  <p className="text-sm font-semibold">
                    {selectedCoupon.isClaimed ? (
                      <span className="text-green-600">✓ Claimed</span>
                    ) : (
                      <span className="text-yellow-600">⏳ Pending</span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">Phone Number</p>
                <p className="text-sm text-gray-800 font-mono">{selectedCoupon.phoneNumber}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 font-semibold mb-2">Reward Type</p>
                <p className="text-sm text-gray-800">
                  {getRewardTypeLabel(selectedCoupon.campaign?.rewardType || 'unknown')}
                </p>
              </div>

              {selectedCoupon.isClaimed && selectedCoupon.claimedAt && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold mb-2">Claimed On</p>
                  <p className="text-sm text-gray-800">
                    {formatDate(selectedCoupon.claimedAt)}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedCoupon(null)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
