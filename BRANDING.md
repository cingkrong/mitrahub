# Melatea Partner Center — Brand Guideline & Visual Identity System

## 1. Brand Identity Overview
**Aplikasi:** Melatea Partner Center  
**Tagline:** Partnership & Franchise Management System  
**Entitas:** Es Teh Melatea (PT Melatea Nusantara Indonesia)  
**Referensi:** [@estehmelatea](https://www.instagram.com/estehmelatea/)  
**Karakter Brand:** Modern, Segar, Profesional, Ramah Kemitraan (B2B SaaS Hub).

---

## 2. Palet Warna (Semantic Design Tokens)

| Token Name | HEX | CSS Variable | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Primary Purple** | `#71379B` | `--melatea-purple` | Brand utama, primary buttons, active markers, brand highlight |
| **Deep Purple** | `#29183B` | `--melatea-deep` | Sidebar background, primary headings, dark surfaces |
| **Lavender** | `#F0E5F7` | `--melatea-lavender` | Active navigation pill, soft badge background, accents |
| **Gold Accent** | `#E3B764` | `--melatea-gold` | Star badges, tier 'Unggulan', KPI accents, financial metrics |
| **Background** | `#F8F5FA` | `--melatea-bg` | Background halaman dashboard utama |
| **Surface** | `#FFFFFF` | `--melatea-surface` | Kartu KPI, modal, panel peta, container data |
| **Primary Text** | `#24182E` | `--melatea-text` | Warna teks utama, teks tabel, heading kartu |
| **Muted Text** | `#6B5E78` | `--melatea-muted` | Sub-label, keterangan tanggal, koordinat geografis |
| **Border Soft** | `#E7DEF0` | `--melatea-border` | Hairline divider 1px, pembatas kartu, separator bar |

---

## 3. Semantic Status System (Non-Purple)
Sesuai prinsip anti-slop design, warna status tidak boleh digantikan dengan ungu generik:
- **Aktif / Berhasil (Green):** `#16A34A` (Background: `#DCFCE7`, Border: `#86EFAC`)
- **Perlu Perhatian (Amber/Yellow):** `#D97706` (Background: `#FEF3C7`, Border: `#FCD34D`)
- **Tidak Aktif / Konflik (Red):** `#DC2626` (Background: `#FEE2E2`, Border: `#FCA5A5`)
- **Pengajuan / Info (Blue):** `#2563EB` (Background: `#DBEAFE`, Border: `#93C5FD`)

---

## 4. Tipografi
- **Primary Font:** Inter / Plus Jakarta Sans (`font-sans`), sans-serif fallback.
- **Display Weights:** SemiBold (600) untuk title, Medium (500) untuk navigasi & badge, Regular (400) untuk body text.
- **Monospace Coordinates:** Tabular Numbers (`font-mono`) untuk nilai latitude, longitude, jarak kilometer, dan ID transaksi.

---

## 5. Komponen Visual
- **Sidebar:** Dark deep purple (`#29183B`), logo dengan badge keemasan, navigasi berjarak konsisten dengan indikator aktif lavender.
- **Cards:** Background putih murni, radius terukur (12px), border lembut (`#E7DEF0`), shadow tipis tanpa blur berlebih.
- **Interactive Markers:** Pin SVG bespoke dengan warna status semantik, pulsasi halus pada outlet aktif terpilih.
