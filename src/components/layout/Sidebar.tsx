'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MapPin,
  Users,
  FileCheck,
  Settings,
  Sparkles,
  Coffee,
  X,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Overview Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Peta Kemitraan',
      href: '/dashboard/maps',
      icon: MapPin,
      badge: 'OpenFreeMap',
    },
    {
      label: 'Daftar Mitra & Gerai',
      href: '/dashboard/partners',
      icon: Users,
      badge: null,
    },
    {
      label: 'Validasi & Pengajuan',
      href: '/dashboard/applications',
      icon: FileCheck,
      badge: 'Radius 3km',
    },
    {
      label: 'Pengaturan Maps & GIS',
      href: '/dashboard/settings/maps',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#29183B] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#71379B] to-[#E3B764] shadow-md shadow-[#71379B]/40">
              <Coffee className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-lg">Melatea</span>
                <span className="rounded bg-[#E3B764]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#E3B764]">
                  PARTNER
                </span>
              </div>
              <p className="text-[11px] text-white/60">Franchise & Territory Center</p>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Tutup navigasi"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Operational Scope Banner */}
        <div className="mx-4 mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-white/90">HQ Surakarta (Solo Raya)</span>
          </div>
          <p className="mt-1 text-[11px] text-white/60">
            Zonasi proteksi radius 2.5 – 3.0 km aktif
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
          <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-white/40 uppercase">
            Menu Utama
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#F0E5F7] text-[#29183B] shadow-md shadow-black/10'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${
                      isActive ? 'text-[#71379B]' : 'text-white/60 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-[#71379B] text-white'
                        : 'bg-white/10 text-white/70 group-hover:bg-white/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Brand Identity & Instagram link */}
        <div className="border-t border-white/10 p-4">
          <a
            href="https://www.instagram.com/estehmelatea/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl border border-[#71379B]/50 bg-[#71379B]/20 p-3 text-xs text-white/80 transition-colors hover:bg-[#71379B]/30 hover:text-white"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#E3B764]" />
              <span>@estehmelatea Official</span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-white/50" />
          </a>
          <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
            <span>v1.0.0 • OpenFreeMap GIS</span>
            <span>B2B Center</span>
          </div>
        </div>
      </aside>
    </>
  );
}
