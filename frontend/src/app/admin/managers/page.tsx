'use client';

import { useState, useEffect } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Plus, Search, Filter, X, Check, Trash2, Edit2, Save } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  stationCode: string;
  city: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  stations?: Array<{ id: string; name: string; stationCode: string }>;
  lastLogin?: string;
  status: 'active' | 'inactive';
}

export default function AdminManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [editingStations, setEditingStations] = useState<string | null>(null);
  const [updatingStations, setUpdatingStations] = useState<string | null>(null);
  const [managerStations, setManagerStations] = useState<Record<string, string[]>>({});
  const [newManager, setNewManager] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    selectedStationIds: [] as string[],
  });

  useEffect(() => {
    fetchManagers();
    fetchStations();
  }, []);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/auth/managers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch managers');
      }

      const data = await response.json();
      setManagers(data.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        stations: m.stations || [],
        status: m.isActive ? 'active' : 'inactive',
      })));
    } catch (err: any) {
      setError(err.message || 'Failed to load managers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
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
      setStations(data);
    } catch (err: any) {
      console.error('Error fetching stations:', err);
    }
  };

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/auth/create-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: newManager.firstName,
          lastName: newManager.lastName,
          email: newManager.email,
          password: newManager.password,
          stationIds: newManager.selectedStationIds.length > 0 ? newManager.selectedStationIds : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create manager');
      }

      const data = await response.json();
      
      // Refresh managers list
      fetchManagers();

      // Reset form
      setNewManager({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        selectedStationIds: [],
      });
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create manager');
    } finally {
      setCreating(false);
    }
  };

  const toggleStationSelection = (stationId: string) => {
    setNewManager((prev) => ({
      ...prev,
      selectedStationIds: prev.selectedStationIds.includes(stationId)
        ? prev.selectedStationIds.filter((id) => id !== stationId)
        : [...prev.selectedStationIds, stationId],
    }));
  };

  const handleRemoveManager = async (managerId: string) => {
    if (!confirm('Are you sure you want to remove this manager? This will unassign all their stations.')) {
      return;
    }

    try {
      setRemoving(managerId);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/auth/managers/${managerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to remove manager');
      }

      // Refresh managers list
      fetchManagers();
    } catch (err: any) {
      setError(err.message || 'Failed to remove manager');
    } finally {
      setRemoving(null);
    }
  };

  const handleEditStations = (managerId: string) => {
    const manager = managers.find((m) => m.id === managerId);
    if (manager) {
      setManagerStations({
        ...managerStations,
        [managerId]: manager.stations?.map((s) => s.id) || [],
      });
      setEditingStations(managerId);
    }
  };

  const handleCancelEditStations = () => {
    setEditingStations(null);
    setManagerStations({});
  };

  const handleUpdateManagerStations = async (managerId: string) => {
    try {
      setUpdatingStations(managerId);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const token = localStorage.getItem('adminToken') || localStorage.getItem('managerToken');

      const response = await fetch(`${baseUrl}/api/auth/managers/${managerId}/stations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stationIds: managerStations[managerId] || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update manager stations');
      }

      // Refresh managers list
      fetchManagers();
      setEditingStations(null);
      setManagerStations({});
    } catch (err: any) {
      setError(err.message || 'Failed to update manager stations');
    } finally {
      setUpdatingStations(null);
    }
  };

  const toggleStationForManager = (managerId: string, stationId: string) => {
    const currentStations = managerStations[managerId] || [];
    setManagerStations({
      ...managerStations,
      [managerId]: currentStations.includes(stationId)
        ? currentStations.filter((id) => id !== stationId)
        : [...currentStations, stationId],
    });
  };

  const filteredManagers = managers.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" userName="Sarah" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Managers Management</h1>
            <p className="text-gray-600 mt-2">Manage station managers and their assignments</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            Add Manager
          </button>
        </div>

        {/* Add Manager Form */}
        {showAddForm && (
          <Card className="mb-8 border-l-4 border-l-green-600">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add New Manager</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAddManager} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={newManager.firstName}
                  onChange={(e) => setNewManager({ ...newManager, firstName: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newManager.lastName}
                  onChange={(e) => setNewManager({ ...newManager, lastName: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newManager.email}
                  onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  value={newManager.password}
                  onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  minLength={8}
                />
              </div>
              
              {/* Station Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Assign Stations (Optional)
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                  {stations.length === 0 ? (
                    <p className="text-sm text-gray-500">Loading stations...</p>
                  ) : (
                    stations.map((station) => (
                      <label
                        key={station.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newManager.selectedStationIds.includes(station.id)}
                          onChange={() => toggleStationSelection(station.id)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{station.name}</p>
                          <p className="text-xs text-gray-500">{station.stationCode} • {station.city}</p>
                        </div>
                        {newManager.selectedStationIds.includes(station.id) && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </label>
                    ))
                  )}
                </div>
                {newManager.selectedStationIds.length > 0 && (
                  <p className="mt-2 text-xs text-gray-600">
                    {newManager.selectedStationIds.length} station(s) selected
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Manager'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError('');
                    setNewManager({
                      firstName: '',
                      lastName: '',
                      email: '',
                      password: '',
                      selectedStationIds: [],
                    });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={20} />
            Status
          </button>
        </div>

        {/* Managers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredManagers.map((manager) => (
            <Card key={manager.id} hover className={`border-l-4 ${manager.status === 'active' ? 'border-l-green-600' : 'border-l-gray-400'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{manager.name}</h3>
                  <p className="text-sm text-gray-600">{manager.email}</p>
                  <p className="text-xs text-gray-500 mt-2">Last login: {manager.lastLogin}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                      manager.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {manager.status}
                  </span>
                  <button
                    onClick={() => handleRemoveManager(manager.id)}
                    disabled={removing === manager.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove Manager"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Assigned Stations */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-700">Assigned Stations</p>
                  {editingStations !== manager.id ? (
                    <button
                      onClick={() => handleEditStations(manager.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit Stations"
                    >
                      <Edit2 size={14} />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateManagerStations(manager.id)}
                        disabled={updatingStations === manager.id}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                        title="Save"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={handleCancelEditStations}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {editingStations === manager.id ? (
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                    {stations.length === 0 ? (
                      <p className="text-sm text-gray-500">Loading stations...</p>
                    ) : (
                      stations.map((station) => (
                        <label
                          key={station.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(managerStations[manager.id] || []).includes(station.id)}
                            onChange={() => toggleStationForManager(manager.id, station.id)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{station.name}</p>
                            <p className="text-xs text-gray-500">{station.stationCode} • {station.city}</p>
                          </div>
                          {(managerStations[manager.id] || []).includes(station.id) && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </label>
                      ))
                    )}
                  </div>
                ) : (
                  <>
                    {manager.stations && manager.stations.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {manager.stations.map((station) => (
                          <span key={station.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            {station.stationCode}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No stations assigned</p>
                    )}
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading managers...</p>
          </div>
        )}

        {!loading && filteredManagers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No managers found</p>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search term</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
