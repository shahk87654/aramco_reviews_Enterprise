'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNavigation from '@/components/TopNavigation';
import Card from '@/components/Card';
import { User, Mail, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
      }
    } catch (e) {
      console.error('Error reading user:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="admin" />
        <div className="pt-20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation userRole="admin" userName={user?.name || 'Admin'} />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

        <Card>
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'Admin'}</h2>
                <p className="text-gray-600 capitalize">{user?.role || 'admin'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-gray-900 font-semibold">{user?.email || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Shield className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="text-gray-900 font-semibold capitalize">Administrator</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <User className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Account Status</p>
                  <p className="text-green-600 font-semibold">Active</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

