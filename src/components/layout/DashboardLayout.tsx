'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { SessionUser } from '@/lib/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (active && json.success && json.data?.user) {
          const currentUser: SessionUser = json.data.user;
          setUser(currentUser);

          // Role guard: if logged in as MITRA and trying to access HQ-only pages, redirect to Mitra Portal
          const hqOnlyPaths = [
            '/dashboard/partners',
            '/dashboard/applications',
            '/dashboard/settings',
          ];
          const isHqOnly =
            pathname === '/dashboard' ||
            hqOnlyPaths.some((p) => pathname.startsWith(p));

          if (currentUser.role === 'MITRA' && isHqOnly) {
            router.replace('/dashboard/mitra');
          }
        }
      } catch {
        // Ignore network errors on session check
      }
    }
    loadSession();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-[#F8F5FA]">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onOpenMobileNav={() => setMobileNavOpen(true)}
          title={title}
          subtitle={subtitle}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
