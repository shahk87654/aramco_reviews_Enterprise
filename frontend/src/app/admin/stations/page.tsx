'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Search } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  stationCode: string;
  city: string;
  address: string;
  managerId?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  totalReviews?: number;
  averageRating?: number;
}

export default function AdminStationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      
      const response = await fetch(`${baseUrl}/api/stations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stations');
      }

      const data = await response.json();
      
      // Fetch stats for each station
      const stationsWithStats = await Promise.all(
        data.map(async (station: Station) => {
          try {
            const statsResponse = await fetch(`${baseUrl}/api/stations/${station.id}/reviews/stats`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              return {
                ...station,
                totalReviews: stats.total || 0,
                averageRating: stats.averageRating || 0,
              };
            }
          } catch (err) {
            console.error(`Error fetching stats for station ${station.id}:`, err);
          }
          
          return {
            ...station,
            totalReviews: 0,
            averageRating: 0,
          };
        })
      );

      setStations(stationsWithStats);
    } catch (err: any) {
      console.error('Error fetching stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStations = stations.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.stationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Stations Management</h1>
            <p className="text-gray-600 mt-2">View and manage all service stations</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, code, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Stations Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading stations...</p>
          </div>
        ) : filteredStations.length === 0 ? (
          <Card>
            <p className="text-center text-gray-600 py-8">No stations found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStations.map((station) => (
              <Card key={station.id} hover className="border-l-4 border-l-green-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{station.name}</h3>
                    <p className="text-sm text-gray-600 font-semibold">{station.stationCode}</p>
                    <p className="text-xs text-gray-500 mt-2">{station.city}</p>
                    <p className="text-xs text-gray-500 mt-1">{station.address}</p>
                  </div>
                  {station.manager ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex-shrink-0">
                      {station.manager.name}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 flex-shrink-0">
                      Unassigned
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">Total Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">{station.totalReviews || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-1">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {station.averageRating ? station.averageRating.toFixed(1) : '0.0'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
