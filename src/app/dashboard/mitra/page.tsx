'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MitraDashboardData } from '@/lib/types';
import { getGoogleMapsUrl, formatDistanceIndonesian } from '@/lib/geo-utils';
import {
  ShoppingBag,
  RefreshCw,
  Clock,
  Award,
  DollarSign,
  MapPin,
  ExternalLink,
  AlertCircle,
  Plus,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  FileCheck,
  Calculator,
} from 'lucide-react';

const PartnerMap = dynamic(() => import('@/components/maps/PartnerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-[#FAF7FC] rounded-xl flex items-center justify-center text-xs text-[#71379B]">
      Memuat Peta Zonasi Gerai...
    </div>
  ),
});

export default function MitraPortalDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<MitraDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch('/api/mitra/dashboard');
        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        const json = await res.json();
        if (!res.ok || !json.success) {
          setError(json.error || 'Gagal memuat data portal mitra.');
          return;
        }
        setData(json.data);
      } catch {
        setError('Gagal terhubung ke server portal mitra.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  const formatRupiah = (val?: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Portal Kemitraan Melatea"
        subtitle="Memuat ringkasan performa dan gerai mitra..."
      >
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#71379B] border-t-transparent" />
            <span className="text-xs font-semibold text-[#71379B]">
              Memuat data portal mitra...
            </span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout
        title="Portal Kemitraan Melatea"
        subtitle="Akses khusus Mitra Gerai Es Teh Melatea"
      >
        <div className="rounded-xl border border-[#E7DEF0] bg-white p-8 text-center max-w-lg mx-auto my-12">
          <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-[#24182E]">
            Sesi Mitra Belum Aktif
          </h2>
          <p className="mt-1 text-xs text-[#6B5E78]">
            {error || 'Silakan masuk menggunakan akun Mitra untuk mengakses halaman ini.'}
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#71379B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5D2B82]"
          >
            <span>Masuk ke Portal Mitra</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { partner, outlets, purchases, applications } = data;
  const perf = partner.performance;
  const primaryOutlet = outlets[0];
  const needsRestock =
    partner.tier === 'PERLU_PERHATIAN' || (perf && perf.daysSinceLastOrder > 30);

  return (
    <DashboardLayout
      title={`Portal Mitra: ${partner.ownerName}`}
      subtitle={`ID Mitra: ${partner.id} • ${outlets.length} Gerai Operasional`}
    >
      {/* Restock Follow-Up Banner if Inactive > 30 Days */}
      {needsRestock && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-amber-900">
                Pengingat Restock Bahan Baku Gerai
              </h2>
              <p className="mt-0.5 text-xs text-amber-800">
                Gerai Anda tercatat belum melakukan repeat order selama{' '}
                <span className="font-mono font-bold">{perf?.daysSinceLastOrder || 0} hari</span>.
                Lakukan pemesanan bahan baku untuk menjaga ketersediaan stok dan status proteksi wilayah.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/mitra/orders"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-800 shrink-0"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Pesan Bahan Baku</span>
          </Link>
        </div>
      )}

      {/* Partner Identity & Primary Actions Header */}
      <div className="mb-6 rounded-xl border border-[#E7DEF0] bg-white p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#29183B] text-lg font-bold text-[#E3B764] shrink-0">
              {partner.ownerName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[#24182E]">{partner.ownerName}</h2>
                <span className="font-mono text-xs font-semibold text-[#71379B] bg-[#F0E5F7] px-2 py-0.5 rounded">
                  {partner.id}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    partner.tier === 'UNGGULAN'
                      ? 'bg-[#E3B764]/20 text-[#8F6516] border border-[#E3B764]/50'
                      : partner.tier === 'REGULER'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  TIER {partner.tier}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-[#6B5E78]">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-[#71379B]" /> {partner.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-[#6B5E78]" /> {partner.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#6B5E78]" /> Mitra sejak{' '}
                  {new Date(partner.joinedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/mitra/pos"
              className="flex items-center gap-1.5 rounded-lg border border-[#71379B]/30 bg-[#F0E5F7] px-3.5 py-2 text-xs font-semibold text-[#29183B] hover:bg-[#E7DEF0] transition-colors duration-150"
            >
              <Calculator className="h-4 w-4 text-[#71379B]" />
              <span>Buka Kasir POS & Pembukuan</span>
            </Link>
            <Link
              href="/dashboard/mitra/outlets"
              className="flex items-center gap-1.5 rounded-lg border border-[#E7DEF0] bg-[#FAF7FC] px-3.5 py-2 text-xs font-semibold text-[#24182E] hover:bg-[#F0E5F7] transition-colors duration-150"
            >
              <Plus className="h-4 w-4 text-[#71379B]" />
              <span>Ajukan Cabang Baru</span>
            </Link>
            <Link
              href="/dashboard/mitra/orders"
              className="flex items-center gap-1.5 rounded-lg bg-[#71379B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5D2B82] active:scale-[0.98] transition-all duration-150"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Repeat Order Bahan Baku</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-[#E7DEF0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Total Pembelian B2B</span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold font-mono tabular-nums text-[#24182E]">
            {formatRupiah(perf?.totalSpend)}
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78] tabular-nums">
            Rata-rata: {formatRupiah(perf?.averageOrderValue)} / PO
          </p>
        </div>

        <div className="rounded-xl border border-[#E7DEF0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Repeat Order</span>
            <div className="rounded-lg bg-[#F0E5F7] p-2 text-[#71379B]">
              <RefreshCw className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#71379B]">
            {perf?.repeatOrderCount || 0}
            <span className="text-xs font-sans font-normal text-[#6B5E78] ml-1">kali</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78] tabular-nums">
            Total {perf?.totalOrders || 0} pesanan selesai
          </p>
        </div>

        <div className="rounded-xl border border-[#E7DEF0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Order Terakhir</span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#24182E]">
            {perf?.daysSinceLastOrder ?? 0}
            <span className="text-xs font-sans font-normal text-[#6B5E78] ml-1">hari lalu</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78]">
            {perf?.lastOrderAt
              ? new Date(perf.lastOrderAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Belum ada transaksi'}
          </p>
        </div>

        <div className="rounded-xl border border-[#E7DEF0] bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Skor Kemitraan</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 font-mono tabular-nums">
            <span className="text-2xl font-bold text-emerald-700">
              {perf?.performanceScore || 0}
            </span>
            <span className="text-xs text-[#6B5E78]">/ 100</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78] tabular-nums">
            Siklus restock ~{perf?.orderIntervalDays || 0} hari
          </p>
        </div>
      </div>

      {/* Outlets & Protection Zone Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-6 rounded-xl border border-[#E7DEF0] bg-white p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[#24182E] text-base">
                  Gerai Operasional Anda ({outlets.length})
                </h3>
                <p className="text-xs text-[#6B5E78]">
                  Setiap gerai aktif dilindungi radius zonasi eksklusif 3.0 km
                </p>
              </div>
              <Link
                href="/dashboard/mitra/outlets"
                className="text-xs font-semibold text-[#71379B] hover:underline"
              >
                Kelola Gerai
              </Link>
            </div>

            <div className="space-y-3">
              {outlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-[#71379B]">
                        {outlet.id}
                      </span>
                      <h4 className="text-sm font-bold text-[#24182E]">{outlet.name}</h4>
                      <p className="text-xs text-[#6B5E78] mt-0.5">{outlet.address}</p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                        outlet.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : outlet.status === 'ATTENTION'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {outlet.status === 'ACTIVE'
                        ? 'Aktif'
                        : outlet.status === 'ATTENTION'
                        ? 'Perlu Restock'
                        : 'Nonaktif'}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E7DEF0] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-[11px] text-[#6B5E78] tabular-nums flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#71379B]" />
                      {outlet.latitude.toFixed(5)}, {outlet.longitude.toFixed(5)}
                    </span>
                    <a
                      href={getGoogleMapsUrl(outlet.latitude, outlet.longitude)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#71379B] hover:underline"
                    >
                      <span>Buka Google Maps</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {applications.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#E7DEF0]">
              <h4 className="text-xs font-bold text-[#24182E] mb-2 flex items-center gap-1.5">
                <FileCheck className="h-3.5 w-3.5 text-[#71379B]" />
                <span>Status Pengajuan Lokasi Cabang ({applications.length})</span>
              </h4>
              <div className="space-y-2">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-lg border border-[#E7DEF0] bg-white p-2.5 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-[#24182E]">
                        {app.proposedOutletName}
                      </div>
                      <div className="text-[11px] text-[#6B5E78]">
                        Jarak terdekat: {formatDistanceIndonesian(app.nearestOutletDistanceMeters)}
                      </div>
                    </div>
                    <span className="rounded bg-[#F0E5F7] px-2 py-0.5 text-[10px] font-bold text-[#71379B]">
                      {app.workflowStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Protection Map */}
        <div className="lg:col-span-6 rounded-xl border border-[#E7DEF0] bg-white p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-[#24182E] text-base">
                Peta Zona Proteksi Gerai (Radius 3.0 km)
              </h3>
              <p className="text-xs text-[#6B5E78]">
                Area lingkaran ungu menunjukkan wilayah eksklusif gerai Anda
              </p>
            </div>
            <Link
              href="/dashboard/maps"
              className="text-xs font-semibold text-[#71379B] hover:underline"
            >
              Peta Penuh
            </Link>
          </div>

          <div className="flex-1 min-h-[280px] rounded-xl overflow-hidden border border-[#E7DEF0]">
            {primaryOutlet ? (
              <PartnerMap
                outlets={outlets}
                selectedOutletId={primaryOutlet.id}
                defaultCenter={[primaryOutlet.longitude, primaryOutlet.latitude]}
                defaultZoom={13}
                showRadiusCircle={true}
                radiusKm={3.0}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#6B5E78]">
                Belum ada titik gerai aktif
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Purchase Orders Table */}
      <div className="rounded-xl border border-[#E7DEF0] bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#24182E] text-base">
              Riwayat Transaksi Bahan Baku B2B Anda
            </h3>
            <p className="text-xs text-[#6B5E78]">
              Daftar pesanan bahan baku dan kemasan ke gudang pusat Melatea
            </p>
          </div>
          <Link
            href="/dashboard/mitra/orders"
            className="text-xs font-semibold text-[#71379B] hover:underline"
          >
            Buat Pesanan Baru
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7FC] text-[#6B5E78] font-semibold border-b border-[#E7DEF0]">
              <tr>
                <th className="py-2.5 px-3">No. PO</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Gerai Tujuan</th>
                <th className="py-2.5 px-3">Rincian Item</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Total Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DEF0]">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B5E78]">
                    Belum ada riwayat pemesanan bahan baku.
                  </td>
                </tr>
              ) : (
                purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-[#FAF7FC]">
                    <td className="py-3 px-3 font-mono font-bold text-[#71379B]">{po.id}</td>
                    <td className="py-3 px-3 text-[#24182E] tabular-nums">
                      {new Date(po.orderDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#24182E]">
                      {po.outletName || primaryOutlet?.name || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {po.items.map((item) => (
                          <div key={item.id} className="text-[#24182E]">
                            <span className="font-mono font-semibold">{item.quantity}x</span>{' '}
                            {item.productName}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {po.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-[#24182E]">
                      {formatRupiah(po.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
