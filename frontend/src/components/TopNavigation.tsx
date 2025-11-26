'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Settings, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TopNavigationProps {
  userRole?: 'manager' | 'admin';
  userName?: string;
}

export default function TopNavigation({ userRole = 'manager', userName: propUserName }: TopNavigationProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userName, setUserName] = useState(propUserName || 'Manager');

  useEffect(() => {
    // Get user info from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.name) {
          setUserName(user.name);
        } else if (user.email) {
          setUserName(user.email.split('@')[0]);
        }
      }
    } catch (e) {
      console.error('Error reading user from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    // Close profile menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (profileMenuOpen && !target.closest('.profile-dropdown')) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileMenuOpen]);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('managerToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Redirect to appropriate login page
    if (userRole === 'admin') {
      router.push('/admin/login');
    } else {
      router.push('/manager/login');
    }
  };

  const handleProfileClick = () => {
    setProfileMenuOpen(false);
    // Navigate to profile page or show profile modal
    if (userRole === 'admin') {
      router.push('/admin/profile');
    } else {
      router.push('/manager/profile');
    }
  };

  const managerLinks = [
    { href: '/manager/dashboard', label: 'Dashboard' },
    { href: '/manager/reviews', label: 'Reviews' },
    { href: '/manager/ai-summary', label: 'AI Summary' },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/reviews', label: 'Reviews' },
    { href: '/admin/stations', label: 'Stations' },
    { href: '/admin/managers', label: 'Managers' },
    { href: '/admin/campaigns', label: 'Campaigns' },
    { href: '/admin/ai-insights', label: 'AI Insights' },
    { href: '/admin/settings', label: 'Settings' },
  ];

  const links = userRole === 'admin' ? adminLinks : managerLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={userRole === 'admin' ? '/admin/dashboard' : '/manager/dashboard'} className="flex items-center">
            <span className="text-2xl font-bold text-green-600">Aramco</span>
            <span className="ml-2 text-sm text-gray-600">Reviews</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-green-600 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>

            {/* Profile Dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  {userName.charAt(0)}
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <p className="font-semibold text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-600 capitalize mt-1">{userRole} Account</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={handleProfileClick}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2 text-gray-700 transition-colors"
                    >
                      <User size={16} />
                      Profile
                    </button>
                    {userRole === 'admin' && (
                      <Link
                        href="/admin/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2 text-gray-700 transition-colors"
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 rounded flex items-center gap-2 text-red-600 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
