# Melatea Partner Center — Free Maps & GIS Integration Architecture

## 1. Primary Map Provider: OpenFreeMap
- **Provider:** OpenFreeMap ([https://openfreemap.org/](https://openfreemap.org/))
- **Panduan Quick Start Resmi:** [https://openfreemap.org/quick_start/](https://openfreemap.org/quick_start/)
- **Tiles:** Vector Tiles bertenaga OpenStreetMap & OpenMapTiles data.
- **Biaya & Lisensi:** Gratis 100%, tanpa kartu kredit, legal untuk penggunaan komersial.
- **Key Requirement:** **TIDAK MEMERLUKAN API KEY** dan **TIDAK MEMERLUKAN TOKEN**.
- **Pilihan Map Styles Resmi OpenFreeMap:**
  - Liberty (Default): `https://tiles.openfreemap.org/styles/liberty`
  - Bright (Kontras Terang): `https://tiles.openfreemap.org/styles/bright`
  - Positron (Clean Minimalis): `https://tiles.openfreemap.org/styles/positron`
  - Dark (Mode Gelap): `https://tiles.openfreemap.org/styles/dark`
  - Fiord (Sleek Slate Blue): `https://tiles.openfreemap.org/styles/fiord`
  - 3D (3D Buildings): `https://tiles.openfreemap.org/styles/liberty-3d`
- **Atribusi Resmi:**
  `© OpenFreeMap © OpenMapTiles Data from OpenStreetMap`

---

## 2. Map Client: MapLibre GL JS
- **Library:** `maplibre-gl` (v4/v5 compatible)
- **Kompatibilitas:** Next.js App Router (`'use client'`, Dynamic Import `ssr: false`).
- **Fitur Utama:**
  - Lifecycle cleanup (`map.remove()`) saat unmount untuk mencegah memory leaks.
  - Smooth FlyTo camera animation ke koordinat outlet terpilih.
  - Interactive marker pins dengan event handling (Click, Hover, Select).
  - Geodesic Circle rendering dengan Turf.js (proyeksi kilometer akurat sesuai kelengkungan bumi, bukan pixel/CSS).
  - Automatic `fitBounds` menyesuaikan sebaran seluruh outlet aktif di wilayah operasional (Surakarta, Solo Raya, dan sekitarnya).

---

## 3. Geocoding Provider: Geoapify
- **Endpoint Resmi:**
  - Forward Geocoding: `https://api.geoapify.com/v1/geocode/search`
  - Reverse Geocoding: `https://api.geoapify.com/v1/geocode/reverse`
  - Autocomplete: `https://api.geoapify.com/v1/geocode/autocomplete`
- **Backend Proxy Wrapper:**
  - `GET /api/maps/search?q={query}`
  - `GET /api/maps/autocomplete?text={text}`
  - `GET /api/maps/reverse?lat={lat}&lon={lon}`
- **Security & Budget:**
  - API Key disimpan di backend environment (`GEOAPIFY_API_KEY`). Tidak pernah diekspos ke browser client.
  - Internal budget counter: 2.500 kredit/hari (konservatif di bawah batas free tier 3.000).
  - Search debouncing: 400ms – 500ms, minimum 3 karakter query.
  - Bias wilayah: Pembatasan hasil pencarian ke Indonesia (`filter=countrycode:id`).
- **No-Key Fallback Mode:**
  - Jika `GEOAPIFY_API_KEY` belum diset, aplikasi **TIDAK CRASH**.
  - UI menampilkan banner informatif bahwa mode koordinat manual aktif.
  - Pengguna dapat mengetik koordinat manual, melakukan klik langsung pada peta untuk memposisikan titik calon mitra, atau menggeser marker calon lokasi.

---

## 4. Validasi Radius Wilayah (Territory Management)
- **Aturan Bisnis:** Radius proteksi kemitraan 2,5 km – 3,0 km (dapat dikustomisasi oleh HQ).
- **PostGIS Spatial Engine:**
  - Fungsi Spasial: `ST_DWithin(geom_a::geography, geom_b::geography, radius_in_meters)`
  - Jarak Geografis: `ST_Distance(geom_a::geography, geom_b::geography)`
  - Indeks Spasial: GIST Index pada kolom geometri/geography.
  - Geodesic Fallback: Haversine & Geodesic Turf calculation terverifikasi identik dengan PostGIS untuk eksekusi tanpa dependency database eksternal.
- **Kategori Kelayakan:**
  1. `LAYAK`: Tidak ada outlet aktif yang berada dalam radius proteksi.
  2. `TIDAK LAYAK`: Terdapat satu atau lebih outlet aktif yang melanggar batas radius minimum.
  3. `PERLU REVIEW`: Lokasi berada di batas toleransi (boundary margin) atau memerlukan persetujuan khusus direksi HQ.

---

## 5. Integrasi Google Maps
- **Fitur:** Tombol *"Buka Google Maps"* pada setiap outlet dan calon lokasi.
- **Format URL Standar:**  
  `https://www.google.com/maps/search/?api=1&query={LAT},{LNG}`
- **Keuntungan:** Tidak memerlukan Google Maps API key, langsung membuka Google Maps di tab browser baru atau membuka aplikasi native Google Maps pada smartphone mobile.
