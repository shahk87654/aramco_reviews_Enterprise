'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Search, Plus, X, Trash2 } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  stationCode: string;
  city: string;
  address: string;
  contact?: string;
  managerId?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  totalReviews?: number;
  averageRating?: number;
}

interface NewStationForm {
  name: string;
  stationCode: string;
  city: string;
  address: string;
  contact?: string;
}

export default function AdminStationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStation, setNewStation] = useState<NewStationForm>({
    name: '',
    stationCode: '',
    city: '',
    address: '',
    contact: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setError(err.message || 'Failed to fetch stations');
      console.error('Error fetching stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/stations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newStation),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create station');
      }

      setSuccess('Station added successfully!');
      setNewStation({ name: '', stationCode: '', city: '', address: '', contact: '' });
      setShowAddModal(false);
      fetchStations();
    } catch (err: any) {
      setError(err.message || 'Failed to add station');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStation = async (stationId: string) => {
    setSubmitting(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/stations/${stationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete station');
      }

      setSuccess('Station removed successfully!');
      setDeleteConfirm(null);
      fetchStations();
    } catch (err: any) {
      setError(err.message || 'Failed to delete station');
    } finally {
      setSubmitting(false);
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
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Station
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">{success}</p>
          </div>
        )}

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
              <Card key={station.id} hover className="border-l-4 border-l-green-600 relative">
                <button
                  onClick={() => setDeleteConfirm(station.id)}
                  className="absolute top-4 right-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete station"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

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

      {/* Add Station Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Station</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddStation} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Station Name *</label>
                <input
                  type="text"
                  value={newStation.name}
                  onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Station A-1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Station Code *</label>
                <input
                  type="text"
                  value={newStation.stationCode}
                  onChange={(e) => setNewStation({ ...newStation, stationCode: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., SA-001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  value={newStation.city}
                  onChange={(e) => setNewStation({ ...newStation, city: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Riyadh"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                <input
                  type="text"
                  value={newStation.address}
                  onChange={(e) => setNewStation({ ...newStation, address: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Main Street, Downtown"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact (Optional)</label>
                <input
                  type="text"
                  value={newStation.contact || ''}
                  onChange={(e) => setNewStation({ ...newStation, contact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., +966 50 123 4567"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Station'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Station</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this station? This action will soft-delete the station and it will no longer appear in the system.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStation(deleteConfirm)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
