'use client';

import { ReactNode } from 'react';
import TopNavigation from './TopNavigation';

interface LayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      <main className="pt-16">{children}</main>
    </div>
  );
}
