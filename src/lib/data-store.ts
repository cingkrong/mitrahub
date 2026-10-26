import {
  Partner,
  Outlet,
  PurchaseOrder,
  PartnerApplication,
  TerritoryValidationResult,
  DashboardOverviewData,
  MapSettingsConfig,
  FeasibilityStatus,
  PartnerTier,
} from './types';
import { calculateGeodesicDistanceMeters } from './geo-utils';

// Initial Map Settings
let mapSettings: MapSettingsConfig = {
  mapProvider: process.env.MAP_PROVIDER || 'openfreemap',
  mapStyleUrl:
    process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty',
  defaultLat: parseFloat(process.env.DEFAULT_MAP_LAT || '-7.5755'),
  defaultLng: parseFloat(process.env.DEFAULT_MAP_LNG || '110.8243'),
  defaultZoom: parseInt(process.env.DEFAULT_MAP_ZOOM || '11', 10),
  defaultRadiusKm: parseFloat(process.env.DEFAULT_RADIUS_KM || '3.0'),
  enableClustering: true,
  geocodingProvider: process.env.GEOCODING_PROVIDER || 'geoapify',
  geocodingDailyBudget: parseInt(process.env.GEOAPIFY_DAILY_CREDIT_BUDGET || '2500', 10),
  geocodingCreditsUsed: 42,
  isGeocodingKeyConfigured: Boolean(process.env.GEOAPIFY_API_KEY && process.env.GEOAPIFY_API_KEY.trim().length > 0),
};

// Seed Outlets in Surakarta / Solo Raya region
let outletsData: Outlet[] = [
  {
    id: 'OUT-001',
    partnerId: 'PTR-001',
    partnerName: 'Budi Santoso',
    brandId: 'BRAND-MELATEA',
    name: 'Melatea Outlet Manahan Solo',
    address: 'Jl. Menteri Supeno No. 14, Manahan, Banjarsari',
    city: 'Surakarta',
    district: 'Banjarsari',
    latitude: -7.5532,
    longitude: 110.8061,
    operationalDate: '2024-01-15T00:00:00Z',
    status: 'ACTIVE',
    lastOrderDate: '2026-10-18T10:30:00Z',
    repeatOrderCount: 18,
  },
  {
    id: 'OUT-002',
    partnerId: 'PTR-002',
    partnerName: 'Siti Rahmawati',
    brandId: 'BRAND-MELATEA',
    name: 'Melatea Outlet UMS Pabelan',
    address: 'Jl. Garuda Mas No. 8, Pabelan, Kartasura',
    city: 'Sukoharjo',
    district: 'Kartasura',
    latitude: -7.5583,
    longitude: 110.7712,
    operationalDate: '2024-03-10T00:00:00Z',
    status: 'ACTIVE',
    lastOrderDate: '2026-10-22T14:15:00Z',
    repeatOrderCount: 24,
  },
  {
    id: 'OUT-003',
    partnerId: 'PTR-003',
    partnerName: 'Hendro Wijaya',
    brandId: 'BRAND-MELATEA',
    name: 'Melatea Outlet Palur Plasa',
    address: 'Jl. Raya Palur Km 5, Jaten',
    city: 'Karanganyar',
    district: 'Jaten',
    latitude: -7.5786,
    longitude: 110.8654,
    operationalDate: '2024-05-20T00:00:00Z',
    status: 'ACTIVE',
    lastOrderDate: '2026-10-12T09:00:00Z',
    repeatOrderCount: 14,
  },
  {
    id: 'OUT-004',
    partnerId: 'PTR-004',
    partnerName: 'Dewi Lestari',
    brandId: 'BRAND-MELATEA',
    name: 'Melatea Outlet UNS Kentingan',
    address: 'Jl. Ir. Sutami No. 36A, Kentingan, Jebres',
    city: 'Surakarta',
    district: 'Jebres',
    latitude: -7.5598,
    longitude: 110.8542,
    operationalDate: '2024-06-01T00:00:00Z',
    status: 'ACTIVE',
    lastOrderDate: '2026-10-24T16:45:00Z',
    repeatOrderCount: 22,
  },
  {
    id: 'OUT-005',
    partnerId: 'PTR-005',
    partnerName: 'Agus Pratama',
    brandId: 'BRAND-MELATEA',
    name: 'Melatea Outlet Solo Baru',
    address: 'Jl. Ir. Soekarno No. 22, Madegondo, Grogol',
    city: 'Sukoharjo',
    district: 'Grogol',
    latitude: -7.6002,
    longitude: 110.8173,
    operationalDate: '2024-07-15T00:00:00Z',
    status: 'ACTIVE',
    lastOrderDate: '2026-10-20T11:20:00Z',
    repeatOrderCount: 16,
  },
  {
    id: 'OUT-006',
    partnerId: 'PTR-006',
    partnerName: 'Rina Kusuma',
    brandId: 'BRAND-MELATEA',
    name: 'Melatea Outlet Colomadu',
    address: 'Jl. Adi Sucipto No. 98, Paulan, Colomadu',
    city: 'Karanganyar',
    district: 'Colomadu',
    latitude: -7.5312,
    longitude: 110.7634,
    operationalDate: '2024-09-01T00:00:00Z',
    status: 'ATTENTION',
    lastOrderDate: '2026-08-30T13:00:00Z', // 57 days inactive
    repeatOrderCount: 3,
  },
  {
    id: 'OUT-007',
    partnerId: 'PTR-007',
    partnerName: 'Fajar Nugroho',
    brandId: 'BRAND-MELATEA',
    name: 'Melatea Outlet Kartasura Kota',
    address: 'Jl. Ahmad Yani No. 112, Kartasura',
    city: 'Sukoharjo',
    district: 'Kartasura',
    latitude: -7.5518,
    longitude: 110.7425,
    operationalDate: '2024-11-10T00:00:00Z',
    status: 'ACTIVE',
    lastOrderDate: '2026-10-15T08:30:00Z',
    repeatOrderCount: 11,
  },
  {
    id: 'OUT-008',
    partnerId: 'PTR-008',
    partnerName: 'Bambang Tri',
    brandId: 'BRAND-MELATEA',
    name: 'Melatea Outlet Boyolali Simpang Lima',
    address: 'Jl. Pandanaran No. 45, Boyolali Kota',
    city: 'Boyolali',
    district: 'Boyolali',
    latitude: -7.5348,
    longitude: 110.5962,
    operationalDate: '2025-01-20T00:00:00Z',
    status: 'ACTIVE',
    lastOrderDate: '2026-10-21T15:10:00Z',
    repeatOrderCount: 9,
  },
  {
    id: 'OUT-009',
    partnerId: 'PTR-009',
    partnerName: 'Haryanto',
    brandId: 'BRAND-MELATEA',
    name: 'Melatea Outlet Klaten Utara',
    address: 'Jl. Pemuda No. 210, Bareng Lor, Klaten Utara',
    city: 'Klaten',
    district: 'Klaten Utara',
    latitude: -7.6983,
    longitude: 110.6094,
    operationalDate: '2024-02-10T00:00:00Z',
    status: 'INACTIVE',
    lastOrderDate: '2026-06-15T10:00:00Z', // Inactive
    repeatOrderCount: 4,
  },
  {
    id: 'OUT-010',
    partnerId: 'PTR-010',
    partnerName: 'Ahmad Fauzi',
    brandId: 'BRAND-MELATEA',
    name: 'Melatea Outlet Singosaren Solo',
    address: 'Jl. Gatot Subroto No. 55, Kemlayan, Serengan',
    city: 'Surakarta',
    district: 'Serengan',
    latitude: -7.5756,
    longitude: 110.8245,
    operationalDate: '2025-02-01T00:00:00Z',
    status: 'ACTIVE',
    lastOrderDate: '2026-10-23T17:00:00Z',
    repeatOrderCount: 15,
  },
];

