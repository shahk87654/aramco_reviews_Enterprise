'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import RewardQRCode from './RewardQRCode';

type CategoryValue =
  | 'fuel_quality'
  | 'service_quality'
  | 'cleanliness'
  | 'staff_behavior'
  | 'pricing'
  | 'facilities'
  | 'wait_time'
  | 'other';

interface ReviewFormData {
  title: string;
  content: string;
  rating: number;
  category: CategoryValue;
  visitDate: string;
  customerName: string;
  phoneNumber: string;
}

const initialFormState: ReviewFormData = {
  title: '',
  content: '',
  rating: 5,
  category: 'other',
  visitDate: new Date().toISOString().split('T')[0],
  customerName: '',
  phoneNumber: '',
};

const categories: { value: CategoryValue; label: string }[] = [
  { value: 'fuel_quality', label: 'Fuel Quality' },
  { value: 'service_quality', label: 'Service Quality' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'staff_behavior', label: 'Staff Behavior' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'wait_time', label: 'Wait Time' },
  { value: 'other', label: 'Other' },
];

export default function ReviewSubmissionForm({ stationId }: { stationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ReviewFormData>(initialFormState);
  const [reward, setReward] = useState<{
    claimId: string;
    qrCode: string;
    rewardType: string;
    campaignName: string;
  } | null>(null);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    const fieldName = name as keyof ReviewFormData;
    const nextValue = fieldName === 'rating' ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: nextValue as ReviewFormData[typeof fieldName],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('accessToken');
      
      // Validate required fields
      if (!formData.customerName.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }

      if (!formData.phoneNumber.trim()) {
        setError('Please enter your contact number');
        setLoading(false);
        return;
      }

      // Validate phone number length (9-13 digits)
      const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
      if (phoneDigits.length < 9 || phoneDigits.length > 13) {
        setError('Phone number must be 9 to 13 digits long');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${baseUrl}/api/stations/${stationId}/reviews`,
        {
          ...formData,
          phoneNumber: phoneDigits, // Use cleaned phone number
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Check if reward was generated
      if (response.data.reward) {
        setReward({
          claimId: response.data.reward.claimId,
          qrCode: response.data.reward.qrCode,
          rewardType: response.data.reward.rewardType,
          campaignName: response.data.reward.campaignName,
        });
      } else {
        // Show success message
        alert('Review submitted successfully! Thank you for your feedback.');
        // Reset form
        setFormData(initialFormState);
        // Redirect after short delay
        setTimeout(() => router.push(`/stations/${stationId}`), 1000);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to submit review');
      } else {
        setError('Failed to submit review');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">Share Your Experience</h1>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="mb-4">
        <label className="block text-gray-700 font-semibold mb-2">Rating *</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  rating: star,
                }))
              }
              className={`text-4xl ${formData.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="text-gray-600 text-sm mt-2">{formData.rating} out of 5 stars</p>
      </div>

      <div className="mb-4">
        <label htmlFor="title" className="block text-gray-700 font-semibold mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Brief title for your review"
          maxLength={100}
          required
          className="input-field w-full"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="content" className="block text-gray-700 font-semibold mb-2">
          Your Review *
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="Tell us about your experience. What went well? What could be improved?"
          rows={6}
          maxLength={2000}
          required
          className="input-field w-full"
        />
        <p className="text-gray-600 text-sm mt-1">{formData.content.length}/2000 characters</p>
      </div>

      <div className="mb-4">
        <label htmlFor="customerName" className="block text-gray-700 font-semibold mb-2">
          Your Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="customerName"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
          placeholder="Enter your name"
          className="input-field w-full"
          required
        />
        <p className="text-gray-600 text-sm mt-1">
          Required for campaign tracking and reward management
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="phoneNumber" className="block text-gray-700 font-semibold mb-2">
          Contact Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="9-13 digits (e.g., 923001234567)"
          pattern="[0-9]{9,13}"
          className="input-field w-full"
          required
        />
        <p className="text-gray-600 text-sm mt-1">
          Required to track visits and earn rewards on your 5th review! Must be 9-13 digits.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="category" className="block text-gray-700 font-semibold mb-2">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input-field w-full"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="visitDate" className="block text-gray-700 font-semibold mb-2">
            Visit Date
          </label>
          <input
            type="date"
            id="visitDate"
            name="visitDate"
            value={formData.visitDate}
            onChange={handleChange}
            className="input-field w-full"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>

      {reward && (
        <RewardQRCode
          claimId={reward.claimId}
          qrCode={reward.qrCode}
          rewardType={reward.rewardType}
          campaignName={reward.campaignName}
          onClose={() => {
            setReward(null);
            setFormData(initialFormState);
            setTimeout(() => router.push(`/stations/${stationId}`), 500);
          }}
          onClaim={() => {
            setReward(null);
            setFormData(initialFormState);
            setTimeout(() => router.push(`/stations/${stationId}`), 1000);
          }}
        />
      )}
    </form>
  );
}
