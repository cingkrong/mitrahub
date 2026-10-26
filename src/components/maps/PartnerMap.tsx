'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Outlet } from '@/lib/types';
import { generateGeodesicCircle, getGoogleMapsUrl } from '@/lib/geo-utils';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';

// Configure MapLibre Web Worker URL for Next.js / Turbopack
if (typeof window !== 'undefined' && maplibregl.setWorkerUrl) {
  maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
}

export interface CandidateLocation {
  lat: number;
  lng: number;
  name?: string;
  radiusKm?: number;
}

interface PartnerMapProps {
  outlets: Outlet[];
  selectedOutletId?: string | null;
  onSelectOutlet?: (outlet: Outlet | null) => void;
  candidateLocation?: CandidateLocation | null;
  onCandidateLocationChange?: (location: { lat: number; lng: number }) => void;
  isPickingLocation?: boolean;
  styleUrl?: string;
  defaultCenter?: [number, number]; // [lng, lat]
  defaultZoom?: number;
  showRadiusCircle?: boolean;
  radiusKm?: number;
  className?: string;
}

export default function PartnerMap({
  outlets,
  selectedOutletId,
  onSelectOutlet,
  candidateLocation,
  onCandidateLocationChange,
  isPickingLocation = false,
  styleUrl = 'https://tiles.openfreemap.org/styles/liberty',
  defaultCenter = [110.8243, -7.5755], // Surakarta / Solo
  defaultZoom = 12,
  showRadiusCircle = true,
  radiusKm = 3.0,
  className = 'h-full w-full',
}: PartnerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const candidateMarkerRef = useRef<maplibregl.Marker | null>(null);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);

  const isPickingLocationRef = useRef(isPickingLocation);
  isPickingLocationRef.current = isPickingLocation;

  const onCandidateLocationChangeRef = useRef(onCandidateLocationChange);
  onCandidateLocationChangeRef.current = onCandidateLocationChange;

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentStyle, setCurrentStyle] = useState(styleUrl);

  // Status Color Helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#71379B'; // Melatea Purple
      case 'ATTENTION':
        return '#D97706'; // Amber
      case 'INACTIVE':
        return '#DC2626'; // Red
      default:
        return '#2563EB'; // Blue
    }
  };

  // Helper to create custom HTML Marker Element
  const createMarkerElement = useCallback(
    (outlet: Outlet, isSelected: boolean) => {
      const el = document.createElement('div');
      // Root element is completely neutral for MapLibre transform positioning
      el.className = 'cursor-pointer';
      el.setAttribute('data-outlet-id', outlet.id);

      const color = getStatusColor(outlet.status);
      const strokeColor = isSelected ? '#E3B764' : '#FFFFFF';
      const statusColor =
        outlet.status === 'ACTIVE'
          ? '#16A34A'
          : outlet.status === 'ATTENTION'
          ? '#D97706'
          : '#DC2626';

      const width = isSelected ? 34 : 28;
      const height = isSelected ? 44 : 38;

      el.innerHTML = `
        <div class="marker-pin-inner ${isSelected ? 'selected-marker-pulse' : ''}" style="width: ${width}px; height: ${height}px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); position: relative;">
          <svg width="${width}" height="${height}" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; width: 100%; height: 100%;">
            <!-- Pin Body -->
            <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.268 21.732 0 14 0z" fill="${color}" stroke="${strokeColor}" stroke-width="${isSelected ? '2.5' : '1.5'}"/>
            <!-- Center Core -->
            <circle cx="14" cy="14" r="5.5" fill="#FFFFFF"/>
            <circle cx="14" cy="14" r="3" fill="${color}"/>
            <!-- Embedded Status Dot (Part of the SVG - can NEVER detach) -->
            <circle cx="21" cy="7" r="4.5" fill="${statusColor}" stroke="#FFFFFF" stroke-width="1.5"/>
          </svg>
        </div>
      `;

      return el;
    },
    []
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: currentStyle,
        center: defaultCenter,
        zoom: defaultZoom,
        attributionControl: false,
      });

      // Add navigation controls
      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add Attribution (OpenFreeMap & OpenStreetMap)
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution:
            '© <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
        }),
        'bottom-right'
      );

      map.on('load', () => {
        setMapLoaded(true);
        setMapError(null);

        // Add GeoJSON source for radius circles
        if (!map.getSource('radius-circle-source')) {
          map.addSource('radius-circle-source', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
          });

          // Add Fill layer for radius
          map.addLayer({
            id: 'radius-circle-fill',
            type: 'fill',
            source: 'radius-circle-source',
            paint: {
              'fill-color': '#71379B',
              'fill-opacity': 0.15,
            },
          });

          // Add Stroke line layer for radius
          map.addLayer({
            id: 'radius-circle-stroke',
            type: 'line',
            source: 'radius-circle-source',
            paint: {
              'line-color': '#71379B',
              'line-width': 2,
              'line-dasharray': [3, 2],
            },
          });
        }
      });

      map.on('error', (e) => {
        // Fallback handler if style failed to load
        console.warn('MapLibre style notice:', e);
      });

      // Map click handler - only updates candidate location if in location picking mode
      map.on('click', (e) => {
        if (isPickingLocationRef.current && onCandidateLocationChangeRef.current) {
          const { lng, lat } = e.lngLat;
          onCandidateLocationChangeRef.current({ lat, lng });
        }
      });

      mapRef.current = map;
    } catch (err: any) {
      setMapError('Gagal memuat peta OpenFreeMap. Periksa koneksi internet.');
    }

    return () => {
      // Cleanup on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentStyle, defaultCenter, defaultZoom]);

  // Update canvas cursor dynamically based on picking mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const canvas = map.getCanvas();
      if (canvas) {
        canvas.style.cursor = isPickingLocation ? 'crosshair' : '';
      }
    } catch {
      // Ignore if map canvas is not yet ready
    }
  }, [isPickingLocation]);

  // Update Markers when Outlets or Selection Changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    outlets.forEach((outlet) => {
      const isSelected = outlet.id === selectedOutletId;
      const el = createMarkerElement(outlet, isSelected);

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom', // Anchor precisely to the needle/tip of the pin
      })
        .setLngLat([outlet.longitude, outlet.latitude])
        .addTo(map);

      // Stop bubbling so clicking marker does NOT trigger map.on('click')
      el.addEventListener('mousedown', (e) => e.stopPropagation());
      el.addEventListener('touchstart', (e) => e.stopPropagation());

      // Click on marker
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onSelectOutlet) {
          onSelectOutlet(outlet);
        }

        // Smooth camera flyTo
        map.flyTo({
          center: [outlet.longitude, outlet.latitude],
          zoom: Math.max(map.getZoom(), 14),
          duration: 1200,
        });

        // Open Popup
        openOutletPopup(outlet);
      });

      markersRef.current[outlet.id] = marker;
    });

    // Auto-open popup if an outlet is selected externally
    if (selectedOutletId) {
      const selected = outlets.find((o) => o.id === selectedOutletId);
      if (selected) {
        openOutletPopup(selected);
      }
    }
  }, [outlets, selectedOutletId, mapLoaded, createMarkerElement, onSelectOutlet]);

  // Open Popup for an Outlet
  const openOutletPopup = (outlet: Outlet) => {
    const map = mapRef.current;
    if (!map) return;

    if (activePopupRef.current) {
      activePopupRef.current.remove();
    }

    const gmapsUrl = getGoogleMapsUrl(outlet.latitude, outlet.longitude);

    const statusBadge =
      outlet.status === 'ACTIVE'
        ? '<span style="background: #DCFCE7; color: #16A34A; border: 1px solid #86EFAC; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 9999px; white-space: nowrap; display: inline-block;">Aktif</span>'
        : outlet.status === 'ATTENTION'
        ? '<span style="background: #FEF3C7; color: #D97706; border: 1px solid #FCD34D; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 9999px; white-space: nowrap; display: inline-block;">Perlu Perhatian</span>'
        : '<span style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 9999px; white-space: nowrap; display: inline-block;">Tidak Aktif</span>';

    const lastOrderText = outlet.lastOrderDate
      ? new Date(outlet.lastOrderDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Belum ada data';

    const contentHtml = `
      <div style="font-family: inherit; width: 310px; max-width: 330px; box-sizing: border-box; padding: 16px; padding-top: 14px; background: #FFFFFF;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding-right: 28px;">
          <div style="flex: 1; min-width: 0;">
            <span style="font-size: 10px; font-weight: 700; color: #71379B; text-transform: uppercase; letter-spacing: 0.5px;">${outlet.id}</span>
            <h4 style="margin: 2px 0 0; font-size: 14px; font-weight: 700; color: #24182E; line-height: 1.35; word-break: break-word;">${outlet.name}</h4>
          </div>
          <div style="flex-shrink: 0; margin-top: 2px;">${statusBadge}</div>
        </div>

        <p style="margin: 6px 0 0; font-size: 12px; color: #6B5E78; line-height: 1.4;">
          ${outlet.address}
        </p>

        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #E7DEF0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
          <div>
            <div style="color: #6B5E78;">Pemilik / Mitra:</div>
            <div style="font-weight: 600; color: #24182E;">${outlet.partnerName || '-'}</div>
          </div>
          <div>
            <div style="color: #6B5E78;">Repeat Order:</div>
            <div style="font-weight: 600; color: #71379B;">${outlet.repeatOrderCount || 0}x transaksi</div>
          </div>
          <div style="grid-column: span 2;">
            <div style="color: #6B5E78;">Order Terakhir:</div>
            <div style="font-weight: 500; color: #24182E;">${lastOrderText}</div>
          </div>
        </div>

        <div style="margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <a href="/dashboard/partners/${outlet.partnerId}" style="display: flex; align-items: center; justify-content: center; background: #71379B; color: #FFFFFF; font-size: 12px; font-weight: 600; padding: 8px 10px; border-radius: 8px; text-decoration: none; white-space: nowrap; transition: background 0.2s;">
            Detail Mitra
          </a>
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; background: #F0E5F7; color: #71379B; font-size: 12px; font-weight: 600; padding: 8px 10px; border-radius: 8px; text-decoration: none; border: 1px solid #E7DEF0; white-space: nowrap; transition: all 0.2s;">
            Google Maps
          </a>
        </div>
      </div>
    `;

    const popup = new maplibregl.Popup({
      offset: [0, -38],
      closeButton: true,
      closeOnClick: false,
      maxWidth: '360px',
    })
      .setLngLat([outlet.longitude, outlet.latitude])
      .setHTML(contentHtml)
      .addTo(map);

    activePopupRef.current = popup;
  };

  // Update Candidate Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (candidateLocation) {
      if (!candidateMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'cursor-pointer';
        el.innerHTML = `
          <div class="marker-pin-inner" style="width: 32px; height: 44px; position: relative; filter: drop-shadow(0 4px 8px rgba(37, 99, 235, 0.5));">
            <svg width="32" height="44" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; width: 100%; height: 100%;">
              <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24s14-13.5 14-24C28 6.268 21.732 0 14 0z" fill="#2563EB" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="14" cy="14" r="5.5" fill="#FFFFFF"/>
              <circle cx="14" cy="14" r="3" fill="#2563EB"/>
            </svg>
            <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: #2563EB; color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 1.5px 6px; border-radius: 9999px; border: 1.5px solid #FFFFFF; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
              CALON
            </span>
          </div>
        `;

        const marker = new maplibregl.Marker({
          element: el,
          draggable: true,
          anchor: 'bottom',
        })
          .setLngLat([candidateLocation.lng, candidateLocation.lat])
          .addTo(map);

        el.addEventListener('mousedown', (e) => e.stopPropagation());
        el.addEventListener('touchstart', (e) => e.stopPropagation());

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          if (onCandidateLocationChange) {
            onCandidateLocationChange({ lat: lngLat.lat, lng: lngLat.lng });
          }
        });

        candidateMarkerRef.current = marker;
      } else {
        candidateMarkerRef.current.setLngLat([candidateLocation.lng, candidateLocation.lat]);
      }
    } else {
      if (candidateMarkerRef.current) {
        candidateMarkerRef.current.remove();
        candidateMarkerRef.current = null;
      }
    }
  }, [candidateLocation, mapLoaded, onCandidateLocationChange]);

  // Update Turf Geodesic Radius Circle Layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource('radius-circle-source') as maplibregl.GeoJSONSource;
    if (!source) return;

    if (!showRadiusCircle) {
      source.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];

    // If candidate location is present, draw circle around candidate
    if (candidateLocation) {
      const circle = generateGeodesicCircle(
        candidateLocation.lng,
        candidateLocation.lat,
        candidateLocation.radiusKm || radiusKm
      );
      features.push(circle);
    } else if (selectedOutletId) {
      // If outlet selected, draw circle around selected outlet
      const outlet = outlets.find((o) => o.id === selectedOutletId);
      if (outlet) {
        const circle = generateGeodesicCircle(outlet.longitude, outlet.latitude, radiusKm);
        features.push(circle);
      }
    }

    source.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [candidateLocation, selectedOutletId, showRadiusCircle, radiusKm, mapLoaded, outlets]);

  // Fit bounds to show all outlets
  const handleFitBounds = () => {
    const map = mapRef.current;
    if (!map || outlets.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    outlets.forEach((o) => bounds.extend([o.longitude, o.latitude]));
    if (candidateLocation) {
      bounds.extend([candidateLocation.lng, candidateLocation.lat]);
    }

    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 1000 });
  };

  // Change Map Style handler
  const handleStyleChange = (newStyle: string) => {
    setCurrentStyle(newStyle);
    if (mapRef.current) {
      mapRef.current.setStyle(newStyle);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full rounded-2xl overflow-hidden shadow-inner bg-[#EFEAF4]" />

      {/* Floating Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-[#E7DEF0] bg-white/95 p-1.5 shadow-lg backdrop-blur-md">
        {/* Style Selector */}
        <div className="flex items-center gap-1 text-xs font-medium text-[#24182E] px-2">
          <Layers className="h-3.5 w-3.5 text-[#71379B]" />
          <span className="hidden sm:inline">Gaya:</span>
          <select
            value={currentStyle}
            onChange={(e) => handleStyleChange(e.target.value)}
            className="rounded-lg border-0 bg-transparent py-1 text-xs font-semibold text-[#71379B] focus:ring-1 focus:ring-[#71379B] cursor-pointer"
          >
            <option value="https://tiles.openfreemap.org/styles/liberty">OpenFreeMap Liberty</option>
            <option value="https://tiles.openfreemap.org/styles/bright">OpenFreeMap Bright</option>
            <option value="https://tiles.openfreemap.org/styles/positron">OpenFreeMap Positron</option>
            <option value="https://tiles.openfreemap.org/styles/dark">OpenFreeMap Dark</option>
            <option value="https://tiles.openfreemap.org/styles/fiord">OpenFreeMap Fiord</option>
          </select>
        </div>

        <div className="h-4 w-px bg-[#E7DEF0]" />

        {/* Fit Bounds Button */}
        <button
          onClick={handleFitBounds}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-[#24182E] hover:bg-[#F0E5F7] hover:text-[#71379B] transition-colors"
          title="Tampilkan seluruh sebaran outlet"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reset View</span>
        </button>

        {isPickingLocation && (
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <span>Klik peta untuk menentukan titik</span>
          </div>
        )}
      </div>

      {/* Map Error Banner */}
      {mapError && (
        <div className="absolute inset-x-4 top-20 z-20 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-3 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>{mapError}</span>
          </div>
          <button
            onClick={() => handleStyleChange('https://tiles.openfreemap.org/styles/liberty')}
            className="text-xs font-semibold text-amber-900 underline hover:no-underline"
          >
            Coba Muat Ulang
          </button>
        </div>
      )}
    </div>
  );
}