// Seed Purchase Orders (B2B wholesale from Melatea HQ to Partners)
let purchaseOrdersData: PurchaseOrder[] = [
  {
    id: 'PO-2026-001',
    partnerId: 'PTR-002',
    partnerName: 'Siti Rahmawati',
    outletId: 'OUT-002',
    outletName: 'Melatea Outlet UMS Pabelan',
    orderDate: '2026-10-22T14:15:00Z',
    totalAmount: 2450000,
    orderStatus: 'COMPLETED',
    isFirstOrder: false,
    isRepeatOrder: true,
    notes: 'Restock mingguan daun teh melati + cup sablon',
    items: [
      { id: 'ITM-001', orderId: 'PO-2026-001', productName: 'Teh Melatea Signature Blend 1kg', quantity: 15, unitPrice: 65000, subtotal: 975000 },
      { id: 'ITM-002', orderId: 'PO-2026-001', productName: 'Cup Sablon 18oz Melatea (1000 pcs)', quantity: 2, unitPrice: 425000, subtotal: 850000 },
      { id: 'ITM-003', orderId: 'PO-2026-001', productName: 'Sirup Buah Mangga Melatea 2L', quantity: 5, unitPrice: 75000, subtotal: 375000 },
      { id: 'ITM-004', orderId: 'PO-2026-001', productName: 'Straw Steril Melatea (500 pcs)', quantity: 5, unitPrice: 50000, subtotal: 250000 },
    ],
  },
  {
    id: 'PO-2026-002',
    partnerId: 'PTR-004',
    partnerName: 'Dewi Lestari',
    outletId: 'OUT-004',
    outletName: 'Melatea Outlet UNS Kentingan',
    orderDate: '2026-10-24T16:45:00Z',
    totalAmount: 3200000,
    orderStatus: 'COMPLETED',
    isFirstOrder: false,
    isRepeatOrder: true,
    notes: 'Restock bahan baku volume kampus UNS',
    items: [
      { id: 'ITM-005', orderId: 'PO-2026-002', productName: 'Teh Melatea Signature Blend 1kg', quantity: 20, unitPrice: 65000, subtotal: 1300000 },
      { id: 'ITM-006', orderId: 'PO-2026-002', productName: 'Cup Sablon 22oz Melatea (1000 pcs)', quantity: 2, unitPrice: 450000, subtotal: 900000 },
      { id: 'ITM-007', orderId: 'PO-2026-002', productName: 'Sealer Roll Film Logo Melatea (2000 cup)', quantity: 2, unitPrice: 160000, subtotal: 320000 },
      { id: 'ITM-008', orderId: 'PO-2026-002', productName: 'Sirup Buah Leci & Stroberi Melatea 2L', quantity: 9, unitPrice: 75000, subtotal: 680000 },
    ],
  },
  {
    id: 'PO-2026-003',
    partnerId: 'PTR-010',
    partnerName: 'Ahmad Fauzi',
    outletId: 'OUT-010',
    outletName: 'Melatea Outlet Singosaren Solo',
    orderDate: '2026-10-23T17:00:00Z',
    totalAmount: 1850000,
    orderStatus: 'COMPLETED',
    isFirstOrder: false,
    isRepeatOrder: true,
    items: [
      { id: 'ITM-009', orderId: 'PO-2026-003', productName: 'Teh Melatea Signature Blend 1kg', quantity: 12, unitPrice: 65000, subtotal: 780000 },
      { id: 'ITM-010', orderId: 'PO-2026-003', productName: 'Cup Sablon 18oz Melatea (1000 pcs)', quantity: 1, unitPrice: 425000, subtotal: 425000 },
      { id: 'ITM-011', orderId: 'PO-2026-003', productName: 'Sirup Buah Melatea Aneka Rasa', quantity: 8, unitPrice: 80625, subtotal: 645000 },
    ],
  },
  {
    id: 'PO-2026-004',
    partnerId: 'PTR-001',
    partnerName: 'Budi Santoso',
    outletId: 'OUT-001',
    outletName: 'Melatea Outlet Manahan Solo',
    orderDate: '2026-10-18T10:30:00Z',
    totalAmount: 2150000,
    orderStatus: 'COMPLETED',
    isFirstOrder: false,
    isRepeatOrder: true,
    items: [
      { id: 'ITM-012', orderId: 'PO-2026-004', productName: 'Teh Melatea Signature Blend 1kg', quantity: 16, unitPrice: 65000, subtotal: 1040000 },
      { id: 'ITM-013', orderId: 'PO-2026-004', productName: 'Cup Sablon 18oz Melatea (1000 pcs)', quantity: 2, unitPrice: 425000, subtotal: 850000 },
      { id: 'ITM-014', orderId: 'PO-2026-004', productName: 'Creamer / Milk Powder Melatea 1kg', quantity: 4, unitPrice: 65000, subtotal: 260000 },
    ],
  },
  {
    id: 'PO-2026-005',
    partnerId: 'PTR-005',
    partnerName: 'Agus Pratama',
    outletId: 'OUT-005',
    outletName: 'Melatea Outlet Solo Baru',
    orderDate: '2026-10-20T11:20:00Z',
    totalAmount: 1950000,
    orderStatus: 'COMPLETED',
    isFirstOrder: false,
    isRepeatOrder: true,
    items: [
      { id: 'ITM-015', orderId: 'PO-2026-005', productName: 'Teh Melatea Signature Blend 1kg', quantity: 14, unitPrice: 65000, subtotal: 910000 },
      { id: 'ITM-016', orderId: 'PO-2026-005', productName: 'Cup Sablon 22oz Melatea (1000 pcs)', quantity: 2, unitPrice: 450000, subtotal: 900000 },
      { id: 'ITM-017', orderId: 'PO-2026-005', productName: 'Straw Steril Melatea (500 pcs)', quantity: 2, unitPrice: 70000, subtotal: 140000 },
    ],
  },
  {
    id: 'PO-2026-006',
    partnerId: 'PTR-007',
    partnerName: 'Fajar Nugroho',
    outletId: 'OUT-007',
    outletName: 'Melatea Outlet Kartasura Kota',
    orderDate: '2026-10-15T08:30:00Z',
    totalAmount: 1720000,
    orderStatus: 'COMPLETED',
    isFirstOrder: false,
    isRepeatOrder: true,
    items: [
      { id: 'ITM-018', orderId: 'PO-2026-006', productName: 'Teh Melatea Signature Blend 1kg', quantity: 12, unitPrice: 65000, subtotal: 780000 },
      { id: 'ITM-019', orderId: 'PO-2026-006', productName: 'Cup Sablon 18oz Melatea (1000 pcs)', quantity: 1, unitPrice: 425000, subtotal: 425000 },
      { id: 'ITM-020', orderId: 'PO-2026-006', productName: 'Sirup Buah Melatea Aneka Rasa', quantity: 6, unitPrice: 85833, subtotal: 515000 },
    ],
  },
  {
    id: 'PO-2026-007',
    partnerId: 'PTR-008',
    partnerName: 'Bambang Tri',
    outletId: 'OUT-008',
    outletName: 'Melatea Outlet Boyolali Simpang Lima',
    orderDate: '2026-10-21T15:10:00Z',
    totalAmount: 2100000,
    orderStatus: 'COMPLETED',
    isFirstOrder: false,
    isRepeatOrder: true,
    items: [
      { id: 'ITM-021', orderId: 'PO-2026-007', productName: 'Teh Melatea Signature Blend 1kg', quantity: 15, unitPrice: 65000, subtotal: 975000 },
      { id: 'ITM-022', orderId: 'PO-2026-007', productName: 'Cup Sablon 18oz Melatea (1000 pcs)', quantity: 2, unitPrice: 425000, subtotal: 850000 },
      { id: 'ITM-023', orderId: 'PO-2026-007', productName: 'Sirup Rasa Buah Melatea', quantity: 4, unitPrice: 68750, subtotal: 275000 },
    ],
  },
  {
    id: 'PO-2026-008',
    partnerId: 'PTR-006',
    partnerName: 'Rina Kusuma',
    outletId: 'OUT-006',
    outletName: 'Melatea Outlet Colomadu',
    orderDate: '2026-08-30T13:00:00Z', // Old order!
    totalAmount: 950000,
    orderStatus: 'COMPLETED',
    isFirstOrder: false,
    isRepeatOrder: true,
    items: [
      { id: 'ITM-024', orderId: 'PO-2026-008', productName: 'Teh Melatea Signature Blend 1kg', quantity: 8, unitPrice: 65000, subtotal: 520000 },
      { id: 'ITM-025', orderId: 'PO-2026-008', productName: 'Cup Sablon 18oz Melatea (1000 pcs)', quantity: 1, unitPrice: 430000, subtotal: 430000 },
    ],
  },
  {
    id: 'PO-2026-009',
    partnerId: 'PTR-006',
    partnerName: 'Rina Kusuma',
    outletId: 'OUT-006',
    outletName: 'Melatea Outlet Colomadu',
    orderDate: '2024-09-01T08:00:00Z',
    totalAmount: 7500000,
    orderStatus: 'COMPLETED',
    isFirstOrder: true,
    isRepeatOrder: false,
    notes: 'Paket Kemitraan Awal Lengkap Booth + Mesin Sealer + Starter Kit',
    items: [
      { id: 'ITM-026', orderId: 'PO-2026-009', productName: 'Paket Franchise Melatea Booth Silver', quantity: 1, unitPrice: 7500000, subtotal: 7500000 },
    ],
  },
];

