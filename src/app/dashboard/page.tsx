'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DashboardOverviewData } from '@/lib/types';
import {
  Users,
  Store,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  FileText,
  DollarSign,
  PieChart as PieChartIcon,
  MapPin,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Mini Map lazy import
const PartnerMap = dynamic(() => import('@/components/maps/PartnerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-[#FAF7FC] rounded-2xl flex items-center justify-center text-xs text-[#71379B]">
      Memuat Peta Persebaran...
    </div>
  ),
});

export default function DashboardOverviewPage() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/overview');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load overview:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading || !data) {
    return (
      <DashboardLayout
        title="Overview Kemitraan Melatea"
        subtitle="Sistem Manajemen Kemitraan & Performa Repeat Order B2B"
      >
        <div className="flex h-96 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#71379B] border-t-transparent" />
            <span className="text-xs font-semibold text-[#71379B]">
              Memuat data performa mitra...
            </span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { kpis, monthlyTrends, regionalSpend, topPartners, statusDistribution, recentOrders, recentApplications, partnersNeedingAttention } = data;

  return (
    <DashboardLayout
      title="Melatea Partner Center"
      subtitle="Dashboard Monitoring Kemitraan B2B & Analisis Repeat Order"
    >
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Total Mitra */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Total Mitra</span>
            <div className="rounded-xl bg-[#F0E5F7] p-2 text-[#71379B]">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#24182E]">
              {kpis.totalPartners}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              +{kpis.newPartnersThisMonth} bln ini
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78]">
            {kpis.activePartners} aktif • {kpis.inactivePartners} nonaktif
          </p>
        </div>

        {/* Total Outlet / Gerai */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Gerai Operasional</span>
            <div className="rounded-xl bg-purple-100 p-2 text-purple-700">
              <Store className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#24182E]">
              {kpis.totalOutlets}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Solo Raya
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78]">
            Zonasi proteksi 2.5–3 km terverifikasi
          </p>
        </div>

        {/* Total Pembelian B2B Wholesale */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Total Pembelian Mitra</span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-[#24182E] sm:text-2xl">
              {formatRupiah(kpis.totalB2BSpend)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#6B5E78]">
            Transaksi bahan baku B2B ke HQ
          </p>
        </div>

        {/* Repeat Orders Count & Follow Up */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B5E78]">Repeat Order Rutin</span>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <RefreshCw className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#24182E]">
              {kpis.totalRepeatOrders}
            </span>
            <span className="text-xs font-medium text-[#6B5E78]">transaksi</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-700 font-medium">
            ⚠️ {kpis.partnersNeedingFollowup} mitra perlu follow-up
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Monthly Wholesale Purchase Trend Chart */}
        <div className="lg:col-span-8 rounded-2xl border border-[#E7DEF0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#24182E] text-base">
                Tren Pembelian B2B & Repeat Order
              </h3>
              <p className="text-xs text-[#6B5E78]">
                Historis pembelian bahan baku teh dan cup sablon 6 bulan terakhir
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-[#71379B]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#71379B]" /> Nilai B2B (Rp)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71379B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#71379B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0E5F7" />
                <XAxis dataKey="month" stroke="#6B5E78" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#6B5E78"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `Rp${val / 1000000}jt`}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(val), 'Pembelian B2B']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7DEF0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="b2bSpend"
                  stroke="#71379B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#purpleGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Distribution Chart */}
        <div className="lg:col-span-4 rounded-2xl border border-[#E7DEF0] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#24182E] text-base">
              Distribusi Status Mitra
            </h3>
            <p className="text-xs text-[#6B5E78]">Proporsi keaktifan seluruh mitra</p>
          </div>

          <div className="h-56 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Mitra`, name]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E7DEF0',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7DEF0]">
            {statusDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[#6B5E78] truncate">{item.name}:</span>
                <span className="font-bold text-[#24182E]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Regional Breakdown & Mini Map Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Regional Outlets & Wholesale Volume */}
        <div className="lg:col-span-6 rounded-2xl border border-[#E7DEF0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#24182E] text-base">
                Sebaran Pembelian Per Wilayah
              </h3>
              <p className="text-xs text-[#6B5E78]">Solo Raya & sekitarnya</p>
            </div>
            <Link
              href="/dashboard/maps"
              className="flex items-center gap-1 text-xs font-semibold text-[#71379B] hover:underline"
            >
              <span>Buka Peta</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {regionalSpend.map((reg) => (
              <div key={reg.region} className="rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#24182E]">{reg.region}</span>
                  <span className="font-mono font-bold text-[#71379B]">
                    {formatRupiah(reg.totalSpend)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#6B5E78]">
                  <span>{reg.outletCount} gerai aktif</span>
                  <span>Proteksi zonasi 3.0 km</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Map Quick View Widget */}
        <div className="lg:col-span-6 rounded-2xl border border-[#E7DEF0] bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-[#24182E] text-base">
                Pemetaan Gerai Aktif
              </h3>
              <p className="text-xs text-[#6B5E78]">
                OpenFreeMap Liberty • Realtime GIS
              </p>
            </div>
            <Link
              href="/dashboard/maps"
              className="flex items-center gap-1.5 rounded-lg bg-[#71379B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5D2B82] transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Full Interactive Map</span>
            </Link>
          </div>

          <div className="flex-1 min-h-[260px] rounded-xl overflow-hidden border border-[#E7DEF0]">
            <PartnerMap
              outlets={[
                {
                  id: 'OUT-001',
                  partnerId: 'PTR-001',
                  brandId: 'BRAND-MELATEA',
                  name: 'Melatea Outlet Manahan Solo',
                  address: 'Jl. Menteri Supeno No. 14, Manahan',
                  city: 'Surakarta',
                  district: 'Banjarsari',
                  latitude: -7.5532,
                  longitude: 110.8061,
                  operationalDate: '2024-01-15T00:00:00Z',
                  status: 'ACTIVE',
                },
                {
                  id: 'OUT-002',
                  partnerId: 'PTR-002',
                  brandId: 'BRAND-MELATEA',
                  name: 'Melatea Outlet UMS Pabelan',
                  address: 'Jl. Garuda Mas No. 8',
                  city: 'Sukoharjo',
                  district: 'Kartasura',
                  latitude: -7.5583,
                  longitude: 110.7712,
                  operationalDate: '2024-03-10T00:00:00Z',
                  status: 'ACTIVE',
                },
                {
                  id: 'OUT-004',
                  partnerId: 'PTR-004',
                  brandId: 'BRAND-MELATEA',
                  name: 'Melatea Outlet UNS Kentingan',
                  address: 'Jl. Ir. Sutami No. 36A',
                  city: 'Surakarta',
                  district: 'Jebres',
                  latitude: -7.5598,
                  longitude: 110.8542,
                  operationalDate: '2024-06-01T00:00:00Z',
                  status: 'ACTIVE',
                },
              ]}
              showRadiusCircle={false}
            />
          </div>
        </div>
      </div>

      {/* Bottom Tables: Top Partners & Recent Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 10 Partners by Spend & Repeat Order */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E7DEF0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#24182E] text-base">
                Top 10 Mitra Berdasarkan Pembelian
              </h3>
              <p className="text-xs text-[#6B5E78]">
                Evaluasi performa repeat order dan volume transaksi ke HQ
              </p>
            </div>
            <Link
              href="/dashboard/partners"
              className="text-xs font-semibold text-[#71379B] hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7FC] text-[#6B5E78] font-semibold border-b border-[#E7DEF0]">
                <tr>
                  <th className="py-2.5 px-3">Mitra</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Repeat Order</th>
                  <th className="py-2.5 px-3 text-right">Total Pembelian</th>
                  <th className="py-2.5 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DEF0]">
                {topPartners.map((partner) => (
                  <tr key={partner.partnerId} className="hover:bg-[#FAF7FC] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#24182E]">{partner.ownerName}</div>
                      <div className="text-[11px] text-[#6B5E78]">
                        {partner.outletCount} gerai terdaftar
                      </div>
                    </td>
                    <td className="py-3 px-3">
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
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#71379B]">
                      {partner.repeatOrderCount}x order
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#24182E]">
                      {formatRupiah(partner.totalSpend)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link
                        href={`/dashboard/partners/${partner.partnerId}`}
                        className="rounded-lg p-1 text-[#6B5E78] hover:text-[#71379B] hover:bg-[#F0E5F7] inline-block"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Partners Needing Attention & Recent Orders */}
        <div className="lg:col-span-5 space-y-6">
          {/* Attention Widget */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-sm">
              <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
              <span>Mitra Perlu Follow-Up Repeat Order</span>
            </div>
            <p className="text-xs text-amber-800 mb-3">
              Mitra dengan aktivitas pembelian menurun atau belum restock bahan baku
            </p>

            <div className="space-y-2">
              {partnersNeedingAttention.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-amber-200 bg-white p-3 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#24182E]">{item.partner.ownerName}</div>
                    <div className="text-[11px] text-amber-700">{item.reason}</div>
                  </div>
                  <Link
                    href={`/dashboard/partners/${item.partner.id}`}
                    className="rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-200"
                  >
                    Detail
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Widget */}
          <div className="rounded-2xl border border-[#E7DEF0] bg-white p-5 shadow-xs">
            <h3 className="font-bold text-[#24182E] text-sm mb-3">
              Transaksi Pembelian Terakhir (B2B)
            </h3>
            <div className="space-y-2.5">
              {recentOrders.slice(0, 4).map((po) => (
                <div
                  key={po.id}
                  className="rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] p-3 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-[#24182E]">{po.outletName || po.partnerName}</div>
                    <div className="text-[10px] text-[#6B5E78]">
                      {new Date(po.orderDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • {po.isRepeatOrder ? 'Repeat Order' : 'Order Awal'}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#71379B]">
                    {formatRupiah(po.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
