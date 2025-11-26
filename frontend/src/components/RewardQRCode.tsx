'use client';

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface RewardQRCodeProps {
  claimId: string;
  qrCode: string;
  rewardType: string;
  campaignName: string;
  onClose: () => void;
  onClaim: () => void;
}

export default function RewardQRCode({
  claimId,
  qrCode,
  rewardType,
  campaignName,
  onClose,
  onClaim,
}: RewardQRCodeProps) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

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

  const handleClaim = async () => {
    try {
      setClaiming(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');

      const response = await fetch(`${baseUrl}/api/campaigns/claims/${claimId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to claim reward');
      }

      setClaimed(true);
      onClaim();
    } catch (error) {
      console.error('Error claiming reward:', error);
      alert('Failed to claim reward. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
          <p className="text-gray-600">You've earned a reward!</p>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Campaign:</p>
            <p className="text-lg font-bold text-gray-900">{campaignName}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-gray-700 mb-1">Reward:</p>
            <p className="text-lg font-bold text-green-600">{getRewardTypeLabel(rewardType)}</p>
          </div>
        </div>

        <div className="mb-6 flex justify-center">
          {qrCode ? (
            <img src={qrCode} alt="QR Code" className="w-64 h-64 border-2 border-gray-200 rounded-lg" />
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Loading QR Code...</p>
            </div>
          )}
        </div>

        {!claimed ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {claiming ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Claiming...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Claim Reward
              </>
            )}
          </button>
        ) : (
          <div className="w-full py-3 bg-green-100 text-green-800 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
            <CheckCircle size={20} />
            Reward Claimed Successfully!
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