// Seed Partners
let partnersData: Partner[] = [
  {
    id: 'PTR-001',
    organizationId: 'ORG-MELATEA',
    ownerName: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    phone: '081226548901',
    identityNumber: '3372011508820001',
    tier: 'UNGGULAN',
    status: 'ACTIVE',
    joinedAt: '2024-01-15T00:00:00Z',
    outlets: [],
  },
  {
    id: 'PTR-002',
    organizationId: 'ORG-MELATEA',
    ownerName: 'Siti Rahmawati',
    email: 'siti.rahma@gmail.com',
    phone: '085743128990',
    identityNumber: '3311084509900002',
    tier: 'UNGGULAN',
    status: 'ACTIVE',
    joinedAt: '2024-03-10T00:00:00Z',
    outlets: [],
  },
  {
    id: 'PTR-003',
    organizationId: 'ORG-MELATEA',
    ownerName: 'Hendro Wijaya',
    email: 'hendro.wijaya@gmail.com',
    phone: '081390456123',
    identityNumber: '3313021903850004',
    tier: 'REGULER',
    status: 'ACTIVE',
    joinedAt: '2024-05-20T00:00:00Z',
    outlets: [],
  },
  {
    id: 'PTR-004',
    organizationId: 'ORG-MELATEA',
    ownerName: 'Dewi Lestari',
    email: 'dewi.lestari@gmail.com',
    phone: '087834567812',
    identityNumber: '3372045607920005',
    tier: 'UNGGULAN',
    status: 'ACTIVE',
    joinedAt: '2024-06-01T00:00:00Z',
    outlets: [],
  },
  {
    id: 'PTR-005',
    organizationId: 'ORG-MELATEA',
    ownerName: 'Agus Pratama',
    email: 'agus.pratama@yahoo.com',
    phone: '081298765432',
    identityNumber: '3311091211880003',
    tier: 'REGULER',
    status: 'ACTIVE',
    joinedAt: '2024-07-15T00:00:00Z',
    outlets: [],
  },
  {
    id: 'PTR-006',
    organizationId: 'ORG-MELATEA',
    ownerName: 'Rina Kusuma',
    email: 'rina.kusuma@gmail.com',
    phone: '085647890123',
    identityNumber: '3313056104930007',
    tier: 'PERLU_PERHATIAN',
    status: 'ACTIVE',
    joinedAt: '2024-09-01T00:00:00Z',
    outlets: [],
  },
  {
    id: 'PTR-007',
    organizationId: 'ORG-MELATEA',
    ownerName: 'Fajar Nugroho',
    email: 'fajar.nugroho@gmail.com',
    phone: '082134567890',
    identityNumber: '3311082506890008',
    tier: 'REGULER',
    status: 'ACTIVE',
    joinedAt: '2024-11-10T00:00:00Z',
    outlets: [],
  },
  {
    id: 'PTR-008',
    organizationId: 'ORG-MELATEA',
    ownerName: 'Bambang Tri',
    email: 'bambang.tri@gmail.com',
    phone: '081329012345',
    identityNumber: '3309041402800009',
    tier: 'REGULER',
    status: 'ACTIVE',
    joinedAt: '2025-01-20T00:00:00Z',
    outlets: [],
  },
  {
    id: 'PTR-009',
    organizationId: 'ORG-MELATEA',
    ownerName: 'Haryanto',
    email: 'haryanto.klaten@gmail.com',
    phone: '087736123456',
    identityNumber: '3310121008770010',
    tier: 'TIDAK_AKTIF',
    status: 'INACTIVE',
    joinedAt: '2024-02-10T00:00:00Z',
    outlets: [],
  },
  {
    id: 'PTR-010',
    organizationId: 'ORG-MELATEA',
    ownerName: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@gmail.com',
    phone: '081234567001',
    identityNumber: '3372021509910011',
    tier: 'UNGGULAN',
    status: 'ACTIVE',
    joinedAt: '2025-02-01T00:00:00Z',
    outlets: [],
  },
];

