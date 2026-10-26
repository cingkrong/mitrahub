'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Partner, PurchaseOrder } from '@/lib/types';
import { getGoogleMapsUrl } from '@/lib/geo-utils';
import {
  ArrowLeft,
  Store,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  RefreshCw,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Award,
  AlertTriangle,
  Package,
} from 'lucide-react';

// Mini Map lazy import
const PartnerMap = dynamic(() => import('@/components/maps/PartnerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-[#FAF7FC] rounded-2xl flex items-center justify-center text-xs text-[#71379B]">
      Memuat Mini Map...
    </div>
  ),
});

export default function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [partner, setPartner] = useState<(Partner & { purchases: PurchaseOrder[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPartnerDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/partners/${id}`);
        const json = await res.json();
        if (json.success) {
          setPartner(json.data);
        }
      } catch (err) {
        console.error('Failed to load partner detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPartnerDetail();
  }, [id]);

  const formatRupiah = (val?: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopyCoordinates = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !partner) {
    return (
      <DashboardLayout title="Detail Mitra Melatea" subtitle="Memuat profil mitra...">
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#71379B] border-t-transparent" />
            <span className="text-xs font-semibold text-[#71379B]">Memuat profil mitra...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const primaryOutlet = partner.outlets[0];
  const perf = partner.performance;

  return (
    <DashboardLayout
      title={`Detail Mitra: ${partner.ownerName}`}
      subtitle={`ID: ${partner.id} • ${partner.outlets.length} Gerai Terdaftar`}
    >
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/dashboard/partners"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#71379B] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Mitra</span>
        </Link>
      </div>

      {/* Top Profile Summary Header */}
      <div className="mb-6 rounded-2xl border border-[#E7DEF0] bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#29183B] text-xl font-bold text-[#E3B764] shadow-md">
              {partner.ownerName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#24182E]">{partner.ownerName}</h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    partner.tier === 'UNGGULAN'
                      ? 'bg-[#E3B764]/20 text-[#A17724] border border-[#E3B764]/40'
                      : partner.tier === 'REGULER'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {partner.tier}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    partner.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {partner.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-[#6B5E78]">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-[#71379B]" /> {partner.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-[#6B5E78]" /> {partner.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#6B5E78]" /> Bergabung:{' '}
                  {new Date(partner.joinedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/maps`}
              className="flex items-center gap-1.5 rounded-xl bg-[#F0E5F7] px-3.5 py-2 text-xs font-bold text-[#71379B] hover:bg-[#E7DEF0] transition-colors"
            >
              <MapPin className="h-4 w-4" />
              <span>Lihat di Peta Kemitraan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Lifetime Spend */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Lifetime B2B Spend</span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold font-mono text-[#24182E]">
            {formatRupiah(perf?.totalSpend)}
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78]">
            Rata-rata Order: {formatRupiah(perf?.averageOrderValue)}
          </p>
        </div>

        {/* Repeat Orders */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Repeat Order Rutin</span>
            <div className="rounded-xl bg-purple-100 p-2 text-[#71379B]">
              <RefreshCw className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#71379B]">
            {perf?.repeatOrderCount || 0}
            <span className="text-xs font-normal text-[#6B5E78] ml-1">transaksi</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78]">
            Total {perf?.totalOrders} transaksi terdaftar
          </p>
        </div>

        {/* Days Since Last Order */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Order Terakhir</span>
            <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#24182E]">
            {perf?.daysSinceLastOrder || 0}
            <span className="text-xs font-normal text-[#6B5E78] ml-1">hari yang lalu</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78]">
            {perf?.lastOrderAt
              ? new Date(perf.lastOrderAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Belum ada'}
          </p>
        </div>

        {/* Performance Score */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Skor Konsistensi (RFM)</span>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              {perf?.performanceScore || 0}
            </span>
            <span className="text-xs text-[#6B5E78]">/ 100</span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78]">
            Interval: ~{perf?.orderIntervalDays || 0} hari / transaksi
          </p>
        </div>
      </div>

      {/* Outlets & Mini Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Outlets list */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E7DEF0] bg-white p-5 shadow-xs">
          <h3 className="font-bold text-[#24182E] text-base mb-3">
            Gerai Es Teh Melatea Milik Mitra ({partner.outlets.length})
          </h3>

          <div className="space-y-4">
            {partner.outlets.map((outlet) => (
              <div
                key={outlet.id}
                className="rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#71379B] uppercase">
                      {outlet.id}
                    </span>
                    <h4 className="text-sm font-bold text-[#24182E]">{outlet.name}</h4>
                    <p className="text-xs text-[#6B5E78] mt-0.5">{outlet.address}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      outlet.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : outlet.status === 'ATTENTION'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {outlet.status === 'ACTIVE'
                      ? 'Aktif'
                      : outlet.status === 'ATTENTION'
                      ? 'Perhatian'
                      : 'Nonaktif'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E7DEF0] text-xs">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#6B5E78]">
                    <MapPin className="h-3.5 w-3.5 text-[#71379B]" />
                    <span>
                      {outlet.latitude.toFixed(5)}, {outlet.longitude.toFixed(5)}
                    </span>
                    <button
                      onClick={() => handleCopyCoordinates(outlet.latitude, outlet.longitude)}
                      className="text-[#71379B] hover:text-[#5D2B82] ml-1"
                      title="Salin Koordinat"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <a
                    href={getGoogleMapsUrl(outlet.latitude, outlet.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-white border border-[#E7DEF0] px-2.5 py-1 text-xs font-semibold text-[#71379B] hover:bg-[#F0E5F7] transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Buka Google Maps</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Map Preview */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E7DEF0] bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-[#24182E] text-base">Mini Map Lokasi Gerai</h3>
              <p className="text-xs text-[#6B5E78]">Visualisasi radius zonasi proteksi 3.0 km</p>
            </div>
          </div>

          <div className="flex-1 min-h-[260px] rounded-xl overflow-hidden border border-[#E7DEF0]">
            {primaryOutlet ? (
              <PartnerMap
                outlets={partner.outlets}
                selectedOutletId={primaryOutlet.id}
                defaultCenter={[primaryOutlet.longitude, primaryOutlet.latitude]}
                defaultZoom={13}
                showRadiusCircle={true}
                radiusKm={3.0}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-[#6B5E78]">
                Belum ada gerai aktif untuk ditampilkan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Purchase Orders Table */}
      <div className="rounded-2xl border border-[#E7DEF0] bg-white p-5 shadow-xs">
        <h3 className="font-bold text-[#24182E] text-base mb-1">
          Riwayat Pembelian Bahan Baku B2B
        </h3>
        <p className="text-xs text-[#6B5E78] mb-4">
          Daftar seluruh transaksi wholesale dari mitra ke kantor pusat (HQ)
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7FC] text-[#6B5E78] font-bold border-b border-[#E7DEF0]">
              <tr>
                <th className="py-2.5 px-3">No. Transaksi</th>
                <th className="py-2.5 px-3">Tanggal Order</th>
                <th className="py-2.5 px-3">Jenis Transaksi</th>
                <th className="py-2.5 px-3">Detail Item Pesanan</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Total Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DEF0]">
              {partner.purchases && partner.purchases.length > 0 ? (
                partner.purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-[#FAF7FC]">
                    <td className="py-3 px-3 font-mono font-bold text-[#71379B]">{po.id}</td>
                    <td className="py-3 px-3 text-[#24182E]">
                      {new Date(po.orderDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          po.isRepeatOrder
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {po.isRepeatOrder ? 'Repeat Order' : 'Order Awal Paket'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {po.items.map((item) => (
                          <div key={item.id} className="text-[#24182E]">
                            <span className="font-semibold">{item.quantity}x</span>{' '}
                            {item.productName}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {po.orderStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#24182E]">
                      {formatRupiah(po.totalAmount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B5E78]">
                    Belum ada riwayat transaksi pembelian untuk mitra ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
