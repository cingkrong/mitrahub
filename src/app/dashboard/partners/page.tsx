'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Partner } from '@/lib/types';
import { getGoogleMapsUrl } from '@/lib/geo-utils';
import {
  Users,
  Search,
  Filter,
  MapPin,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  Store,
  RefreshCw,
  Plus,
} from 'lucide-react';

export default function PartnersDirectoryPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  useEffect(() => {
    async function loadPartners() {
      try {
        setLoading(true);
        const res = await fetch('/api/partners');
        const json = await res.json();
        if (json.success) {
          setPartners(json.data);
        }
      } catch (err) {
        console.error('Failed to load partners:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPartners();
  }, []);

  const formatRupiah = (val?: number) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.outlets.some((o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.city.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesTier = tierFilter === 'ALL' || p.tier === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  return (
    <DashboardLayout
      title="Daftar Mitra & Gerai"
      subtitle="Manajemen Rekanan Kemitraan Es Teh Melatea Seluruh Wilayah"
    >
      {/* Control & Search Bar */}
      <div className="mb-6 rounded-2xl border border-[#E7DEF0] bg-white p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6B5E78]" />
          <input
            type="text"
            placeholder="Cari nama mitra, nomor WhatsApp, email, kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E7DEF0] bg-white pl-9 pr-3 py-2 text-xs text-[#24182E] placeholder-[#6B5E78]/60 focus:border-[#71379B] focus:ring-1 focus:ring-[#71379B] outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="rounded-xl border border-[#E7DEF0] bg-white px-3 py-2 text-xs font-semibold text-[#24182E] outline-none cursor-pointer"
          >
            <option value="ALL">Semua Tier</option>
            <option value="UNGGULAN">Unggulan</option>
            <option value="REGULER">Reguler</option>
            <option value="PERLU_PERHATIAN">Perlu Perhatian</option>
            <option value="TIDAK_AKTIF">Tidak Aktif</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#E7DEF0] bg-white px-3 py-2 text-xs font-semibold text-[#24182E] outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Nonaktif</option>
          </select>

          <Link
            href="/dashboard/maps?validate=true"
            className="flex items-center gap-1.5 rounded-xl bg-[#71379B] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#5D2B82] transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Gerai</span>
          </Link>
        </div>
      </div>

      {/* Partners List Table */}
      <div className="rounded-2xl border border-[#E7DEF0] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7FC] text-[#6B5E78] font-bold border-b border-[#E7DEF0]">
              <tr>
                <th className="py-3 px-4">ID & Pemilik</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Gerai Operasional</th>
                <th className="py-3 px-4">Tier & Status</th>
                <th className="py-3 px-4">Repeat Order</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DEF0]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B5E78]">
                    Memuat data mitra...
                  </td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6B5E78]">
                    Tidak ada mitra yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-[#FAF7FC] transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] font-bold text-[#71379B] uppercase">
                        {partner.id}
                      </span>
                      <div className="font-bold text-[#24182E] text-sm">{partner.ownerName}</div>
                      <div className="text-[11px] text-[#6B5E78]">
                        Bergabung:{' '}
                        {new Date(partner.joinedAt).toLocaleDateString('id-ID', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[#24182E] font-medium">
                        <Phone className="h-3 w-3 text-[#71379B]" />
                        <span>{partner.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6B5E78] mt-0.5">
                        <Mail className="h-3 w-3 text-[#6B5E78]" />
                        <span>{partner.email}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {partner.outlets.length > 0 ? (
                          partner.outlets.map((outlet) => (
                            <div key={outlet.id} className="flex items-center gap-2">
                              <span className="font-semibold text-[#24182E]">{outlet.name}</span>
                              <span className="rounded bg-gray-100 px-1.5 py-0.2 text-[10px] text-[#6B5E78]">
                                {outlet.city}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[#6B5E78] italic">Belum ada gerai aktif</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            partner.tier === 'UNGGULAN'
                              ? 'bg-[#E3B764]/20 text-[#A17724] border border-[#E3B764]/40'
                              : partner.tier === 'REGULER'
                              ? 'bg-blue-50 text-blue-700'
                              : partner.tier === 'PERLU_PERHATIAN'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {partner.tier}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            partner.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          ● {partner.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#71379B]">
                        {partner.performance?.repeatOrderCount || 0}x repeat order
                      </div>
                      <div className="text-[10px] text-[#6B5E78]">
                        {partner.performance?.daysSinceLastOrder || 0} hari sejak order terakhir
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-[#24182E] text-sm">
                        {formatRupiah(partner.performance?.totalSpend)}
                      </div>
                      <div className="text-[10px] text-[#6B5E78]">
                        Rata-rata: {formatRupiah(partner.performance?.averageOrderValue)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/partners/${partner.id}`}
                          className="rounded-lg bg-[#71379B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5D2B82] transition-colors"
                        >
                          Detail
                        </Link>
                      </div>
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
