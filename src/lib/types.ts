export type UserRole = 'ADMIN_HQ' | 'MITRA';
export type PartnerTier = 'UNGGULAN' | 'REGULER' | 'PERLU_PERHATIAN' | 'TIDAK_AKTIF';
export type PartnerStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type OutletStatus = 'ACTIVE' | 'ATTENTION' | 'INACTIVE' | 'CANDIDATE';
export type FeasibilityStatus = 'LAYAK' | 'TIDAK_LAYAK' | 'PERLU_REVIEW';
export type ApplicationWorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'LOCATION_CHECKED'
  | 'REVIEW'
  | 'APPROVED'
  | 'REJECTED';
export type OrderStatus = 'COMPLETED' | 'PROCESSING' | 'CANCELLED' | 'FAILED';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  partnerId?: string;
  tier?: PartnerTier;
}

export interface WholesaleProduct {
  sku: string;
  name: string;
  category: 'BAHAN_BAKU' | 'KEMASAN' | 'PERALATAN';
  unit: string;
  unitPrice: number;
  minOrderQty: number;
  description: string;
}

export type PosPaymentMethod = 'TUNAI' | 'QRIS' | 'TRANSFER';
export type PosMenuCategory = 'ORIGINAL_TEA' | 'FRUIT_TEA' | 'MILK_TEA' | 'TOPPING';
export type BookkeepingEntryType = 'INCOME' | 'EXPENSE';
export type BookkeepingCategory =
  | 'PENJUALAN_POS'
  | 'BAHAN_BAKU_LOKAL'
  | 'OPERASIONAL_GERAI'
  | 'GAJI_KARYAWAN'
  | 'LAINNYA';

export type StoreShiftStatus = 'OPEN' | 'CLOSED';

export interface StoreShift {
  id: string;
  partnerId: string;
  outletId: string;
  outletName: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  status: StoreShiftStatus;
  initialCash: number; // Kas modal awal di laci
  totalSalesCash: number; // Total penjualan tunai selama shift
  totalSalesQris: number; // Total penjualan QRIS selama shift
  totalSalesTransfer: number; // Total penjualan Transfer selama shift
  totalCupsSold: number;
  totalTransactionCount: number;
  totalExpensesCash: number; // Pengeluaran kas laci selama shift
  expectedCashInDrawer: number; // initialCash + totalSalesCash - totalExpensesCash
  actualCashInDrawer?: number; // Kas riil saat tutup toko
  cashDifference?: number; // actualCashInDrawer - expectedCashInDrawer (selisih lebih/kurang)
  notes?: string;
}

export interface PosMenuItem {
  code: string;
  name: string;
  category: PosMenuCategory;
  cupSize: '18oz' | '22oz' | 'ADDON';
  sellingPrice: number;
  estimatedCogs: number; // HPP per cup/porsi
}

export interface PosTransactionItem {
  id: string;
  transactionId: string;
  menuCode: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  unitCogs: number;
  subtotal: number;
  subtotalCogs: number;
}

export interface PosTransaction {
  id: string;
  shiftId?: string;
  partnerId: string;
  outletId: string;
  outletName: string;
  cashierName: string;
  customerName?: string;
  paymentMethod: PosPaymentMethod;
  totalCups: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  estimatedCost: number;
  grossProfit: number;
  amountPaid: number;
  changeAmount: number;
  notes?: string;
  createdAt: string;
  items: PosTransactionItem[];
}

export interface BookkeepingEntry {
  id: string;
  partnerId: string;
  outletId: string;
  outletName: string;
  entryDate: string;
  type: BookkeepingEntryType;
  category: BookkeepingCategory;
  description: string;
  amount: number;
  paymentMethod: PosPaymentMethod;
  referenceId?: string;
}

export interface MitraBookkeepingSummary {
  totalTransactions: number;
  totalCupsSold: number;
  totalRevenue: number;
  totalEstimatedCogs: number;
  totalGrossProfit: number;
  totalOperationalExpenses: number;
  totalManualIncome: number;
  totalB2BWholesaleSpend: number;
  netOperatingProfit: number;
  paymentBreakdown: {
    TUNAI: number;
    QRIS: number;
    TRANSFER: number;
  };
}

export interface MitraPosAndBookkeepingData {
  partner: Partner;
  outlets: Outlet[];
  currentShift: StoreShift | null;
  shiftHistory: StoreShift[];
  menuItems: PosMenuItem[];
  transactions: PosTransaction[];
  bookkeepingEntries: BookkeepingEntry[];
  summary: MitraBookkeepingSummary;
}

