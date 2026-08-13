import type {
  Grower as PrismaGrower,
  GrowerRelationshipStatus,
  GrowerType,
  DataSourceType,
  OverallVerificationStatus,
  GrowerVisibility,
  CoffeeSpecies,
  ProcessingMethod,
  LotStatus,
} from "@prisma/client";

// ─── PII Field Registry ─────────────────────────────────────
// Fields on the Grower model that contain personally-identifiable
// information and must NEVER be sent to roasters or the public.

export const PII_FIELDS: readonly string[] = [
  "contactName",
  "contactEmail",
  "contactPhone",
  "contactMethod",
  "languages",
  "taxId",
  "coffeeBoardId",
  "registrationNumber",
  "address",
  "postalCode",
  "internalNotes",
  "opsFlags",
  "aiAssistedFields",
  "aiConfidenceScore",
] as const;

// ─── Sanitized Grower (for roaster API) ──────────────────────
// PII-stripped version safe for roaster-facing endpoints.

export interface SanitizedGrower {
  id: string;
  displayName: string;
  growerType: GrowerType;
  country: string;
  state: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  primarySpecies: CoffeeSpecies | null;
  processingMethods: string[] | null;
  altitudeMinMeters: number | null;
  altitudeMaxMeters: number | null;
  typicalCupScore: number | null;
  sampleAvailability: boolean;
  traceabilityCapability: boolean;
  typicalLotSizeKg: number | null;
  minLotSizeKg: number | null;
  exportExperience: boolean;
  certifications: SanitizedCertification[];
  growerStory: string | null;
  buyerVisibleDescription: string | null;
  verificationStatus: OverallVerificationStatus;
  visibility: GrowerVisibility;
  establishedYear: number | null;
  lotCount: number;
  lotCodes: string[];
  createdAt: Date;
}

export interface SanitizedCertification {
  certificationType: string;
  certifyingBody: string | null;
  status: string;
  expiryDate: Date | null;
}

// ─── Grower Detail Response (full, for ops) ─────────────────

export interface GrowerDetailResponse extends PrismaGrower {
  _readiness?: GrowerReadiness;
  _estateCount?: number;
  _lotCount?: number;
  _outstandingOutreach?: number;
}

// ─── Grower List Response (paginated) ───────────────────────

export interface GrowerListResponse {
  growers: GrowerListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface GrowerListItem {
  id: string;
  displayName: string;
  growerType: GrowerType;
  relationshipStatus: GrowerRelationshipStatus;
  verificationStatus: OverallVerificationStatus;
  visibility: GrowerVisibility;
  state: string | null;
  primarySpecies: CoffeeSpecies | null;
  typicalCupScore: number | null;
  lastContactDate: Date | null;
  nextAction: string | null;
  nextActionDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Grower Filters ─────────────────────────────────────────

export interface GrowerFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  relationshipStatus?: GrowerRelationshipStatus | GrowerRelationshipStatus[];
  verificationStatus?: OverallVerificationStatus | OverallVerificationStatus[];
  growerType?: GrowerType | GrowerType[];
  state?: string | string[];
  primarySpecies?: CoffeeSpecies | CoffeeSpecies[];
  visibility?: GrowerVisibility | GrowerVisibility[];
  dataSourceType?: DataSourceType;
  hasSample?: boolean;
  exportReady?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Grower Readiness ───────────────────────────────────────

export interface GrowerReadiness {
  profile: ReadinessDimension;
  verification: ReadinessDimension;
  documentation: ReadinessDimension;
  lot: ReadinessDimension;
  sample: ReadinessDimension;
  export: ReadinessDimension;
  overall: number; // 0–100 weighted average
}

export interface ReadinessDimension {
  score: number; // 0–100
  label: string;
  items: ReadinessItem[];
}

export interface ReadinessItem {
  field: string;
  label: string;
  complete: boolean;
}

// ─── Coffee Lot Public (sanitized for roasters) ─────────────

export interface CoffeeLotPublic {
  id: string;
  lotCode: string | null;
  cropYear: number | null;
  species: CoffeeSpecies | null;
  variety: string | null;
  process: ProcessingMethod | null;
  grade: string | null;
  altitudeMinMeters: number | null;
  altitudeMaxMeters: number | null;
  quantityKg: number | null;
  moqKg: number | null;
  moistureContent: number | null;
  waterActivity: number | null;
  cupScore: number | null;
  tastingNotes: string | null;
  indicativePriceUsdKg: number | null;
  priceBasis: string | null;
  packagingDescription: string | null;
  certifications: string[] | null;
  sampleAvailable: boolean;
  exportReady: boolean;
  growerId: string;
  growerDisplayName: string;
  state: string | null;
  status: LotStatus;
  createdAt: Date;
}

// ─── Import Types ───────────────────────────────────────────

export interface ImportPreview {
  totalRows: number;
  newGrowers: number;
  possibleMatches: number;
  duplicates: number;
  errors: number;
  rows: ImportPreviewRow[];
}

export interface ImportPreviewRow {
  rowNumber: number;
  displayName: string;
  state: string | null;
  matchType: "new" | "possible_match" | "duplicate";
  matchedGrowerId?: string;
  matchedGrowerName?: string;
  confidence?: number;
  errors: string[];
}

export interface ImportResult {
  batchId: string;
  totalRows: number;
  created: number;
  updated: number;
  duplicatesFlagged: number;
  errors: number;
}

export interface ReconciliationReport {
  batchId: string;
  sourceType: DataSourceType;
  totalRows: number;
  reconciled: number;
  unreconciled: number;
  conflicts: ReconciliationConflict[];
  generatedAt: Date;
}

export interface ReconciliationConflict {
  growerId: string;
  growerName: string;
  field: string;
  currentValue: string;
  newValue: string;
  sourceName: string;
}

// ─── Helper: pick non-PII fields from a grower ─────────────

export type GrowerNonPiiKeys = Exclude<
  keyof PrismaGrower,
  (typeof PII_FIELDS)[number] | "provenanceRecords" | "certifications" | "evidenceRecords" | "notes" | "estates" | "coffeeLots" | "outreach" | "verificationCategories" | "importRecords" | "auditEvents" | "relationshipOwner" | "lastVerifiedBy" | "createdBy" | "updatedBy"
>;
