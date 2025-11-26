'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Star, TrendingUp, Shield, BarChart3, ArrowRight, CheckCircle2, Zap, Users, Gift, QrCode, Phone } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  stationCode: string;
  city: string;
  address: string;
}

export default function HomePage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        // Remove /api from apiUrl if present, then add it back to avoid double /api
        const baseUrl = apiUrl.replace(/\/api$/, '');
        const response = await fetch(`${baseUrl}/api/stations`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          throw new Error(`Failed to fetch stations: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setStations(data);
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to load stations. Please ensure the backend is running on http://localhost:3000';
        setError(errorMessage);
        console.error('Error fetching stations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  return (
    <main className="min-h-screen bg-white scroll-smooth">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Aramco Reviews</h1>
              <p className="text-xs text-gray-500">Enterprise Platform</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/manager/login"
              className="px-4 py-2 text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              Manager Login
            </Link>
            <Link
              href="/admin/login"
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-blue-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-transparent to-blue-100/20"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-6 shadow-sm animate-pulse">
              <Zap className="w-4 h-4" />
              Real-time Customer Feedback Platform
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Operational Visibility and
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-green-500 to-blue-600 animate-gradient"> Customer Feedback</span>
              <br />in One Place
            </h1>
            <p className="text-xl lg:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
              Monitor live sentiment and frontline alerts, then collect new feedback from customers at
              the same station—all from a single, powerful interface. <span className="text-green-600 font-semibold">Earn rewards on your 5th review!</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="#stations"
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
              >
                Browse Stations
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/manager/login"
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-green-500 transform hover:scale-105"
              >
                Manager Dashboard
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md">
                <Gift className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-gray-700">Earn Rewards</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md">
                <QrCode className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-700">QR Code Rewards</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md">
                <Phone className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-700">Track by Phone</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              Everything you need to manage customer feedback and improve service quality
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="p-8 bg-gradient-to-br from-green-50 to-white rounded-2xl border-2 border-green-100 hover:border-green-300 hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Get instant insights into customer sentiment, ratings, and feedback trends across all your stations.
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                Leverage advanced AI to analyze feedback patterns and get actionable recommendations.
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-purple-50 to-white rounded-2xl border-2 border-purple-100 hover:border-purple-300 hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Alerts</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive instant notifications for negative reviews and critical issues that need immediate attention.
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-amber-50 to-white rounded-2xl border-2 border-amber-100 hover:border-amber-300 hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multi-Station Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Manage multiple stations from a single dashboard with role-based access control.
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-red-50 to-white rounded-2xl border-2 border-red-100 hover:border-red-300 hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Reviews</h3>
              <p className="text-gray-600 leading-relaxed">
                Collect comprehensive feedback with ratings and detailed comments from customers.
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border-2 border-indigo-100 hover:border-indigo-300 hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Assurance</h3>
              <p className="text-gray-600 leading-relaxed">
                Track and improve service quality across all categories with detailed performance metrics.
              </p>
            </div>
            <div className="p-8 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-2xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-lg">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Reward Campaigns</h3>
              <p className="text-gray-600 leading-relaxed">
                Get rewarded for your feedback! Earn discounts, free coffee, or tea on your 5th review with automatic QR code generation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-6">
              <Gift className="w-4 h-4" />
              Customer Rewards Program
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">Earn Rewards for Your Feedback</h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Share your experience and get rewarded! Track your visits with your phone number and unlock special rewards on your 5th review.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Track Visits</h3>
              <p className="text-green-100">
                Enter your phone number when submitting reviews to track your visits across all stations.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">5th Review Reward</h3>
              <p className="text-green-100">
                On your 5th review, automatically receive a QR code for your reward - 10% off, free coffee, or free tea!
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Easy Claiming</h3>
              <p className="text-green-100">
                Simply scan or show your QR code at any A-Stop location to claim your reward instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stations Section */}
      <section id="stations" className="py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 scroll-smooth">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6">All Service Stations</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
              Select a station to submit your feedback or view reviews
            </p>
          </div>
          
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading stations...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {stations.map((station) => (
                <Link
                  key={station.id}
                  href={`/station/${station.id}`}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 lg:p-8 border-2 border-gray-200 hover:border-green-500 transform hover:-translate-y-2 hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg lg:text-xl leading-tight mb-3 group-hover:text-green-600 transition-colors">
                        {station.name}
                      </h4>
                      <div className="flex items-center text-gray-600 text-sm mb-2">
                        <MapPin className="w-5 h-5 mr-2 text-green-600" />
                        <span className="font-medium">{station.city}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center group-hover:from-green-500 group-hover:to-green-600 transition-all shadow-md group-hover:shadow-lg">
                      <ArrowRight className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{station.address}</p>
                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider">
                      {station.stationCode}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && !error && stations.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-gray-200 max-w-2xl mx-auto">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold">No stations found</p>
              <p className="text-gray-500 mt-2">Please check back later or contact support</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className="text-xl font-bold">Aramco Reviews</span>
              </div>
              <p className="text-gray-400 text-sm">Enterprise Customer Feedback Platform</p>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/manager/login" className="hover:text-white transition-colors">Manager Portal</Link>
              <Link href="/admin/login" className="hover:text-white transition-colors">Admin Portal</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Aramco Reviews Enterprise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