// Seed Partner Applications (for testing Territory Conflict & Approvals)
let partnerApplicationsData: PartnerApplication[] = [
  {
    id: 'APP-2026-001',
    applicantName: 'Dian Saputra',
    applicantPhone: '081399887766',
    proposedOutletName: 'Melatea Outlet Kerten Barat',
    proposedAddress: 'Jl. Slamet Riyadi No. 420, Kerten, Laweyan',
    latitude: -7.555,
    longitude: 110.795, // ~1.2 km from Manahan Solo!
    minimumRadiusKm: 3.0,
    feasibilityStatus: 'TIDAK_LAYAK',
    nearestOutletDistanceMeters: 1235,
    conflictingOutletIds: ['OUT-001'],
    workflowStatus: 'REVIEW',
    reviewerNotes: 'Lokasi berkonflik dalam radius 1.2 km dari Outlet Manahan (batas proteksi 3 km). Memerlukan relokasi lokasi mitra.',
    createdAt: '2026-10-25T08:30:00Z',
    updatedAt: '2026-10-25T09:15:00Z',
  },
  {
    id: 'APP-2026-002',
    applicantName: 'Wahyu Hidayat',
    applicantPhone: '085712349988',
    proposedOutletName: 'Melatea Outlet Bekonang Mojolaban',
    proposedAddress: 'Jl. Raya Bekonang No. 18, Cangkol, Mojolaban',
    latitude: -7.5912,
    longitude: 110.8845, // > 3.8 km from Palur!
    minimumRadiusKm: 3.0,
    feasibilityStatus: 'LAYAK',
    nearestOutletDistanceMeters: 3820,
    conflictingOutletIds: [],
    workflowStatus: 'LOCATION_CHECKED',
    reviewerNotes: 'Zonasi bersih, jarak terdekat 3.82 km ke Outlet Palur. Memenuhi syarat proteksi wilayah 3 km.',
    createdAt: '2026-10-26T10:00:00Z',
    updatedAt: '2026-10-26T10:15:00Z',
  },
  {
    id: 'APP-2026-003',
    applicantName: 'Eko Prasetyo',
    applicantPhone: '081288776655',
    proposedOutletName: 'Melatea Outlet Baturan Indah',
    proposedAddress: 'Jl. Adi Sumarmo No. 88, Baturan, Colomadu',
    latitude: -7.545,
    longitude: 110.781, // ~2.9 km from Manahan (close to 3 km boundary)
    minimumRadiusKm: 3.0,
    feasibilityStatus: 'PERLU_REVIEW',
    nearestOutletDistanceMeters: 2910,
    conflictingOutletIds: ['OUT-001'],
    workflowStatus: 'SUBMITTED',
    reviewerNotes: 'Jarak 2.91 km dari Manahan (sedikit di bawah batas 3 km, namun di atas batas 2.5 km jika dispensasi disetujui).',
    createdAt: '2026-10-26T11:45:00Z',
    updatedAt: '2026-10-26T11:45:00Z',
  },
];

