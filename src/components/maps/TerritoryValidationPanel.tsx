'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { TerritoryValidationResult } from '@/lib/types';
import { formatDistanceIndonesian, getGoogleMapsUrl } from '@/lib/geo-utils';

interface TerritoryValidationPanelProps {
  currentLat: number;
  currentLng: number;
  radiusKm: number;
  onCoordinatesChange: (coords: { lat: number; lng: number }) => void;
  onRadiusChange: (radius: number) => void;
  validationResult: TerritoryValidationResult | null;
  isValidating: boolean;
  onRunValidation: () => void;
  onCreateApplication: () => void;
  onSelectConflictOutlet?: (outletId: string) => void;
  isPickingLocation?: boolean;
  onTogglePickLocation?: () => void;
  showCandidateLocation?: boolean;
  onClearCandidate?: () => void;
}

export default function TerritoryValidationPanel({
  currentLat,
  currentLng,
  radiusKm,
  onCoordinatesChange,
  onRadiusChange,
  validationResult,
  isValidating,
  onRunValidation,
  onCreateApplication,
  onSelectConflictOutlet,
  isPickingLocation = false,
  onTogglePickLocation,
  showCandidateLocation = false,
  onClearCandidate,
}: TerritoryValidationPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);

  // Debounced search autocomplete
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSearchSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/maps/autocomplete?text=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.fallbackMode) {
          setFallbackNotice(data.message);
          setSearchSuggestions([]);
        } else if (data.suggestions) {
          setSearchSuggestions(data.suggestions);
          setFallbackNotice(null);
        }
      } catch (err) {
        setFallbackNotice('Pencarian alamat otomatis offline. Gunakan input koordinat manual.');
      } finally {
        setSearchLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (s: any) => {
    onCoordinatesChange({ lat: s.lat, lng: s.lon });
    setSearchQuery(s.formatted);
    setSearchSuggestions([]);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'LAYAK':
        return (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>LAYAK (Memenuhi Zonasi)</span>
          </div>
        );
      case 'TIDAK_LAYAK':
        return (
          <div className="flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
            <XCircle className="h-4 w-4 text-rose-600" />
            <span>TIDAK LAYAK (Konflik Radius)</span>
          </div>
        );
      case 'PERLU_REVIEW':
        return (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>PERLU REVIEW HQ</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
            <span>Belum Divalidasi</span>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full flex-col bg-white rounded-2xl border border-[#E7DEF0] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#E7DEF0] bg-[#FAF7FC] p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#71379B]" />
          <h3 className="font-bold text-[#24182E] text-base">Validasi Radius Kemitraan</h3>
        </div>
        <p className="mt-0.5 text-xs text-[#6B5E78]">
          Proteksi zonasi jarak calon gerai terhadap outlet existing
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Address Search Field */}
        <div>
          <label className="block text-xs font-semibold text-[#24182E] mb-1">
            Cari Alamat / Titik Lokasi
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6B5E78]" />
            <input
              type="text"
              placeholder="Ketik alamat calon lokasi (min. 3 karakter)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E7DEF0] bg-white pl-9 pr-3 py-2 text-xs text-[#24182E] placeholder-[#6B5E78]/60 focus:border-[#71379B] focus:ring-1 focus:ring-[#71379B] outline-none"
            />
            {searchLoading && (
              <span className="absolute right-3 top-2.5 text-[11px] text-[#71379B] animate-pulse">
                Mencari...
              </span>
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {searchSuggestions.length > 0 && (
            <div className="mt-1.5 rounded-xl border border-[#E7DEF0] bg-white shadow-xl overflow-hidden z-30">
              {searchSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#F0E5F7] text-[#24182E] border-b border-gray-50 last:border-0 flex items-start gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#71379B] mt-0.5 shrink-0" />
                  <span className="truncate">{s.formatted}</span>
                </button>
              ))}
            </div>
          )}

          {/* Fallback Notice */}
          {fallbackNotice && (
            <p className="mt-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
              💡 {fallbackNotice}
            </p>
          )}
        </div>

        {/* Manual Coordinates Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#24182E]">Titik Koordinat Calon</span>
            <div className="flex items-center gap-1.5">
              {showCandidateLocation && onClearCandidate && (
                <button
                  type="button"
                  onClick={onClearCandidate}
                  className="text-[11px] font-medium text-rose-600 hover:text-rose-800 transition-colors"
                >
                  Sembunyikan
                </button>
              )}
              {onTogglePickLocation && (
                <button
                  type="button"
                  onClick={onTogglePickLocation}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                    isPickingLocation
                      ? 'bg-[#71379B] text-white border-[#71379B] shadow-xs animate-pulse'
                      : 'bg-[#F0E5F7] text-[#71379B] border-[#E7DEF0] hover:bg-[#E3D4EE]'
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  <span>{isPickingLocation ? 'Klik Peta (Aktif)' : 'Pilih di Peta'}</span>
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B5E78] mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={currentLat}
                onChange={(e) =>
                  onCoordinatesChange({ lat: parseFloat(e.target.value) || 0, lng: currentLng })
                }
                className="w-full rounded-xl border border-[#E7DEF0] bg-white px-3 py-2 text-xs font-mono text-[#24182E] focus:border-[#71379B] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B5E78] mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={currentLng}
                onChange={(e) =>
                  onCoordinatesChange({ lat: currentLat, lng: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-xl border border-[#E7DEF0] bg-white px-3 py-2 text-xs font-mono text-[#24182E] focus:border-[#71379B] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Radius Selector */}
        <div>
          <label className="block text-xs font-semibold text-[#24182E] mb-1.5">
            Radius Proteksi Zonasi
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[2.5, 3.0, 3.5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onRadiusChange(val)}
                className={`rounded-xl py-2 text-xs font-semibold transition-all border ${
                  radiusKm === val
                    ? 'border-[#71379B] bg-[#71379B] text-white shadow-sm'
                    : 'border-[#E7DEF0] bg-white text-[#24182E] hover:bg-[#F0E5F7]'
                }`}
              >
                {val} km
              </button>
            ))}
          </div>
        </div>

        {/* Validate CTA */}
        <button
          onClick={onRunValidation}
          disabled={isValidating}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#29183B] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#3D2557] active:scale-98 transition-all disabled:opacity-50"
        >
          {isValidating ? (
            <span>Menghitung Jarak Geodesic...</span>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 text-[#E3B764]" />
              <span>Jalankan Validasi Wilayah</span>
            </>
          )}
        </button>

        {/* Validation Results Display */}
        {validationResult && (
          <div className="mt-4 rounded-xl border border-[#E7DEF0] bg-[#FAF7FC] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B5E78]">Hasil Analisis:</span>
              {getStatusBadge(validationResult.feasibility)}
            </div>

            {/* Nearest Distance Metric */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-white p-2 border border-[#E7DEF0]">
                <div className="text-[10px] text-[#6B5E78]">Jarak Outlet Terdekat</div>
                <div className="text-sm font-bold text-[#24182E]">
                  {formatDistanceIndonesian(validationResult.nearestDistanceMeters)}
                </div>
              </div>
              <div className="rounded-lg bg-white p-2 border border-[#E7DEF0]">
                <div className="text-[10px] text-[#6B5E78]">Konflik Dalam Radius</div>
                <div className="text-sm font-bold text-rose-600">
                  {validationResult.conflictingOutlets.length} Gerai
                </div>
              </div>
            </div>

            {/* Official Recommendation */}
            <div className="rounded-lg bg-white p-2.5 border border-[#E7DEF0] text-xs leading-relaxed text-[#24182E]">
              <span className="font-semibold text-[#71379B]">Rekomendasi HQ: </span>
              {validationResult.recommendation}
            </div>

            {/* Conflicting Outlets Detail List */}
            {validationResult.conflictingOutlets.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide mb-1.5">
                  Gerai Berkonflik:
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {validationResult.conflictingOutlets.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => onSelectConflictOutlet && onSelectConflictOutlet(c.outlet.id)}
                      className="cursor-pointer rounded-lg border border-rose-200 bg-rose-50/60 p-2 text-xs hover:bg-rose-100/60 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-[#24182E]">{c.outlet.name}</div>
                        <div className="text-[10px] text-[#6B5E78]">
                          {c.outlet.address} • Jarak:{' '}
                          <span className="font-bold text-rose-700">
                            {formatDistanceIndonesian(c.distanceMeters)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-rose-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Links */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={onCreateApplication}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#71379B] py-2 text-xs font-bold text-white shadow-sm hover:bg-[#5D2B82] transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Ajukan Kemitraan Titik Ini</span>
              </button>

              <a
                href={getGoogleMapsUrl(currentLat, currentLng)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[#E7DEF0] bg-white py-2 text-xs font-semibold text-[#6B5E78] hover:text-[#71379B] hover:bg-[#F0E5F7] transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Buka Titik di Google Maps</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
