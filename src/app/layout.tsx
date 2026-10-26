import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Melatea Partner Center — Partnership & Franchise Management System',
  description:
    'Sistem manajemen kemitraan B2B untuk Es Teh Melatea: pemetaan outlet, validasi radius zonasi 2.5–3 km, pemantauan repeat order, dan evaluasi performa mitra.',
  keywords: [
    'Es Teh Melatea',
    'Melatea Partner Center',
    'Franchise Es Teh',
    'Kemitraan Es Teh',
    'OpenFreeMap GIS',
    'Radius Kemitraan',
  ],
  authors: [{ name: 'PT Melatea Nusantara Indonesia' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F8F5FA] text-[#24182E] antialiased">
        {children}
      </body>
    </html>
  );
}
