'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, QrCode } from 'lucide-react';

interface SuccessPageProps {
  params: { stationId: string };
}

export default function SuccessPage({ params }: SuccessPageProps) {
  const [autoClose, setAutoClose] = useState(false);

  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setAutoClose(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Checkmark Animation */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-24 h-24 animate-bounce">
            <CheckCircle className="w-24 h-24 text-green-600" strokeWidth={1.5} />
          </div>
        </div>

        {/* Thank You Message */}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Thank You!
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Your feedback has been received.
        </p>
        <p className="text-gray-600 mb-8">
          We appreciate your time and will use your input to improve our service.
        </p>

        {/* QR Code Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 inline-block">
          <p className="text-sm text-gray-600 mb-4 font-semibold">Scan QR Code to Submit Another Review</p>
          <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <QrCode size={64} className="text-gray-400" />
          </div>
        </div>

        {/* Info Message */}
        {autoClose ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-6">
              Window will close automatically or you can dismiss it.
            </p>
            <button
              onClick={() => window.close()}
              className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            <p className="mb-4">Auto-closing in a few seconds...</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.close()}
                className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Close
              </button>
              <Link
                href={`/station/${params.stationId}`}
                className="flex-1 px-6 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
