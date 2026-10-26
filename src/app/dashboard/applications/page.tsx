'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PartnerApplication } from '@/lib/types';
import { formatDistanceIndonesian, getGoogleMapsUrl } from '@/lib/geo-utils';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  User,
  Phone,
  Store,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default function ApplicationsManagementPage() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner-applications');
      const json = await res.json();
      if (json.success) {
        setApplications(json.data);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (id: string, isExemption = false) => {
    setProcessingId(id);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch(`/api/partner-applications/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: 'Admin HQ Surakarta',
          notes: isExemption ? 'EXEMPTION_GRANTED: Disetujui dengan dispensasi radius' : 'Persetujuan reguler',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyetujui pengajuan');
      }

      setActionSuccess('Pengajuan berhasil disetujui! Gerai baru telah ditambahkan ke Peta Kemitraan.');
      fetchApplications();
    } catch (err: any) {
      setActionError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout
      title="Validasi & Pengajuan Lokasi Mitra"
      subtitle="Manajemen Approval Zonasi Radius 2.5–3 km Kemitraan Es Teh Melatea"
    >
      {/* Action Notification */}
      {actionSuccess && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <Link href="/dashboard/maps" className="underline font-bold">
            Buka di Peta Kemitraan
          </Link>
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {actionError}
        </div>
      )}

      {/* Applications Pipeline Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-[#E7DEF0] bg-white p-12 text-center text-xs text-[#6B5E78]">
            Memuat pengajuan mitra...
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-[#E7DEF0] bg-white p-12 text-center text-xs text-[#6B5E78]">
            Belum ada antrean pengajuan lokasi baru.
          </div>
        ) : (
          applications.map((app) => (
            <div
              key={app.id}
              className="rounded-2xl border border-[#E7DEF0] bg-white p-5 shadow-xs hover:border-[#71379B]/40 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E7DEF0] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#71379B] uppercase">
                      {app.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        app.workflowStatus === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : app.workflowStatus === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      Status Alur: {app.workflowStatus}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        app.feasibilityStatus === 'LAYAK'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.feasibilityStatus === 'TIDAK_LAYAK'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {app.feasibilityStatus === 'LAYAK'
                        ? '● LAYAK'
                        : app.feasibilityStatus === 'TIDAK_LAYAK'
                        ? '✕ TIDAK LAYAK (KONFLIK)'
                        : '⚠️ PERLU REVIEW'}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-[#24182E]">
                    {app.proposedOutletName}
                  </h3>
                  <p className="text-xs text-[#6B5E78]">{app.proposedAddress}</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getGoogleMapsUrl(app.latitude, app.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl border border-[#E7DEF0] bg-white px-3 py-2 text-xs font-semibold text-[#6B5E78] hover:bg-[#F0E5F7] hover:text-[#71379B]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Google Maps</span>
                  </a>

                  {app.workflowStatus !== 'APPROVED' && (
                    <button
                      onClick={() =>
                        handleApprove(app.id, app.feasibilityStatus === 'TIDAK_LAYAK')
                      }
                      disabled={processingId === app.id}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors ${
                        app.feasibilityStatus === 'TIDAK_LAYAK'
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-[#71379B] hover:bg-[#5D2B82]'
                      } disabled:opacity-50`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        {processingId === app.id
                          ? 'Memproses...'
                          : app.feasibilityStatus === 'TIDAK_LAYAK'
                          ? 'Setujui dengan Dispensasi'
                          : 'Setujui & Terbitkan Gerai'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Detail Metrics Row */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-[#FAF7FC] p-3 border border-[#E7DEF0]">
                  <span className="text-[10px] text-[#6B5E78]">Pemohon / Calon Mitra</span>
                  <div className="font-bold text-[#24182E] mt-0.5">{app.applicantName}</div>
                  <div className="text-[11px] text-[#71379B]">{app.applicantPhone}</div>
                </div>

                <div className="rounded-xl bg-[#FAF7FC] p-3 border border-[#E7DEF0]">
                  <span className="text-[10px] text-[#6B5E78]">Koordinat Usulan</span>
                  <div className="font-mono font-bold text-[#24182E] mt-0.5">
                    {app.latitude.toFixed(5)}, {app.longitude.toFixed(5)}
                  </div>
                  <div className="text-[11px] text-[#6B5E78]">
                    Radius proteksi: {app.minimumRadiusKm} km
                  </div>
                </div>

                <div className="rounded-xl bg-[#FAF7FC] p-3 border border-[#E7DEF0]">
                  <span className="text-[10px] text-[#6B5E78]">Jarak Gerai Terdekat</span>
                  <div className="font-bold text-[#24182E] mt-0.5">
                    {formatDistanceIndonesian(app.nearestOutletDistanceMeters)}
                  </div>
                  <div className="text-[11px] text-[#6B5E78]">
                    Konflik terdeteksi: {app.conflictingOutletIds.length} gerai
                  </div>
                </div>

                <div className="rounded-xl bg-[#FAF7FC] p-3 border border-[#E7DEF0]">
                  <span className="text-[10px] text-[#6B5E78]">Diajukan Pada</span>
                  <div className="font-semibold text-[#24182E] mt-0.5">
                    {new Date(app.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-[11px] text-[#6B5E78]">
                    {app.reviewedBy ? `Oleh: ${app.reviewedBy}` : 'Menunggu review HQ'}
                  </div>
                </div>
              </div>

              {/* Reviewer Note */}
              {app.reviewerNotes && (
                <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-200 p-2.5 text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">Catatan Reviewer: </span>
                  {app.reviewerNotes}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
