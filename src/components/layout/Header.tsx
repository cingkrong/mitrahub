'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, MapPin, Globe } from 'lucide-react';

interface HeaderProps {
  onOpenMobileNav: () => void;
  title: string;
  subtitle?: string;
}

export default function Header({ onOpenMobileNav, title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#E7DEF0] bg-[#FFFFFF]/90 px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileNav}
          className="rounded-lg p-2 text-[#29183B] hover:bg-[#F0E5F7] lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#24182E] lg:text-2xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[#6B5E78] sm:text-sm">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: Quick actions & Map Status */}
      <div className="flex items-center gap-3">
        {/* OpenFreeMap Commercial Free Tag */}
        <div className="hidden items-center gap-2 rounded-full border border-[#71379B]/20 bg-[#F0E5F7] px-3 py-1.5 text-xs font-medium text-[#71379B] sm:flex">
          <Globe className="h-3.5 w-3.5" />
          <span>OpenFreeMap • Liberty Style</span>
        </div>

        {/* Quick CTA to GIS Map Validation */}
        <Link
          href="/dashboard/maps?validate=true"
          className="flex items-center gap-2 rounded-xl bg-[#71379B] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#5D2B82] active:scale-95 sm:text-sm"
        >
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">Cek Radius Lokasi</span>
          <span className="sm:hidden">Cek Lokasi</span>
        </Link>

        {/* User profile avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#E7DEF0]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#29183B] text-xs font-bold text-[#E3B764]">
            HQ
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-[#24182E]">Kantor Pusat</p>
            <p className="text-[11px] text-[#6B5E78]">Admin Kemitraan</p>
          </div>
        </div>
      </div>
    </header>
  );
}