export interface MitraDashboardData {
  partner: Partner;
  outlets: Outlet[];
  purchases: PurchaseOrder[];
  applications: PartnerApplication[];
  catalog: WholesaleProduct[];
  posSummary?: MitraBookkeepingSummary;
}

export interface PurchaseOrderItem {
  id: string;
  orderId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  partnerId: string;
  partnerName?: string;
  outletId?: string;
  outletName?: string;
  orderDate: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  isFirstOrder: boolean;
  isRepeatOrder: boolean;
  notes?: string;
  items: PurchaseOrderItem[];
}

export interface PartnerPerformance {
  partnerId: string;
  totalSpend: number; // Lifetime spend (HQ to Partner wholesale)
  totalOrders: number;
  repeatOrderCount: number; // Repeat orders excluding initial franchise kit
  averageOrderValue: number;
  firstOrderAt?: string;
  lastOrderAt?: string;
  daysSinceLastOrder: number;
  orderIntervalDays: number;
  performanceScore: number; // 0 - 100
  category: PartnerTier;
}

export interface Outlet {
  id: string;
  partnerId: string;
  partnerName?: string;
  brandId: string;
  name: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  operationalDate: string;
  status: OutletStatus;
  lastOrderDate?: string;
  repeatOrderCount?: number;
}

export interface Partner {
  id: string;
  organizationId: string;
  ownerName: string;
  email: string;
  phone: string;
  identityNumber?: string;
  tier: PartnerTier;
  status: PartnerStatus;
  joinedAt: string;
  outlets: Outlet[];
  performance?: PartnerPerformance;
}

export interface ConflictingOutletInfo {
  outlet: Outlet;
  distanceMeters: number;
  distanceKm: number;
}

export interface TerritoryValidationResult {
  targetLat: number;
  targetLng: number;
  radiusKm: number;
  feasibility: FeasibilityStatus;
  nearestDistanceMeters: number | null;
  nearestDistanceKm: number | null;
  conflictingOutlets: ConflictingOutletInfo[];
  recommendation: string;
  isExactBoundaryMatch: boolean;
  checkedAt: string;
}

export interface PartnerApplication {
  id: string;
  partnerId?: string;
  applicantName: string;
  applicantPhone: string;
  proposedOutletName: string;
  proposedAddress: string;
  latitude: number;
  longitude: number;
  minimumRadiusKm: number;
  feasibilityStatus: FeasibilityStatus;
  nearestOutletDistanceMeters?: number | null;
  conflictingOutletIds: string[];
  conflictsDetail?: ConflictingOutletInfo[];
  workflowStatus: ApplicationWorkflowStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyTrend {
  month: string;
  b2bSpend: number;
  repeatOrdersCount: number;
  newPartnersCount: number;
}

export interface RegionalSpend {
  region: string;
  outletCount: number;
  totalSpend: number;
}

export interface PartnerGrowth {
  period: string;
  totalPartners: number;
  activePartners: number;
}

export interface StatusDistribution {
  name: string;
  count: number;
  color: string;
}

export interface DashboardOverviewData {
  kpis: {
    totalPartners: number;
    totalOutlets: number;
    activePartners: number;
    newPartnersThisMonth: number;
    inactivePartners: number;
    totalB2BSpend: number;
    totalRepeatOrders: number;
    partnersNeedingFollowup: number;
  };
  monthlyTrends: MonthlyTrend[];
  partnerGrowth: PartnerGrowth[];
  regionalSpend: RegionalSpend[];
  topPartners: {
    partnerId: string;
    ownerName: string;
    outletCount: number;
    tier: PartnerTier;
    totalSpend: number;
    repeatOrderCount: number;
  }[];
  statusDistribution: StatusDistribution[];
  recentOrders: PurchaseOrder[];
  recentApplications: PartnerApplication[];
  partnersNeedingAttention: {
    partner: Partner;
    daysInactive: number;
    reason: string;
  }[];
}

export interface MapSettingsConfig {
  mapProvider: string;
  mapStyleUrl: string;
  defaultLat: number;
  defaultLng: number;
  defaultZoom: number;
  defaultRadiusKm: number;
  enableClustering: boolean;
  geocodingProvider: string;
  geocodingDailyBudget: number;
  geocodingCreditsUsed: number;
  isGeocodingKeyConfigured: boolean;
}
