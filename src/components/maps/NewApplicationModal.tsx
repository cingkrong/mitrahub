'use client';

import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TerritoryValidationResult } from '@/lib/types';
import { formatDistanceIndonesian } from '@/lib/geo-utils';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  radiusKm: number;
  validationResult: TerritoryValidationResult | null;
  onSuccess: () => void;
}

export default function NewApplicationModal({
  isOpen,
  onClose,
  lat,
  lng,
  radiusKm,
  validationResult,
  onSuccess,
}: NewApplicationModalProps) {
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [proposedOutletName, setProposedOutletName] = useState('');
  const [proposedAddress, setProposedAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!applicantName || !applicantPhone || !proposedOutletName) {
      setErrorMessage('Harap isi nama pemohon, WhatsApp, dan nama outlet');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/partner-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName,
          applicantPhone,
          proposedOutletName,
          proposedAddress: proposedAddress || 'Titik koordinat survei',
          latitude: lat,
          longitude: lng,
          minimumRadiusKm: radiusKm,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan pengajuan');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-[#E7DEF0] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E7DEF0] pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#24182E]">Formulir Pengajuan Lokasi Mitra</h3>
            <p className="text-xs text-[#6B5E78]">
              Registrasi titik kemitraan baru dengan validasi radius PostGIS
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#6B5E78] hover:bg-[#F0E5F7] hover:text-[#71379B]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Territory Status Callout */}
        <div className="my-4 rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#6B5E78]">Status Zonasi Radius:</span>
            {validationResult?.feasibility === 'LAYAK' ? (
              <span className="flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> LAYAK (Aman)
              </span>
            ) : validationResult?.feasibility === 'TIDAK_LAYAK' ? (
              <span className="flex items-center gap-1 font-bold text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" /> TIDAK LAYAK (Konflik)
              </span>
            ) : (
              <span className="font-semibold text-amber-600">PERLU REVIEW</span>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#6B5E78]">
            <span>Koordinat: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
            <span>Jarak Terdekat: {formatDistanceIndonesian(validationResult?.nearestDistanceMeters)}</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#24182E] mb-1">
              Nama Calon Mitra / Pemilik <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Rahmat Hidayat"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              className="w-full rounded-xl border border-[#E7DEF0] px-3.5 py-2 text-xs text-[#24182E] focus:border-[#71379B] focus:ring-1 focus:ring-[#71379B] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#24182E] mb-1">
              Nomor WhatsApp Pemohon <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="Contoh: 081234567890"
              value={applicantPhone}
              onChange={(e) => setApplicantPhone(e.target.value)}
              className="w-full rounded-xl border border-[#E7DEF0] px-3.5 py-2 text-xs text-[#24182E] focus:border-[#71379B] focus:ring-1 focus:ring-[#71379B] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#24182E] mb-1">
              Nama Usulan Outlet / Gerai <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Melatea Outlet Pasar Kliwon"
              value={proposedOutletName}
              onChange={(e) => setProposedOutletName(e.target.value)}
              className="w-full rounded-xl border border-[#E7DEF0] px-3.5 py-2 text-xs text-[#24182E] focus:border-[#71379B] focus:ring-1 focus:ring-[#71379B] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#24182E] mb-1">
              Alamat Lengkap / Keterangan Titik
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Jl. Kapten Mulyadi No. 45, dekat perempatan..."
              value={proposedAddress}
              onChange={(e) => setProposedAddress(e.target.value)}
              className="w-full rounded-xl border border-[#E7DEF0] px-3.5 py-2 text-xs text-[#24182E] focus:border-[#71379B] focus:ring-1 focus:ring-[#71379B] outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7DEF0]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E7DEF0] px-4 py-2 text-xs font-semibold text-[#6B5E78] hover:bg-[#F0E5F7]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-[#71379B] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5D2B82] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
