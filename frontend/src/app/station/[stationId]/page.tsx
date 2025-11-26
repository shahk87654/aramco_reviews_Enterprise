'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, MapPin, ArrowRight } from 'lucide-react';

interface StationLandingPageProps {
  params: { stationId: string };
}

interface Station {
  id: string;
  name: string;
  code: string;
  address: string;
  phone?: string;
  photo?: string;
  rating?: number;
  reviewCount?: number;
}

export default function StationLandingPage({ params }: StationLandingPageProps) {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStation = async () => {
      try {
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
        
        // Fetch review stats
        const statsResponse = await fetch(`${baseUrl}/api/stations/${params.stationId}/reviews/stats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        let rating = 0;
        let reviewCount = 0;

        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          rating = stats.averageRating || 0;
          reviewCount = stats.total || 0;
        }

        setStation({
          id: data.id,
          name: data.name,
          code: data.stationCode,
          address: data.address,
          phone: data.contact,
          rating,
          reviewCount,
        });
      } catch (err: any) {
        console.error('Error fetching station:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [params.stationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading station information...</p>
        </div>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Station Not Found</h1>
          <p className="text-gray-600 mb-6">The requested station could not be found.</p>
          <Link href="/" className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">Aramco</span>
            <span className="text-sm text-gray-600">Reviews</span>
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Public Review Form</span>
        </div>
      </header>

      {/* Station Banner */}
      {station.photo && (
        <div className="w-full h-48 sm:h-64 overflow-hidden bg-gray-200">
          <img src={station.photo} alt={station.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Station Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{station.name}</h1>
              <p className="text-lg text-gray-600 font-semibold">{station.code}</p>
            </div>
            {station.rating && (
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-500">{station.rating.toFixed(1)}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {station.reviewCount} {station.reviewCount === 1 ? 'Review' : 'Reviews'}
                </div>
              </div>
            )}
          </div>

          {/* Station Details */}
          <div className="space-y-3 mb-8 pb-8 border-b border-gray-200">
            <div className="flex items-start gap-3">
              <MapPin className="text-green-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-gray-900 font-semibold">{station.address}</p>
              </div>
            </div>
            {station.phone && (
              <div className="flex items-start gap-3">
                <Phone className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <a href={`tel:${station.phone}`} className="text-green-600 font-semibold hover:underline">
                    {station.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="text-center sm:text-left">
            <p className="text-gray-600 mb-2">Help us improve</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Rate Your Experience
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl">
              Your feedback helps us provide better service. It takes just 2 minutes to complete a review.
            </p>

            {/* CTA Button */}
            <Link
              href={`/station/${station.id}/review`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:shadow-lg hover:scale-105 transition-all"
            >
              Start Review
              <ArrowRight size={24} />
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">2 min</div>
            <p className="text-gray-600 text-sm">Quick to complete</p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
            <p className="text-gray-600 text-sm">Anonymous feedback</p>
          </div>
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">📱</div>
            <p className="text-gray-600 text-sm">Mobile friendly</p>
          </div>
        </div>
      </div>
    </div>
  );
}
