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
