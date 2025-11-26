'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import Alert from '@/components/Alert';

export default function ManagerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      // Remove /api from apiUrl if present, then add it back to avoid double /api
      const baseUrl = apiUrl.replace(/\/api$/, '');
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const data = await response.json();
      
      // Check if user is manager
      if (data.user.role !== 'station_manager' && data.user.role !== 'regional_manager') {
        throw new Error('Access denied. Manager credentials required.');
      }

      localStorage.setItem('managerToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/manager/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-50 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-4xl font-bold text-green-600 mb-2">Aramco</div>
        <div className="text-gray-600 text-lg">Reviews Enterprise</div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 p-8 sm:p-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Manager Login</h1>
        <p className="text-gray-600 mb-8">Access your station dashboard</p>

        {error && (
          <Alert
            type="error"
            title="Login Error"
            message={error}
            onClose={() => setError('')}
            dismissible={true}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@aramco.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link href="/manager/forgot-password" className="text-sm text-green-600 hover:text-green-700 font-semibold">
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-600 text-center">
        Need help?{' '}
        <a href="#" className="text-green-600 hover:text-green-700 font-semibold">
          Contact Support
        </a>
      </p>
    </div>
  );
}
