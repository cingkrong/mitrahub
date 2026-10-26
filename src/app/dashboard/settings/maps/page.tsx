'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MapSettingsConfig } from '@/lib/types';
import {
  Settings,
  Globe,
  Layers,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Key,
} from 'lucide-react';

export default function MapsSettingsPage() {
  const [settings, setSettings] = useState<MapSettingsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings/maps');
        const json = await res.json();
        if (json.success) {
          setSettings(json.data);
        }
      } catch (err) {
        console.error('Failed to load map settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <DashboardLayout title="Pengaturan Maps & GIS" subtitle="Memuat konfigurasi...">
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#71379B] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Pengaturan Maps & GIS"
      subtitle="Konfigurasi OpenFreeMap, Style Peta, Geoapify Geocoding & Parameter Radius"
    >
      {saveSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Pengaturan peta berhasil diperbarui!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Map Provider Card */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#E7DEF0]">
            <Globe className="h-5 w-5 text-[#71379B]" />
            <div>
              <h3 className="font-bold text-[#24182E] text-base">Primary Map Provider</h3>
              <p className="text-xs text-[#6B5E78]">
                Layanan vector tiles peta bebas biaya untuk penggunaan komersial
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#24182E] mb-1">
                Provider Aktif
              </label>
              <select
                value={settings.mapProvider}
                onChange={(e) => setSettings({ ...settings, mapProvider: e.target.value })}
                className="w-full rounded-xl border border-[#E7DEF0] bg-white px-3 py-2 text-xs font-semibold text-[#24182E] outline-none"
              >
                <option value="openfreemap">OpenFreeMap (Vector Tiles Bebas Key)</option>
                <option value="osm-standard">OpenStreetMap Standard</option>
              </select>
              <p className="mt-1 text-[11px] text-[#6B5E78]">
                Legal untuk penggunaan komersial, tanpa Google API Key, tanpa batasan kartu kredit.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24182E] mb-1">
                Pilihan Map Style
              </label>
              <select
                value={settings.mapStyleUrl}
                onChange={(e) => setSettings({ ...settings, mapStyleUrl: e.target.value })}
                className="w-full rounded-xl border border-[#E7DEF0] bg-white px-3 py-2 text-xs font-semibold text-[#24182E] outline-none"
              >
                <option value="https://tiles.openfreemap.org/styles/liberty">Liberty (Default Rekomendasi)</option>
                <option value="https://tiles.openfreemap.org/styles/bright">Bright (Kontras Terang)</option>
                <option value="https://tiles.openfreemap.org/styles/positron">Positron (Minimalis Putih)</option>
                <option value="https://tiles.openfreemap.org/styles/dark">Dark (Mode Gelap)</option>
                <option value="https://tiles.openfreemap.org/styles/fiord">Fiord (Sleek Blue)</option>
              </select>
              <p className="mt-1 text-[11px] text-[#6B5E78]">
                Style vector tiles OpenFreeMap dapat diganti secara dinamis tanpa mengubah logika radius.
              </p>
            </div>
          </div>
        </div>

        {/* Operational Radius & Geographic Defaults */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#E7DEF0]">
            <MapPin className="h-5 w-5 text-[#71379B]" />
            <div>
              <h3 className="font-bold text-[#24182E] text-base">Parameter Operasional & Radius</h3>
              <p className="text-xs text-[#6B5E78]">
                Titik pusat default dan proteksi jarak wilayah kemitraan
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#24182E] mb-1">
                Default Radius (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="10.0"
                value={settings.defaultRadiusKm}
                onChange={(e) =>
                  setSettings({ ...settings, defaultRadiusKm: parseFloat(e.target.value) || 3.0 })
                }
                className="w-full rounded-xl border border-[#E7DEF0] px-3 py-2 text-xs font-bold text-[#71379B] outline-none"
              />
              <p className="mt-1 text-[10px] text-[#6B5E78]">Default standar HQ: 3.0 km</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24182E] mb-1">
                Default Latitude (HQ)
              </label>
              <input
                type="number"
                step="any"
                value={settings.defaultLat}
                onChange={(e) =>
                  setSettings({ ...settings, defaultLat: parseFloat(e.target.value) || -7.5755 })
                }
                className="w-full rounded-xl border border-[#E7DEF0] px-3 py-2 text-xs font-mono text-[#24182E] outline-none"
              />
              <p className="mt-1 text-[10px] text-[#6B5E78]">Surakarta: -7.5755</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24182E] mb-1">
                Default Longitude (HQ)
              </label>
              <input
                type="number"
                step="any"
                value={settings.defaultLng}
                onChange={(e) =>
                  setSettings({ ...settings, defaultLng: parseFloat(e.target.value) || 110.8243 })
                }
                className="w-full rounded-xl border border-[#E7DEF0] px-3 py-2 text-xs font-mono text-[#24182E] outline-none"
              />
              <p className="mt-1 text-[10px] text-[#6B5E78]">Surakarta: 110.8243</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24182E] mb-1">
                Default Zoom Peta
              </label>
              <input
                type="number"
                min="5"
                max="18"
                value={settings.defaultZoom}
                onChange={(e) =>
                  setSettings({ ...settings, defaultZoom: parseInt(e.target.value, 10) || 11 })
                }
                className="w-full rounded-xl border border-[#E7DEF0] px-3 py-2 text-xs text-[#24182E] outline-none"
              />
              <p className="mt-1 text-[10px] text-[#6B5E78]">Skala kota: 11 - 13</p>
            </div>
          </div>
        </div>

        {/* Geoapify Geocoding Status */}
        <div className="rounded-2xl border border-[#E7DEF0] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#E7DEF0]">
            <Key className="h-5 w-5 text-[#71379B]" />
            <div>
              <h3 className="font-bold text-[#24182E] text-base">Geoapify Free Geocoding API</h3>
              <p className="text-xs text-[#6B5E78]">
                Pencarian alamat otomatis & forward/reverse geocoding
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-[#FAF7FC] p-4 border border-[#E7DEF0]">
              <div>
                <span className="text-xs font-semibold text-[#6B5E78]">Status Konfigurasi API Key:</span>
                <div className="mt-0.5 flex items-center gap-1.5 font-bold text-xs">
                  {settings.isGeocodingKeyConfigured ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Terkonfigurasi di Backend (`GEOAPIFY_API_KEY`)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-700">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Mode Koordinat Manual Aktif (No-Key Fallback)
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#6B5E78]">Batas Kuota Konservatif:</span>
                <div className="font-mono font-bold text-xs text-[#71379B]">
                  {settings.geocodingCreditsUsed} / {settings.geocodingDailyBudget} kredit/hari
                </div>
              </div>
            </div>

            <p className="text-xs text-[#6B5E78] leading-relaxed">
              Kunci API disimpan secara aman di environment backend dan tidak pernah diekspos ke browser pengguna.
              Jika kunci belum diset, peta tetap 100% berfungsi menggunakan input koordinat manual, klik langsung pada peta, dan perhitungan PostGIS.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#71379B] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#5D2B82] active:scale-98 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Maps'}</span>
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
