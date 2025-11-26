'use client';

import { useState } from 'react';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { Save, RotateCcw } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    alertKeywords: 'dirty, slow, broken, issue, problem',
    ratingThreshold: '3',
    emailAlerts: true,
    whatsappEnabled: false,
    whatsappApiKey: '***',
    brandColor: '#16a34a',
    logoUrl: '',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" userName="Sarah" />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Configure system-wide preferences and integrations</p>
        </div>

        {/* Alert Keywords */}
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Alert Keywords</h2>
          <p className="text-sm text-gray-600 mb-4">Words that trigger alerts when detected in feedback (comma-separated)</p>
          <textarea
            value={settings.alertKeywords}
            onChange={(e) => setSettings({ ...settings, alertKeywords: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
          />
        </Card>

        {/* Rating Rules */}
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Rating Rules</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Alert Threshold</label>
              <p className="text-xs text-gray-600 mb-3">Ratings at or below this value trigger alerts</p>
              <select
                value={settings.ratingThreshold}
                onChange={(e) => setSettings({ ...settings, ratingThreshold: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="2">2 Stars and Below</option>
                <option value="3">3 Stars and Below</option>
                <option value="4">4 Stars and Below</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            {/* Email Alerts */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">Email Alerts</p>
                <p className="text-sm text-gray-600">Send email notifications for negative reviews</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.emailAlerts ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.emailAlerts ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* WhatsApp Alerts */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">WhatsApp Integration</p>
                <p className="text-sm text-gray-600">Send alerts via WhatsApp API</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, whatsappEnabled: !settings.whatsappEnabled })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.whatsappEnabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.whatsappEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* WhatsApp API Key */}
            {settings.whatsappEnabled && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp API Key</label>
                <input
                  type="password"
                  value={settings.whatsappApiKey}
                  onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your WhatsApp API key"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Branding Settings */}
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Color</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={settings.brandColor}
                  onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                  className="h-10 w-20 rounded-lg cursor-pointer border border-gray-300"
                />
                <input
                  type="text"
                  value={settings.brandColor}
                  onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Logo URL</label>
              <input
                type="url"
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </Card>

        {/* API Keys Management */}
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">API Keys</h2>
          <div className="space-y-3 mb-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-gray-600">prod_key_****...</p>
                <p className="text-xs text-gray-500">Created: 2024-01-01</p>
              </div>
              <button className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm font-semibold">
                Revoke
              </button>
            </div>
          </div>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm">
            Generate New Key
          </button>
        </Card>

        {/* Save Actions */}
        <div className="flex gap-3 sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4">
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <Save size={20} />
            Save Settings
          </button>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
            <RotateCcw size={20} />
            Reset
          </button>
          {saved && <span className="py-3 text-green-600 font-semibold">✓ Settings saved!</span>}
        </div>
      </div>
    </div>
  );
}