// Synchronize Outlets into Partners
function syncPartnerOutlets() {
  partnersData.forEach((partner) => {
    partner.outlets = outletsData.filter((o) => o.partnerId === partner.id);
    // Calculate performance
    const partnerOrders = purchaseOrdersData.filter(
      (po) => po.partnerId === partner.id && po.orderStatus === 'COMPLETED'
    );
    const repeatOrders = partnerOrders.filter((po) => po.isRepeatOrder);
    const totalSpend = partnerOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    const totalOrders = partnerOrders.length;
    const repeatOrderCount = repeatOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

    const sortedOrders = [...partnerOrders].sort(
      (a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
    );

    const firstOrderAt = sortedOrders[0]?.orderDate;
    const lastOrderAt = sortedOrders[sortedOrders.length - 1]?.orderDate;

    let daysSinceLastOrder = 999;
    if (lastOrderAt) {
      const diffMs = Date.now() - new Date(lastOrderAt).getTime();
      daysSinceLastOrder = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Interval calculation
    let orderIntervalDays = 0;
    if (sortedOrders.length > 1) {
      const firstTime = new Date(sortedOrders[0].orderDate).getTime();
      const lastTime = new Date(sortedOrders[sortedOrders.length - 1].orderDate).getTime();
      const totalDays = (lastTime - firstTime) / (1000 * 60 * 60 * 24);
      orderIntervalDays = Math.round((totalDays / (sortedOrders.length - 1)) * 10) / 10;
    }

    // Dynamic scoring
    let performanceScore = 0;
    if (repeatOrderCount >= 10 && daysSinceLastOrder <= 20) {
      performanceScore = 95;
    } else if (repeatOrderCount >= 5 && daysSinceLastOrder <= 35) {
      performanceScore = 80;
    } else if (daysSinceLastOrder > 50 || repeatOrderCount === 0) {
      performanceScore = 40;
    } else {
      performanceScore = 65;
    }

    partner.performance = {
      partnerId: partner.id,
      totalSpend,
      totalOrders,
      repeatOrderCount,
      averageOrderValue,
      firstOrderAt,
      lastOrderAt,
      daysSinceLastOrder,
      orderIntervalDays,
      performanceScore,
      category: partner.tier,
    };
  });
}

// Initial sync
syncPartnerOutlets();

/**
 * Validate territory for proposed coordinates
 */
export function validateTerritoryLocation(
  lat: number,
  lng: number,
  radiusKm = 3.0,
  excludeOutletId?: string
): TerritoryValidationResult {
  const activeOutlets = outletsData.filter(
    (o) => o.status === 'ACTIVE' && (!excludeOutletId || o.id !== excludeOutletId)
  );

  const radiusMeters = radiusKm * 1000;
  const boundaryMarginMeters = 50; // 50m tolerance threshold for boundary checks

  const conflicts: { outlet: Outlet; distanceMeters: number; distanceKm: number }[] = [];
  let nearestDistanceMeters: number | null = null;

  for (const outlet of activeOutlets) {
    const dist = calculateGeodesicDistanceMeters(lat, lng, outlet.latitude, outlet.longitude);
    if (nearestDistanceMeters === null || dist < nearestDistanceMeters) {
      nearestDistanceMeters = dist;
    }

    // Explicit Rule: If distance >= radiusMeters, it is COMPLIANT (not conflict).
    // Exactly at 3.0 km (e.g. 3000m) is considered COMPLIANT.
    if (dist < radiusMeters) {
      conflicts.push({
        outlet,
        distanceMeters: dist,
        distanceKm: Math.round((dist / 1000) * 100) / 100,
      });
    }
  }

  // Sort conflicts by distance ascending
  conflicts.sort((a, b) => a.distanceMeters - b.distanceMeters);

  let feasibility: FeasibilityStatus = 'LAYAK';
  let recommendation = 'Lokasi memenuhi syarat proteksi wilayah. Tidak ada outlet aktif dalam radius proteksi.';
  const isExactBoundaryMatch =
    nearestDistanceMeters !== null && Math.abs(nearestDistanceMeters - radiusMeters) <= boundaryMarginMeters;

  if (conflicts.length > 0) {
    // If nearest is inside radius
    if (nearestDistanceMeters !== null && nearestDistanceMeters < radiusMeters - boundaryMarginMeters) {
      feasibility = 'TIDAK_LAYAK';
      recommendation = `Terdeteksi ${conflicts.length} outlet dalam radius ${radiusKm} km. Terdekat adalah "${conflicts[0].outlet.name}" (${conflicts[0].distanceKm} km). Diperlukan relokasi calon mitra.`;
    } else {
      // Exactly at the boundary margin
      feasibility = 'PERLU_REVIEW';
      recommendation = `Lokasi berada tepat di batas radius proteksi (${nearestDistanceMeters ? (nearestDistanceMeters / 1000).toFixed(2) : '-'} km dari "${conflicts[0].outlet.name}"). Memerlukan diskresi atau verifikasi fisik lapangan oleh tim operasional HQ.`;
    }
  } else if (nearestDistanceMeters !== null && nearestDistanceMeters <= radiusMeters + boundaryMarginMeters) {
    feasibility = 'PERLU_REVIEW';
    recommendation = `Lokasi berada sangat dekat dengan batas perimeter ${radiusKm} km (${(nearestDistanceMeters / 1000).toFixed(2)} km). Disarankan verifikasi titik presisi GPS sebelum persetujuan final.`;
  }

  return {
    targetLat: lat,
    targetLng: lng,
    radiusKm,
    feasibility,
    nearestDistanceMeters,
    nearestDistanceKm: nearestDistanceMeters !== null ? Math.round((nearestDistanceMeters / 1000) * 100) / 100 : null,
    conflictingOutlets: conflicts,
    recommendation,
    isExactBoundaryMatch,
    checkedAt: new Date().toISOString(),
  };
}

// Data Store Accessors
export const DataStore = {
  // Outlets
  getOutlets(): Outlet[] {
    return [...outletsData];
  },
  getOutletById(id: string): Outlet | undefined {
    return outletsData.find((o) => o.id === id);
  },
  createOutlet(outlet: Outlet): Outlet {
    outletsData.push(outlet);
    syncPartnerOutlets();
    return outlet;
  },

  // Partners
  getPartners(): Partner[] {
    syncPartnerOutlets();
    return [...partnersData];
  },
  getPartnerById(id: string): Partner | undefined {
    syncPartnerOutlets();
    return partnersData.find((p) => p.id === id);
  },
  createPartner(partner: Partner): Partner {
    partnersData.push(partner);
    syncPartnerOutlets();
    return partner;
  },

  // Purchase Orders
  getPurchaseOrders(): PurchaseOrder[] {
    return [...purchaseOrdersData];
  },
  getPurchasesByPartnerId(partnerId: string): PurchaseOrder[] {
    return purchaseOrdersData.filter((po) => po.partnerId === partnerId);
  },
  createPurchaseOrder(po: PurchaseOrder): PurchaseOrder {
    purchaseOrdersData.push(po);
    syncPartnerOutlets();
    return po;
  },

  // Applications
  getApplications(): PartnerApplication[] {
    return [...partnerApplicationsData];
  },
  getApplicationById(id: string): PartnerApplication | undefined {
    return partnerApplicationsData.find((a) => a.id === id);
  },
  createApplication(app: Omit<PartnerApplication, 'id' | 'createdAt' | 'updatedAt'>): PartnerApplication {
    const id = `APP-2026-${String(partnerApplicationsData.length + 1).padStart(3, '0')}`;
    const newApp: PartnerApplication = {
      ...app,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    partnerApplicationsData.unshift(newApp);
    return newApp;
  },
  approveApplication(id: string, reviewerName = 'Admin HQ', notes?: string): { success: boolean; application?: PartnerApplication; error?: string } {
    const app = partnerApplicationsData.find((a) => a.id === id);
    if (!app) {
      return { success: false, error: 'Pengajuan tidak ditemukan' };
    }

    // Re-validate territory check to eliminate race condition
    const check = validateTerritoryLocation(app.latitude, app.longitude, app.minimumRadiusKm);
    if (check.feasibility === 'TIDAK_LAYAK' && !notes?.includes('EXEMPTION_GRANTED')) {
      return {
        success: false,
        error: `Gagal menyetujui: Terjadi konflik wilayah dengan ${check.conflictingOutlets.length} outlet existing. Berikan catatan persetujuan dispensasi jika disengaja.`,
      };
    }

    app.workflowStatus = 'APPROVED';
    app.reviewedBy = reviewerName;
    app.reviewedAt = new Date().toISOString();
    if (notes) app.reviewerNotes = notes;
    app.updatedAt = new Date().toISOString();

    // Create partner if not existing
    let partnerId = app.partnerId;
    if (!partnerId) {
      partnerId = `PTR-${String(partnersData.length + 1).padStart(3, '0')}`;
      const newPartner: Partner = {
        id: partnerId,
        organizationId: 'ORG-MELATEA',
        ownerName: app.applicantName,
        email: `${app.applicantName.toLowerCase().replace(/\s+/g, '.')}@melatea-partner.id`,
        phone: app.applicantPhone,
        tier: 'REGULER',
        status: 'ACTIVE',
        joinedAt: new Date().toISOString(),
        outlets: [],
      };
      partnersData.push(newPartner);
    }

    // Convert into new Outlet
    const outletId = `OUT-${String(outletsData.length + 1).padStart(3, '0')}`;
    const newOutlet: Outlet = {
      id: outletId,
      partnerId,
      partnerName: app.applicantName,
      brandId: 'BRAND-MELATEA',
      name: app.proposedOutletName,
      address: app.proposedAddress,
      city: 'Surakarta',
      district: 'Kemitraan Baru',
      latitude: app.latitude,
      longitude: app.longitude,
      operationalDate: new Date().toISOString(),
      status: 'ACTIVE',
      repeatOrderCount: 0,
    };
    outletsData.push(newOutlet);

    syncPartnerOutlets();
    return { success: true, application: app };
  },

  // Map Settings
  getMapSettings(): MapSettingsConfig {
    return { ...mapSettings };
  },
  updateMapSettings(partial: Partial<MapSettingsConfig>): MapSettingsConfig {
    mapSettings = { ...mapSettings, ...partial };
    return { ...mapSettings };
  },

  // Overview Dashboard Statistics
  getOverviewDashboard(): DashboardOverviewData {
    syncPartnerOutlets();

    const totalPartners = partnersData.length;
    const totalOutlets = outletsData.length;
    const activePartners = partnersData.filter((p) => p.status === 'ACTIVE').length;
    const inactivePartners = partnersData.filter((p) => p.status === 'INACTIVE').length;
    const newPartnersThisMonth = partnersData.filter((p) => {
      const joinDate = new Date(p.joinedAt);
      const now = new Date();
      return joinDate.getFullYear() === now.getFullYear() && joinDate.getMonth() === now.getMonth();
    }).length;

    const completedOrders = purchaseOrdersData.filter((po) => po.orderStatus === 'COMPLETED');
    const totalB2BSpend = completedOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    const totalRepeatOrders = completedOrders.filter((po) => po.isRepeatOrder).length;

    const partnersNeedingFollowup = partnersData.filter(
      (p) => p.tier === 'PERLU_PERHATIAN' || (p.performance && p.performance.daysSinceLastOrder > 45)
    ).length;

    const monthlyTrends = [
      { month: 'Mei 2026', b2bSpend: 18500000, repeatOrdersCount: 22, newPartnersCount: 2 },
      { month: 'Jun 2026', b2bSpend: 21200000, repeatOrdersCount: 28, newPartnersCount: 1 },
      { month: 'Jul 2026', b2bSpend: 24800000, repeatOrdersCount: 34, newPartnersCount: 3 },
      { month: 'Agu 2026', b2bSpend: 23100000, repeatOrdersCount: 31, newPartnersCount: 1 },
      { month: 'Sep 2026', b2bSpend: 27900000, repeatOrdersCount: 40, newPartnersCount: 2 },
      { month: 'Okt 2026', b2bSpend: 31450000, repeatOrdersCount: 46, newPartnersCount: 3 },
    ];

    const partnerGrowth = [
      { period: 'Mei', totalPartners: 7, activePartners: 6 },
      { period: 'Jun', totalPartners: 8, activePartners: 7 },
      { period: 'Jul', totalPartners: 9, activePartners: 8 },
      { period: 'Agu', totalPartners: 9, activePartners: 8 },
      { period: 'Sep', totalPartners: 10, activePartners: 9 },
      { period: 'Okt', totalPartners: 10, activePartners: 9 },
    ];

    const regionalSpend = [
      { region: 'Surakarta (Solo)', outletCount: 4, totalSpend: 14850000 },
      { region: 'Sukoharjo', outletCount: 3, totalSpend: 11200000 },
      { region: 'Karanganyar', outletCount: 2, totalSpend: 6450000 },
      { region: 'Boyolali', outletCount: 1, totalSpend: 3800000 },
      { region: 'Klaten', outletCount: 1, totalSpend: 1200000 },
    ];

    const topPartners = partnersData
      .map((p) => ({
        partnerId: p.id,
        ownerName: p.ownerName,
        outletCount: p.outlets.length,
        tier: p.tier,
        totalSpend: p.performance?.totalSpend || 0,
        repeatOrderCount: p.performance?.repeatOrderCount || 0,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10);

    const statusDistribution = [
      { name: 'Aktif', count: activePartners, color: '#16A34A' },
      { name: 'Perlu Perhatian', count: partnersNeedingFollowup, color: '#D97706' },
      { name: 'Tidak Aktif', count: inactivePartners, color: '#DC2626' },
      { name: 'Pengajuan Baru', count: partnerApplicationsData.filter(a => a.workflowStatus !== 'APPROVED').length, color: '#2563EB' },
    ];

    const recentOrders = [...purchaseOrdersData]
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 6);

    const recentApplications = [...partnerApplicationsData].slice(0, 5);

    const partnersNeedingAttention = partnersData
      .filter((p) => p.tier === 'PERLU_PERHATIAN' || (p.performance && p.performance.daysSinceLastOrder > 45))
      .map((p) => ({
        partner: p,
        daysInactive: p.performance?.daysSinceLastOrder || 0,
        reason:
          (p.performance?.daysSinceLastOrder || 0) > 45
            ? `Belum repeat order dalam ${p.performance?.daysSinceLastOrder} hari`
            : 'Frekuensi repeat order rendah dibanding rata-rata mitra',
      }));

    return {
      kpis: {
        totalPartners,
        totalOutlets,
        activePartners,
        newPartnersThisMonth,
        inactivePartners,
        totalB2BSpend,
        totalRepeatOrders,
        partnersNeedingFollowup,
      },
      monthlyTrends,
      partnerGrowth,
      regionalSpend,
      topPartners,
      statusDistribution,
      recentOrders,
      recentApplications,
      partnersNeedingAttention,
    };
  },
};
