'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SessionUser } from '@/lib/types';
import { Menu, MapPin, ShoppingBag, Calculator, LogOut, UserCheck } from 'lucide-react';

interface HeaderProps {
  onOpenMobileNav: () => void;
  title: string;
  subtitle?: string;
  user?: SessionUser | null;
  onLogout?: () => void;
}

export default function Header({
  onOpenMobileNav,
  title,
  subtitle,
  user,
  onLogout,
}: HeaderProps) {
  const router = useRouter();
  const isMitra = user?.role === 'MITRA';

  const handleLogoutClick = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'HQ';

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#E7DEF0] bg-[#FFFFFF]/95 px-6 backdrop-blur-md">
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

      {/* Right: Role Action & User Profile */}
      <div className="flex items-center gap-3">
        {isMitra ? (
          <>
            <Link
              href="/dashboard/mitra/pos"
              className="flex items-center gap-1.5 rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] px-3 py-2 text-xs font-semibold text-[#29183B] hover:bg-[#F0E5F7] transition-colors duration-150"
            >
              <Calculator className="h-4 w-4 text-[#71379B]" />
              <span className="hidden sm:inline">Kasir POS & Kas</span>
              <span className="sm:hidden">POS</span>
            </Link>
            <Link
              href="/dashboard/mitra/orders"
              className="flex items-center gap-2 rounded-xl bg-[#71379B] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#5D2B82] active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Pesan Bahan Baku</span>
              <span className="sm:hidden">Order</span>
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] px-3 py-2 text-xs font-semibold text-[#71379B] hover:bg-[#F0E5F7] transition-colors duration-150"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Login Mitra</span>
            </Link>
            <Link
              href="/dashboard/maps?validate=true"
              className="flex items-center gap-2 rounded-xl bg-[#71379B] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:bg-[#5D2B82] active:scale-[0.98]"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Cek Radius Lokasi</span>
              <span className="sm:hidden">Cek Lokasi</span>
            </Link>
          </>
        )}

        {/* User profile & Logout */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#E7DEF0]">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#29183B] text-xs font-bold text-[#E3B764]">
            {initials}
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-[#24182E]">
                {user?.name || 'Kantor Pusat'}
              </p>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  isMitra
                    ? 'bg-[#E3B764]/25 text-[#8F6516]'
                    : 'bg-[#F0E5F7] text-[#71379B]'
                }`}
              >
                {isMitra ? `MITRA • ${user?.partnerId}` : 'ADMIN HQ'}
              </span>
            </div>
            <p className="text-[11px] text-[#6B5E78]">
              {isMitra ? user?.email : 'Admin Kemitraan Pusat'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogoutClick}
            title="Keluar / Ganti Akun"
            aria-label="Keluar atau ganti akun"
            className="ml-1 rounded-lg border border-[#E7DEF0] p-2 text-[#6B5E78] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
