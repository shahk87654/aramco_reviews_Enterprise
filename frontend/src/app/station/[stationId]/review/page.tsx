'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StarRating from '@/components/StarRating';
import Alert from '@/components/Alert';
import axios from 'axios';
import RewardQRCode from '@/components/RewardQRCode';

interface ReviewFormPageProps {
  params: { stationId: string };
}

interface Station {
  id: string;
  name: string;
  code: string;
}

interface FormField {
  id: string;
  label: string;
  type: 'rating' | 'text' | 'textarea' | 'upload';
  required: boolean;
  category?: string;
}

interface FormData {
  overallRating: number;
  categoryRatings: Record<string, number>;
  feedback: string;
  customerName: string;
  phoneNumber: string;
  submittedAt?: string;
}

export default function ReviewFormPage({ params }: ReviewFormPageProps) {
  const router = useRouter();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [reward, setReward] = useState<{
    claimId: string;
    qrCode: string;
    rewardType: string;
    campaignName: string;
  } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    overallRating: 0,
    categoryRatings: {
      washroom: 0,
      staff: 0,
      fuel: 0,
      cleanliness: 0,
      convenience: 0,
      safety: 0,
    },
    feedback: '',
    customerName: '',
    phoneNumber: '',
  });

  const categoryFields: FormField[] = [
    { id: 'washroom', label: 'Washroom', type: 'rating', required: true, category: 'washroom' },
    { id: 'staff', label: 'Staff Behaviour', type: 'rating', required: true, category: 'staff' },
    { id: 'fuel', label: 'Fuel Quality', type: 'rating', required: true, category: 'fuel' },
    { id: 'cleanliness', label: 'Cleanliness', type: 'rating', required: true, category: 'cleanliness' },
    { id: 'convenience', label: 'Convenience Store', type: 'rating', required: true, category: 'convenience' },
    { id: 'safety', label: 'Safety & Security', type: 'rating', required: true, category: 'safety' },
  ];

  useEffect(() => {
    const fetchStation = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const baseUrl = apiUrl.replace(/\/api$/, '');
        
        const response = await fetch(`${baseUrl}/api/stations/${params.stationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Station not found');
        }

        const data = await response.json();
        setStation({
          id: data.id,
          name: data.name,
          code: data.stationCode || '',
        });
      } catch (err: any) {
        console.error('Error fetching station:', err);
        setError('Failed to load station information');
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [params.stationId]);

  const handleCategoryRating = (category: string, rating: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryRatings: {
        ...prev.categoryRatings,
        [category]: rating,
      },
    }));
    updateProgress();
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      feedback: e.target.value,
    }));
    updateProgress();
  };


  const updateProgress = () => {
    let completed = 0;
    const total = 7; // overall rating + 6 categories + feedback

    if (formData.overallRating > 0) completed++;
    Object.values(formData.categoryRatings).forEach((rating) => {
      if (rating > 0) completed++;
    });
    if (formData.feedback.trim().length > 0) completed++;

    setProgress(Math.round((completed / total) * 100));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.overallRating === 0) {
      setError('Please rate your overall experience');
      return;
    }

    if (Object.values(formData.categoryRatings).some((r) => r === 0)) {
      setError('Please rate all categories');
      return;
    }

    if (!formData.customerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError('Please enter your contact number');
      return;
    }

    // Validate phone number length (9-13 digits)
    const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 13) {
      setError('Phone number must be 9 to 13 digits long');
      return;
    }

    setSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('accessToken');

      // Calculate average rating from category ratings
      const categoryValues = Object.values(formData.categoryRatings);
      const avgCategoryRating = categoryValues.reduce((sum, rating) => sum + rating, 0) / categoryValues.length;
      const finalRating = Math.round((formData.overallRating + avgCategoryRating) / 2);

      // Submit review
      const response = await axios.post(
        `${baseUrl}/api/stations/${params.stationId}/reviews`,
        {
          title: `Review for ${station?.name}`,
          content: formData.feedback || 'No additional feedback provided',
          rating: finalRating,
          category: 'other',
          visitDate: new Date().toISOString().split('T')[0],
          customerName: formData.customerName,
          phoneNumber: phoneDigits, // Use cleaned phone number
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json',
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
        // Redirect to success page
        router.push(`/station/${params.stationId}/success`);
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Station Not Found</h1>
          <p className="text-gray-600">The requested station could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{station.name}</h1>
            </div>
            <span className="text-xs font-semibold text-gray-500">REVIEW FORM</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">{progress}% Complete</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert
              type="error"
              title="Form Error"
              message={error}
              onClose={() => setError('')}
              dismissible={true}
            />
          )}

          {/* Overall Rating */}
          <div className="bg-white rounded-lg shadow p-6 sm:p-8">
            <label className="block mb-4">
              <span className="text-lg font-bold text-gray-900 block mb-2">Overall Rating *</span>
              <span className="text-sm text-gray-600">How would you rate your overall experience?</span>
            </label>
            <div className="flex justify-center py-4">
              <StarRating value={formData.overallRating} onChange={(rating) => {
                setFormData((prev) => ({ ...prev, overallRating: rating }));
                updateProgress();
              }} />
            </div>
            {formData.overallRating > 0 && (
              <p className="text-center text-gray-600 mt-2">You rated: {formData.overallRating} out of 5</p>
            )}
          </div>

          {/* Category Ratings */}
          <div className="bg-white rounded-lg shadow p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Rate Each Category *</h2>
            <div className="space-y-8">
              {categoryFields.map((field) => (
                <div key={field.id}>
                  <label className="block mb-3">
                    <span className="text-base font-semibold text-gray-900">{field.label}</span>
                  </label>
                  <div className="flex justify-center sm:justify-start">
                    <StarRating
                      value={formData.categoryRatings[field.id] || 0}
                      onChange={(rating) => handleCategoryRating(field.id, rating)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-lg shadow p-6 sm:p-8">
            <label className="block mb-4">
              <span className="text-lg font-bold text-gray-900 block mb-2">Your Feedback</span>
              <span className="text-sm text-gray-600">Tell us about your experience (optional)</span>
            </label>
            <textarea
              value={formData.feedback}
              onChange={handleFeedbackChange}
              placeholder="What went well? What could be improved?"
              maxLength={2000}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
            />
            <p className="text-xs text-gray-600 mt-2">{formData.feedback.length}/2000 characters</p>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Your Information <span className="text-red-500">*</span></h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">
                  <span className="text-base font-semibold text-gray-900">Your Name <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter your name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Required for campaign tracking and reward management
                </p>
              </div>
              <div>
                <label className="block mb-2">
                  <span className="text-base font-semibold text-gray-900">Contact Number <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '') }))}
                  placeholder="9-13 digits (e.g., 923001234567)"
                  pattern="[0-9]{9,13}"
                  required
                  maxLength={13}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Required to track visits and earn rewards on your 5th review! Must be 9-13 digits.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:p-6">
            <div className="max-w-4xl mx-auto flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {reward && (
        <RewardQRCode
          claimId={reward.claimId}
          qrCode={reward.qrCode}
          rewardType={reward.rewardType}
          campaignName={reward.campaignName}
          onClose={() => {
            setReward(null);
            router.push(`/station/${params.stationId}/success`);
          }}
          onClaim={() => {
            setReward(null);
            router.push(`/station/${params.stationId}/success`);
          }}
        />
      )}
    </div>
  );
}
