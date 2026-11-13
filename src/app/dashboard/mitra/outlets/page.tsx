'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MitraDashboardData, Outlet, TerritoryValidationResult } from '@/lib/types';
import { getGoogleMapsUrl, formatDistanceIndonesian } from '@/lib/geo-utils';
import {
  Store,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  FileCheck,
} from 'lucide-react';

const PartnerMap = dynamic(() => import('@/components/maps/PartnerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full bg-[#FAF7FC] rounded-xl flex items-center justify-center text-xs text-[#71379B]">
      Memuat Peta GIS OpenFreeMap...
    </div>
  ),
});

export default function MitraOutletsAndExpansionPage() {
  const router = useRouter();
  const [data, setData] = useState<MitraDashboardData | null>(null);
  const [allOutlets, setAllOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  // Branch Expansion Candidate State
  const [proposedName, setProposedName] = useState('');
  const [proposedAddress, setProposedAddress] = useState('');
  const [candidateLat, setCandidateLat] = useState(-7.625);
  const [candidateLng, setCandidateLng] = useState(110.815);
  const [validationResult, setValidationResult] = useState<TerritoryValidationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const [mitraRes, outletsRes] = await Promise.all([
        fetch('/api/mitra/dashboard'),
        fetch('/api/outlets'),
      ]);

      if (mitraRes.status === 401) {
        router.replace('/login');
        return;
      }

      const mitraJson = await mitraRes.json();
      const outletsJson = await outletsRes.json();

      if (mitraJson.success) {
        setData(mitraJson.data);
      }
      if (outletsJson.success) {
        setAllOutlets(outletsJson.data);
      }
    } catch {
      setSubmitError('Gagal memuat data gerai.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const checkTerritory = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch('/api/territory/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radiusKm: 3.0,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setValidationResult(json.data);
      }
    } catch {
      // Ignore transient check errors
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [mitraRes, outletsRes, checkRes] = await Promise.all([
          fetch('/api/mitra/dashboard'),
          fetch('/api/outlets'),
          fetch('/api/territory/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: -7.625,
              longitude: 110.815,
              radiusKm: 3.0,
            }),
          }),
        ]);
        if (!active) return;

        if (mitraRes.status === 401) {
          router.replace('/login');
          return;
        }

        const [mitraJson, outletsJson, checkJson] = await Promise.all([
          mitraRes.json(),
          outletsRes.json(),
          checkRes.json(),
        ]);

        if (!active) return;
        if (mitraJson.success) setData(mitraJson.data);
        if (outletsJson.success) setAllOutlets(outletsJson.data);
        if (checkJson.success) setValidationResult(checkJson.data);
      } catch {
        if (active) setSubmitError('Gagal memuat data gerai.');
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [router]);

  const handleCandidatePick = (coords: { lat: number; lng: number }) => {
    setCandidateLat(coords.lat);
    setCandidateLng(coords.lng);
    checkTerritory(coords.lat, coords.lng);
  };

  const handleSubmitExpansion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedName.trim() || !proposedAddress.trim()) {
      setSubmitError('Nama gerai cabang dan alamat lengkap wajib diisi.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/partner-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: data?.partner.id,
          applicantName: data?.partner.ownerName,
          applicantPhone: data?.partner.phone,
          proposedOutletName: proposedName.trim(),
          proposedAddress: proposedAddress.trim(),
          latitude: candidateLat,
          longitude: candidateLng,
          minimumRadiusKm: 3.0,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setSubmitError(json.error || 'Gagal mengirim pengajuan cabang baru.');
        setSubmitting(false);
        return;
      }

      setSubmitMessage(
        `Pengajuan cabang "${json.data.proposedOutletName}" (${json.data.id}) berhasil dikirim ke tim verifikasi HQ!`
      );
      setProposedName('');
      setProposedAddress('');
      await refreshData();
    } catch {
      setSubmitError('Gagal mengirim pengajuan ke server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <DashboardLayout
        title="Gerai & Ekspansi Cabang"
        subtitle="Memuat data gerai dan peta zonasi..."
      >
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#71379B] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Gerai & Ekspansi Cabang Mitra"
      subtitle={`Manajemen Lokasi Gerai ${data.partner.ownerName} (${data.partner.id})`}
    >
      {/* Existing Outlets List */}
      <div className="mb-6 rounded-xl border border-[#E7DEF0] bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#24182E]">
              Daftar Gerai Aktif Milik Anda ({data.outlets.length})
            </h2>
            <p className="text-xs text-[#6B5E78]">
              Lokasi gerai yang telah beroperasi dan dilindungi radius kemitraan 3.0 km
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.outlets.map((outlet) => (
            <div
              key={outlet.id}
              className="rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#71379B]">
                    {outlet.id}
                  </span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Proteksi 3.0 km Aktif
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-bold text-[#24182E]">{outlet.name}</h3>
                <p className="text-xs text-[#6B5E78] mt-0.5">{outlet.address}</p>
              </div>

              <div className="pt-2.5 border-t border-[#E7DEF0] flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] tabular-nums text-[#6B5E78] flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#71379B]" />
                  {outlet.latitude.toFixed(5)}, {outlet.longitude.toFixed(5)}
                </span>
                <a
                  href={getGoogleMapsUrl(outlet.latitude, outlet.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#71379B] hover:underline"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Branch Expansion & Territory Check */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-7 rounded-xl border border-[#E7DEF0] bg-white p-5 flex flex-col">
          <div className="mb-3">
            <h2 className="text-base font-bold text-[#24182E]">
              Peta Simulasi Titik Cabang Baru (Klik pada Peta)
            </h2>
            <p className="text-xs text-[#6B5E78]">
              Klik lokasi rencana cabang baru pada peta untuk memvalidasi jarak terhadap seluruh gerai Melatea aktif.
            </p>
          </div>

          <div className="flex-1 min-h-[360px] rounded-xl overflow-hidden border border-[#E7DEF0]">
            <PartnerMap
              outlets={allOutlets}
              candidateLocation={{
                lat: candidateLat,
                lng: candidateLng,
                radiusKm: 3.0,
              }}
              onCandidateLocationChange={handleCandidatePick}
              isPickingLocation={true}
              radiusKm={3.0}
              showRadiusCircle={true}
            />
          </div>
        </div>

        {/* Expansion Form */}
        <div className="lg:col-span-5 rounded-xl border border-[#E7DEF0] bg-white p-5">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#E7DEF0]">
            <Store className="h-4.5 w-4.5 text-[#71379B]" />
            <h2 className="text-base font-bold text-[#24182E]">
              Formulir Pengajuan Cabang Baru
            </h2>
          </div>

          {submitMessage && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{submitMessage}</span>
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800"
            >
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Real-time Validation Result Box */}
          {validationResult && (
            <div
              className={`mb-4 rounded-xl border p-3.5 text-xs ${
                validationResult.feasibility === 'LAYAK'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : validationResult.feasibility === 'TIDAK_LAYAK'
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Status Zonasi: {validationResult.feasibility}
                </span>
                <span className="font-mono tabular-nums">
                  Terdekat: {formatDistanceIndonesian(validationResult.nearestDistanceMeters)}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed">
                {validationResult.recommendation}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmitExpansion} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="branch-lat"
                  className="block text-xs font-semibold text-[#24182E] mb-1"
                >
                  Latitude Usulan
                </label>
                <input
                  id="branch-lat"
                  type="number"
                  step="0.0001"
                  value={candidateLat}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (Number.isFinite(val)) {
                      setCandidateLat(val);
                      checkTerritory(val, candidateLng);
                    }
                  }}
                  className="w-full rounded-lg border border-[#E7DEF0] bg-[#FAF7FC] px-3 py-2 font-mono text-xs tabular-nums text-[#24182E]"
                />
              </div>
              <div>
                <label
                  htmlFor="branch-lng"
                  className="block text-xs font-semibold text-[#24182E] mb-1"
                >
                  Longitude Usulan
                </label>
                <input
                  id="branch-lng"
                  type="number"
                  step="0.0001"
                  value={candidateLng}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (Number.isFinite(val)) {
                      setCandidateLng(val);
                      checkTerritory(candidateLat, val);
                    }
                  }}
                  className="w-full rounded-lg border border-[#E7DEF0] bg-[#FAF7FC] px-3 py-2 font-mono text-xs tabular-nums text-[#24182E]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="branch-name"
                className="block text-xs font-semibold text-[#24182E] mb-1"
              >
                Nama Rencana Gerai Cabang
              </label>
              <input
                id="branch-name"
                type="text"
                required
                value={proposedName}
                onChange={(e) => setProposedName(e.target.value)}
                placeholder="Contoh: Melatea Outlet Sukoharjo Kota"
                className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-2 text-xs text-[#24182E] placeholder-[#6B5E78]/60 focus:border-[#71379B] outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="branch-address"
                className="block text-xs font-semibold text-[#24182E] mb-1"
              >
                Alamat Lengkap Lokasi Usulan
              </label>
              <textarea
                id="branch-address"
                rows={2}
                required
                value={proposedAddress}
                onChange={(e) => setProposedAddress(e.target.value)}
                placeholder="Jalan, Nomor Ruko/Kios, Kelurahan, Kecamatan..."
                className="w-full rounded-lg border border-[#E7DEF0] bg-white px-3 py-2 text-xs text-[#24182E] placeholder-[#6B5E78]/60 focus:border-[#71379B] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#71379B] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#5D2B82] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {submitting ? 'Mengirim Pengajuan...' : 'Ajukan Lokasi Cabang ke HQ'}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Submitted Applications History */}
      <div className="rounded-xl border border-[#E7DEF0] bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileCheck className="h-4.5 w-4.5 text-[#71379B]" />
          <h3 className="text-base font-bold text-[#24182E]">
            Riwayat Pengajuan Lokasi Anda ({data.applications.length})
          </h3>
        </div>

        {data.applications.length === 0 ? (
          <p className="text-xs text-[#6B5E78] py-4">
            Belum ada pengajuan cabang baru yang dikirimkan.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7FC] text-[#6B5E78] font-semibold border-b border-[#E7DEF0]">
                <tr>
                  <th className="py-2.5 px-3">ID Pengajuan</th>
                  <th className="py-2.5 px-3">Nama Calon Gerai</th>
                  <th className="py-2.5 px-3">Koordinat</th>
                  <th className="py-2.5 px-3">Kelayakan Radius</th>
                  <th className="py-2.5 px-3">Status Review HQ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DEF0]">
                {data.applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[#FAF7FC]">
                    <td className="py-3 px-3 font-mono font-bold text-[#71379B]">
                      {app.id}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#24182E]">{app.proposedOutletName}</div>
                      <div className="text-[11px] text-[#6B5E78]">{app.proposedAddress}</div>
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-[#6B5E78]">
                      {app.latitude.toFixed(4)}, {app.longitude.toFixed(4)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          app.feasibilityStatus === 'LAYAK'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : app.feasibilityStatus === 'TIDAK_LAYAK'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {app.feasibilityStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-[#F0E5F7] px-2 py-0.5 text-[10px] font-bold text-[#71379B]">
                        {app.workflowStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
