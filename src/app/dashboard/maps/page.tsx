'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TerritoryValidationPanel from '@/components/maps/TerritoryValidationPanel';
import NewApplicationModal from '@/components/maps/NewApplicationModal';
import { Outlet, TerritoryValidationResult } from '@/lib/types';
import { getGoogleMapsUrl } from '@/lib/geo-utils';
import {
  Search,
  Filter,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  PlusCircle,
  Eye,
  SlidersHorizontal,
  X,
} from 'lucide-react';

// Dynamic import of MapLibre component to avoid SSR issues
const PartnerMap = dynamic(() => import('@/components/maps/PartnerMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#F8F5FA] rounded-2xl border border-[#E7DEF0]">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#71379B] border-t-transparent" />
        <span className="text-xs font-semibold text-[#71379B]">
          Memuat Peta OpenFreeMap & OpenStreetMap...
        </span>
      </div>
    </div>
  ),
});

export default function PartnershipMapPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Candidate Location for Territory Validation
  const [candidateLat, setCandidateLat] = useState(-7.5755);
  const [candidateLng, setCandidateLng] = useState(110.8243);
  const [radiusKm, setRadiusKm] = useState(3.0);
  const [validationResult, setValidationResult] = useState<TerritoryValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [showCandidateLocation, setShowCandidateLocation] = useState(false);

  // UI state
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTabMobile, setActiveTabMobile] = useState<'map' | 'list' | 'validate'>('map');

  // Fetch Outlets
  const fetchOutlets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/outlets');
      const data = await res.json();
      if (data.success) {
        setOutlets(data.data);
      }
    } catch (err) {
      console.error('Failed to load outlets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  // Run Territory Validation
  const runValidation = useCallback(
    async (lat = candidateLat, lng = candidateLng, rad = radiusKm) => {
      try {
        setIsValidating(true);
        const res = await fetch('/api/territory/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            radiusKm: rad,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setValidationResult(data.data);
        }
      } catch (err) {
        console.error('Validation failed:', err);
      } finally {
        setIsValidating(false);
      }
    },
    [candidateLat, candidateLng, radiusKm]
  );

  // Initial validation on mount
  useEffect(() => {
    runValidation();
  }, [runValidation]);

  // Handle map click or candidate coordinate change
  const handleCandidateChange = (coords: { lat: number; lng: number }) => {
    setCandidateLat(coords.lat);
    setCandidateLng(coords.lng);
    setShowCandidateLocation(true);
    runValidation(coords.lat, coords.lng, radiusKm);
  };

  // Handle Radius Change
  const handleRadiusChange = (newRadius: number) => {
    setRadiusKm(newRadius);
    runValidation(candidateLat, candidateLng, newRadius);
  };

  // Clickable Coordinates: Focus map onto outlet
  const handleCoordinateClick = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setActiveTabMobile('map');
  };

  // Filtered outlets
  const filteredOutlets = outlets.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.partnerName && o.partnerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCity = selectedCity === 'ALL' || o.city.toLowerCase() === selectedCity.toLowerCase();
    const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;

    return matchesSearch && matchesCity && matchesStatus;
  });

  const cities = Array.from(new Set(outlets.map((o) => o.city)));

  return (
    <DashboardLayout
      title="Peta Kemitraan Melatea"
      subtitle="GIS Mapping & Validasi Radius Zonasi Es Teh Melatea (OpenFreeMap)"
    >
      {/* Mobile Tab Selector */}
      <div className="mb-3 flex rounded-xl border border-[#E7DEF0] bg-white p-1 lg:hidden">
        <button
          onClick={() => setActiveTabMobile('map')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
            activeTabMobile === 'map' ? 'bg-[#71379B] text-white shadow-xs' : 'text-[#6B5E78]'
          }`}
        >
          Peta GIS
        </button>
        <button
          onClick={() => setActiveTabMobile('list')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
            activeTabMobile === 'list' ? 'bg-[#71379B] text-white shadow-xs' : 'text-[#6B5E78]'
          }`}
        >
          Daftar Gerai ({filteredOutlets.length})
        </button>
        <button
          onClick={() => setActiveTabMobile('validate')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
            activeTabMobile === 'validate' ? 'bg-[#71379B] text-white shadow-xs' : 'text-[#6B5E78]'
          }`}
        >
          Cek Radius
        </button>
      </div>

      {/* Main Multi-Panel GIS Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-175px)] min-h-[580px]">
        {/* Left Panel: Outlets Directory & Filters */}
        <div
          className={`lg:col-span-3 flex flex-col rounded-2xl border border-[#E7DEF0] bg-white shadow-xs overflow-hidden ${
            activeTabMobile !== 'list' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Panel Header */}
          <div className="border-b border-[#E7DEF0] bg-[#FAF7FC] p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#24182E] text-sm">Gerai Es Teh Melatea</h3>
                <p className="text-[11px] text-[#6B5E78]">
                  Total {filteredOutlets.length} outlet terdaftar
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCity('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] font-semibold text-[#71379B] hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-2.5">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6B5E78]" />
              <input
                type="text"
                placeholder="Cari nama gerai, alamat, mitra..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#E7DEF0] bg-white pl-8 pr-3 py-1.5 text-xs text-[#24182E] placeholder-[#6B5E78]/60 focus:border-[#71379B] outline-none"
              />
            </div>

            {/* City & Status Filters */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="rounded-lg border border-[#E7DEF0] bg-white px-2 py-1 text-xs text-[#24182E] outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kota</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-lg border border-[#E7DEF0] bg-white px-2 py-1 text-xs text-[#24182E] outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="ATTENTION">Perlu Perhatian</option>
                <option value="INACTIVE">Tidak Aktif</option>
              </select>
            </div>
          </div>

          {/* Outlets Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E7DEF0]">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#6B5E78]">Memuat daftar outlet...</div>
            ) : filteredOutlets.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B5E78]">
                Tidak ada outlet yang cocok dengan filter.
              </div>
            ) : (
              filteredOutlets.map((outlet) => {
                const isSelected = selectedOutlet?.id === outlet.id;
                return (
                  <div
                    key={outlet.id}
                    className={`p-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#F0E5F7]/70 border-l-4 border-[#71379B]' : 'hover:bg-[#FAF7FC]'
                    }`}
                    onClick={() => handleCoordinateClick(outlet)}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <span className="text-[10px] font-bold text-[#71379B] uppercase tracking-wide">
                          {outlet.id}
                        </span>
                        <h4 className="text-xs font-bold text-[#24182E] leading-snug">
                          {outlet.name}
                        </h4>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ${
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

                    <p className="mt-1 text-[11px] text-[#6B5E78] line-clamp-1">{outlet.address}</p>

                    {/* Clickable Coordinates Section */}
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCoordinateClick(outlet);
                        }}
                        className="flex items-center gap-1 rounded-md bg-white border border-[#E7DEF0] px-1.5 py-0.5 text-[10px] font-mono text-[#71379B] hover:bg-[#F0E5F7] transition-colors"
                        title="Klik untuk memfokuskan peta ke titik koordinat ini"
                      >
                        <MapPin className="h-3 w-3 text-[#71379B]" />
                        <span>
                          {outlet.latitude.toFixed(4)}, {outlet.longitude.toFixed(4)}
                        </span>
                      </button>

                      {/* Google Maps Link */}
                      <a
                        href={getGoogleMapsUrl(outlet.latitude, outlet.longitude)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#6B5E78] hover:text-[#71379B]"
                        title="Buka titik di Google Maps (tanpa API key)"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>GMaps</span>
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Main Interactive Map */}
        <div
          className={`${
            rightPanelOpen ? 'lg:col-span-6' : 'lg:col-span-9'
          } relative flex flex-col rounded-2xl overflow-hidden border border-[#E7DEF0] bg-white shadow-xs ${
            activeTabMobile !== 'map' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Active Picking Notification Banner */}
          {isPickingLocation && (
            <div className="absolute top-4 left-4 right-4 lg:right-64 z-20 flex items-center justify-between rounded-xl border border-[#71379B]/30 bg-white/95 px-3 py-2 text-xs font-semibold text-[#24182E] shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#71379B] animate-ping" />
                <span>Klik di mana saja pada peta untuk menentukan posisi calon outlet</span>
              </div>
              <button
                onClick={() => setIsPickingLocation(false)}
                className="rounded-lg bg-[#71379B] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#5D2B82] transition-colors"
              >
                Selesai
              </button>
            </div>
          )}

          <PartnerMap
            outlets={filteredOutlets}
            selectedOutletId={selectedOutlet?.id}
            onSelectOutlet={(o) => setSelectedOutlet(o)}
            candidateLocation={
              showCandidateLocation
                ? {
                    lat: candidateLat,
                    lng: candidateLng,
                    radiusKm,
                  }
                : null
            }
            onCandidateLocationChange={handleCandidateChange}
            isPickingLocation={isPickingLocation}
            radiusKm={radiusKm}
            showRadiusCircle={true}
          />

          {/* Floating Action Toolbar */}
          <div className="hidden lg:flex absolute top-4 right-4 z-20 items-center gap-2">
            {!isPickingLocation ? (
              <button
                onClick={() => {
                  setIsPickingLocation(true);
                  setShowCandidateLocation(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-[#E7DEF0] bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#71379B] shadow-md hover:bg-[#F0E5F7] backdrop-blur-md transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Uji Titik Baru</span>
              </button>
            ) : null}

            {showCandidateLocation && (
              <button
                onClick={() => {
                  setShowCandidateLocation(false);
                  setIsPickingLocation(false);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-md hover:bg-rose-50 backdrop-blur-md transition-colors"
                title="Sembunyikan titik calon dari peta"
              >
                <X className="h-3.5 w-3.5" />
                <span>Hapus Titik</span>
              </button>
            )}

            {/* Toggle button for right validation panel */}
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-[#E7DEF0] bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#24182E] shadow-md hover:bg-[#F0E5F7] backdrop-blur-md transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#71379B]" />
              <span>{rightPanelOpen ? 'Sembunyikan Panel' : 'Panel Validasi'}</span>
            </button>
          </div>
        </div>

        {/* Right Panel: Territory & Radius Validation */}
        {rightPanelOpen && (
          <div
            className={`lg:col-span-3 flex flex-col ${
              activeTabMobile !== 'validate' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <TerritoryValidationPanel
              currentLat={candidateLat}
              currentLng={candidateLng}
              radiusKm={radiusKm}
              onCoordinatesChange={(c) => {
                setCandidateLat(c.lat);
                setCandidateLng(c.lng);
                setShowCandidateLocation(true);
                runValidation(c.lat, c.lng, radiusKm);
              }}
              onRadiusChange={handleRadiusChange}
              validationResult={validationResult}
              isValidating={isValidating}
              onRunValidation={() => {
                setShowCandidateLocation(true);
                runValidation();
              }}
              onCreateApplication={() => setIsModalOpen(true)}
              isPickingLocation={isPickingLocation}
              onTogglePickLocation={() => {
                const next = !isPickingLocation;
                setIsPickingLocation(next);
                if (next) {
                  setShowCandidateLocation(true);
                }
              }}
              showCandidateLocation={showCandidateLocation}
              onClearCandidate={() => {
                setShowCandidateLocation(false);
                setIsPickingLocation(false);
              }}
              onSelectConflictOutlet={(id) => {
                const conflict = outlets.find((o) => o.id === id);
                if (conflict) {
                  setSelectedOutlet(conflict);
                  setActiveTabMobile('map');
                }
              }}
            />
          </div>
        )}
      </div>

      {/* New Partner Application Modal */}
      <NewApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lat={candidateLat}
        lng={candidateLng}
        radiusKm={radiusKm}
        validationResult={validationResult}
        onSuccess={() => {
          fetchOutlets();
          runValidation();
        }}
      />
    </DashboardLayout>
  );
}
