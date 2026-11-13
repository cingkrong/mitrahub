'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/lib/types';
import {
  Coffee,
  Store,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  MapPin,
  RefreshCw,
  KeyRound,
} from 'lucide-react';

interface DemoAccount {
  label: string;
  sublabel: string;
  identifier: string;
  password: string;
  role: UserRole;
  badge: string;
  badgeStyle: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Budi Santoso (PTR-001)',
    sublabel: 'Melatea Outlet Manahan Solo',
    identifier: 'budi.santoso@gmail.com',
    password: 'mitra123',
    role: 'MITRA',
    badge: 'UNGGULAN',
    badgeStyle: 'bg-[#E3B764]/20 text-[#8F6516] border border-[#E3B764]/50',
  },
  {
    label: 'Siti Rahmawati (PTR-002)',
    sublabel: 'Melatea Outlet UMS Pabelan',
    identifier: 'siti.rahma@gmail.com',
    password: 'mitra123',
    role: 'MITRA',
    badge: 'UNGGULAN',
    badgeStyle: 'bg-[#E3B764]/20 text-[#8F6516] border border-[#E3B764]/50',
  },
  {
    label: 'Rina Kusuma (PTR-006)',
    sublabel: 'Melatea Outlet Colomadu',
    identifier: 'rina.kusuma@gmail.com',
    password: 'mitra123',
    role: 'MITRA',
    badge: 'PERLU PERHATIAN',
    badgeStyle: 'bg-amber-50 text-amber-800 border border-amber-200',
  },
  {
    label: 'Admin Kemitraan HQ',
    sublabel: 'Kantor Pusat Surakarta (Solo Raya)',
    identifier: 'admin@melatea.id',
    password: 'admin123',
    role: 'ADMIN_HQ',
    badge: 'ADMIN HQ',
    badgeStyle: 'bg-[#F0E5F7] text-[#71379B] border border-[#71379B]/20',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>('MITRA');
  const [identifier, setIdentifier] = useState('budi.santoso@gmail.com');
  const [password, setPassword] = useState('mitra123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'ADMIN_HQ') {
      setIdentifier('admin@melatea.id');
      setPassword('admin123');
    } else {
      setIdentifier('budi.santoso@gmail.com');
      setPassword('mitra123');
    }
  };

  const handleSelectDemo = (account: DemoAccount) => {
    setSelectedRole(account.role);
    setIdentifier(account.identifier);
    setPassword(account.password);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password,
          role: selectedRole,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Gagal masuk ke sistem. Periksa kembali kredensial Anda.');
        setLoading(false);
        return;
      }

      const redirectUrl = json.data?.redirectTo || '/dashboard';
      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError('Gagal terhubung ke server autentikasi. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5FA] flex flex-col lg:flex-row">
      {/* Left Brand & Role Context Panel */}
      <div className="lg:w-5/12 bg-[#29183B] text-white p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#71379B] border border-[#E3B764]/40">
              <Coffee className="h-5 w-5 text-[#E3B764]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-lg">Melatea</span>
                <span className="rounded bg-[#E3B764]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#E3B764]">
                  PARTNER CENTER
                </span>
              </div>
              <p className="text-xs text-white/65">PT Melatea Nusantara Indonesia</p>
            </div>
          </Link>

          <div className="mt-10 lg:mt-14">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug">
              Portal Kemitraan & Manajemen Zonasi Gerai Es Teh Melatea
            </h1>
            <p className="mt-3 text-sm text-white/75 leading-relaxed max-w-prose">
              Akses terpadu bagi Mitra Gerai untuk pemesanan repeat order bahan baku B2B, pemantauan radius proteksi 3.0 km, serta pengajuan ekspansi cabang baru.
            </p>
          </div>

          {/* Core Capabilities List */}
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/5 p-4">
              <RefreshCw className="h-5 w-5 text-[#E3B764] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Repeat Order Bahan Baku B2B
                </h2>
                <p className="mt-0.5 text-xs text-white/65 leading-relaxed">
                  Pesan langsung daun teh Signature Blend, cup sablon resmi, dan sirup varian ke gudang pusat Surakarta.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/5 p-4">
              <MapPin className="h-5 w-5 text-[#E3B764] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Proteksi Wilayah & Ekspansi Gerai
                </h2>
                <p className="mt-0.5 text-xs text-white/65 leading-relaxed">
                  Pantau zona eksklusif gerai Anda dan cek kelayakan titik koordinat untuk pembukaan cabang baru.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
          <span>HQ Surakarta (Solo Raya)</span>
          <span>OpenFreeMap GIS • v1.1</span>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md space-y-6">
          {/* Role Switcher Tabs */}
          <div
            role="tablist"
            aria-label="Pilih Peran Login"
            className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#E7DEF0] bg-white p-1.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'MITRA'}
              onClick={() => handleSelectRole('MITRA')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-semibold transition-colors duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#71379B] ${
                selectedRole === 'MITRA'
                  ? 'bg-[#71379B] text-white shadow-xs'
                  : 'text-[#6B5E78] hover:bg-[#F8F5FA] hover:text-[#24182E]'
              }`}
            >
              <Store className="h-4 w-4" />
              <span>Login Mitra Gerai</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={selectedRole === 'ADMIN_HQ'}
              onClick={() => handleSelectRole('ADMIN_HQ')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs font-semibold transition-colors duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#71379B] ${
                selectedRole === 'ADMIN_HQ'
                  ? 'bg-[#29183B] text-white shadow-xs'
                  : 'text-[#6B5E78] hover:bg-[#F8F5FA] hover:text-[#24182E]'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Login Admin HQ</span>
            </button>
          </div>

          {/* Login Card */}
          <div className="rounded-xl border border-[#E7DEF0] bg-white p-6 shadow-xs">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[#24182E]">
                {selectedRole === 'MITRA'
                  ? 'Masuk ke Portal Mitra Melatea'
                  : 'Masuk ke Panel Admin Kantor Pusat'}
              </h2>
              <p className="mt-1 text-xs text-[#6B5E78]">
                {selectedRole === 'MITRA'
                  ? 'Gunakan Email, Nomor WhatsApp terdaftar, atau Kode ID Mitra (contoh: PTR-001).'
                  : 'Khusus tim manajemen kemitraan & verifikasi teritori HQ Surakarta.'}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800"
              >
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-xs font-semibold text-[#24182E] mb-1.5"
                >
                  {selectedRole === 'MITRA'
                    ? 'Email / No. WhatsApp / ID Mitra'
                    : 'Email atau ID Admin HQ'}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-[#6B5E78]" />
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      selectedRole === 'MITRA'
                        ? 'budi.santoso@gmail.com atau PTR-001'
                        : 'admin@melatea.id'
                    }
                    className="w-full rounded-lg border border-[#E7DEF0] bg-white pl-9 pr-3 py-2 text-xs text-[#24182E] placeholder-[#6B5E78]/60 focus:border-[#71379B] focus-visible:outline-2 focus-visible:outline-[#71379B]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[#24182E] mb-1.5"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#6B5E78]" />
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full rounded-lg border border-[#E7DEF0] bg-white pl-9 pr-3 py-2 text-xs text-[#24182E] placeholder-[#6B5E78]/60 focus:border-[#71379B] focus-visible:outline-2 focus-visible:outline-[#71379B]"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#6B5E78]">
                  {selectedRole === 'MITRA'
                    ? 'Default kata sandi mitra: mitra123 atau 6 digit terakhir nomor WhatsApp.'
                    : 'Default kata sandi Admin HQ: admin123'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#71379B] px-4 py-2.5 text-xs font-semibold text-white transition-all duration-150 ease-out hover:bg-[#5D2B82] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#71379B] disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {loading
                    ? 'Memverifikasi Kredensial...'
                    : selectedRole === 'MITRA'
                    ? 'Masuk sebagai Mitra'
                    : 'Masuk sebagai Admin HQ'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Quick Demo Credential Selector for Local Evaluation */}
          <div className="rounded-xl border border-[#E7DEF0] bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="h-3.5 w-3.5 text-[#71379B]" />
              <span className="text-xs font-semibold text-[#24182E]">
                Pilih Cepat Akun Demo (Klik untuk Isi Otomatis)
              </span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected =
                  identifier === acc.identifier && selectedRole === acc.role;
                return (
                  <button
                    key={acc.identifier}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className={`w-full text-left rounded-lg border p-2.5 transition-colors duration-150 flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-[#71379B] bg-[#F0E5F7]/40'
                        : 'border-[#E7DEF0] bg-[#FAF7FC] hover:border-[#71379B]/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#24182E] truncate">
                          {acc.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#71379B] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B5E78] truncate">
                        {acc.sublabel} • <span className="font-mono">{acc.identifier}</span>
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold shrink-0 ${acc.badgeStyle}`}
                    >
                      {acc.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

