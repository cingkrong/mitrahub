# Melatea Partner Center 🧋
> **Partnership & Franchise Management System for Es Teh Melatea**  
> Sistem manajemen kemitraan B2B terpadu dengan pemetaan outlet OpenFreeMap, validasi radius zonasi 2,5–3 km PostGIS, dan monitoring repeat order.

---

## 🚀 Fitur Utama
1. **Branding Es Teh Melatea:**
   - Palet warna: Primary Purple (`#71379B`), Deep Purple (`#29183B`), Lavender (`#F0E5F7`), Gold Accent (`#E3B764`).
   - Status semantik standar: Hijau (Aktif), Kuning (Perlu Perhatian), Merah (Nonaktif/Konflik), Biru (Pengajuan).
2. **Peta Kemitraan OpenFreeMap (100% Free & Commercial Friendly):**
   - Menggunakan MapLibre GL JS + OpenFreeMap Liberty Vector Tiles.
   - **Tanpa Google Maps API key**, tanpa token OpenFreeMap, legal komersial.
   - Sebaran outlet interaktif dengan filter wilayah, popup detail gerai, dan tombol deep-link Google Maps.
   - Koordinat latitude & longitude dapat diklik untuk memfokuskan kamera peta (`flyTo`).
3. **Validasi Radius Wilayah PostGIS (2,5 – 3,0 km):**
   - Menghitung jarak geografis kelengkungan bumi (geodesic distance matching `ST_Distance(geography)`).
   - Visualisasi geodesic circle menggunakan Turf.js.
   - Deteksi konflik gerai dalam radius proteksi secara instan (`LAYAK`, `TIDAK LAYAK`, `PERLU REVIEW`).
   - Alur persetujuan mitra dengan verifikasi atomik untuk mencegah *race condition*.
4. **Geoapify Geocoding API & Fallback No-Key:**
   - Forward geocoding, reverse geocoding, dan autocomplete beralamat Indonesia.
   - **Mode Fallback:** Jika API key belum diset, peta tetap 100% berfungsi via input koordinat manual, drag marker, dan klik titik peta tanpa crash.
5. **Dashboard Monitoring Repeat Order B2B:**
   - Evaluasi pembelian bahan baku dari mitra ke kantor pusat (HQ).
   - Metrik RFM: Lifetime spend, total repeat order, interval pembelian, dan days since last order.
   - Klasifikasi performa mitra: Unggulan, Reguler, Perlu Perhatian, Tidak Aktif.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS.
- **Komponen & Visualisasi:** Lucide Icons, Recharts, MapLibre GL JS, Turf.js.
- **Database & ORM:** PostgreSQL + PostGIS, Prisma ORM.
- **Deployment:** Docker Compose (`postgis/postgis:16-3.4` + Node.js Alpine).

---

## 📦 Menjalankan Aplikasi Secara Lokal

### 1. Prasyarat
- Node.js v20+ atau v24+
- npm v10+

### 2. Instalasi Dependency
```bash
npm install
```

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
*(Opsional: Isi `GEOAPIFY_API_KEY` jika ingin mengaktifkan autocomplete alamat otomatis. Jika dikosongkan, mode koordinat manual & klik peta tetap aktif).*

### 4. Menjalankan Unit & Integration Test
```bash
npm test
```

### 5. Menjalankan Development Server
```bash
npm run dev
```
Buka browser pada: [http://localhost:3000](http://localhost:3000)

### 6. Menjalankan Production Build
```bash
npm run build
npm start
```

---

## 🐳 Deployment dengan Docker Compose

Untuk menjalankan database PostgreSQL + PostGIS dan aplikasi web secara terintegrasi:

```bash
docker compose up -d --build
```
Database PostGIS otomatis mengaktifkan extension spasial `postgis` dan `postgis_topology` melalui `docker/init-postgis.sql`.

---

## 📖 Dokumentasi Lengkap
- [Brand Guideline & Visual System](BRANDING.md)
- [Arsitektur Integrasi OpenFreeMap & GIS](MAPS_INTEGRATION.md)
- [Skema Database & PostGIS Spatial](DATABASE_SCHEMA.md)
- [Laporan Pengujian QA](TEST_REPORT.md)

---
© 2026 PT Melatea Nusantara Indonesia • Melatea Partner Center
