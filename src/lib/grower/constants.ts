import type {
  CoffeeSpecies,
  ProcessingMethod,
  CertificationType,
  GrowerRelationshipStatus,
  GrowerType,
  DataSourceType,
  OverallVerificationStatus,
  LotStatus,
  ClaimStatus,
  VerificationCategory,
  GrowerVisibility,
  BoardRegistrationStatus,
  OutreachType,
  OutreachStatus,
  PriceBasis,
} from "@prisma/client";

// ─── Indian Coffee States ──────────────────────────────────
// States in India with significant coffee production.

export const INDIAN_COFFEE_STATES: string[] = [
  "Karnataka",
  "Kerala",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Odisha",
  "Assam",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Tripura",
  "Arunachal Pradesh",
] as const;

// ─── Coffee Species Labels ─────────────────────────────────

export const COFFEE_SPECIES_LABELS: Record<CoffeeSpecies, string> = {
  ARABICA: "Arabica",
  ROBUSTA: "Robusta",
  LIBERICA: "Liberica",
  EXCELSA: "Excelsa",
};

// ─── Processing Method Labels ──────────────────────────────

export const PROCESSING_METHOD_LABELS: Record<ProcessingMethod, string> = {
  WASHED: "Washed",
  NATURAL: "Natural",
  HONEY: "Honey",
  SEMI_WASHED: "Semi-Washed",
  PULPED_NATURAL: "Pulped Natural",
  WET_HULLING: "Wet-Hulling",
  ANAEROBIC: "Anaerobic",
  CARBONIC_MACERATION: "Carbonic Maceration",
  EXPERIMENTAL: "Experimental",
};

// ─── Certification Type Labels ─────────────────────────────

export const CERTIFICATION_TYPE_LABELS: Record<CertificationType, string> = {
  ORGANIC: "Organic",
  FAIRTRADE: "Fairtrade",
  RAINFOREST_ALLIANCE: "Rainforest Alliance",
  UTZ: "UTZ",
  BIRD_FRIENDLY: "Bird Friendly",
  CAFE_PRACTICES: "Cafe Practices",
  FOUR_C: "4C",
  NOP_USDA: "NOP (USDA)",
  EU_ORGANIC: "EU Organic",
  JAS_ORGANIC: "JAS Organic",
  COR: "COR",
  CODEX: "Codex",
  NONE_KNOWN: "None Known",
};

// ─── Grower Relationship Status Labels (all 17) ───────────

export const GROWER_RELATIONSHIP_STATUS_LABELS: Record<
  GrowerRelationshipStatus,
  string
> = {
  DISCOVERED: "Discovered",
  IDENTIFIED: "Identified",
  CONTACTED: "Contacted",
  RESPONDED: "Responded",
  INTERESTED: "Interested",
  INFORMATION_REQUESTED: "Information Requested",
  APPLICATION_STARTED: "Application Started",
  APPLICATION_RECEIVED: "Application Received",
  UNDER_VERIFICATION: "Under Verification",
  VERIFIED: "Verified",
  SAMPLE_REQUESTED: "Sample Requested",
  SAMPLE_RECEIVED: "Sample Received",
  CUPPING: "Cupping",
  QUALIFIED: "Qualified",
  ACTIVE_GROWER: "Active Grower",
  DORMANT: "Dormant",
  REJECTED: "Rejected",
};

// ─── Grower Type Labels ────────────────────────────────────

export const GROWER_TYPE_LABELS: Record<GrowerType, string> = {
  INDIVIDUAL: "Individual",
  ESTATE: "Estate",
  COOPERATIVE: "Cooperative",
  PRODUCER_GROUP: "Producer Group",
  PROCESSOR: "Processor",
  EXPORTER: "Exporter",
  GROWER_EXPORTER: "Grower-Exporter",
};

// ─── Data Source Type Labels ───────────────────────────────

export const DATA_SOURCE_TYPE_LABELS: Record<DataSourceType, string> = {
  COFFEE_BOARD_INDIA: "Coffee Board of India",
  GOVERNMENT_DIRECTORY: "Government Directory",
  COOPERATIVE: "Cooperative Records",
  ESTATE_WEBSITE: "Estate Website",
  INDUSTRY_ASSOCIATION: "Industry Association",
  REFERRAL: "Referral",
  TRADE_EVENT: "Trade Event",
  DIRECT_OUTREACH: "Direct Outreach",
  GROWER_APPLICATION: "Grower Application",
  EXPORTER: "Exporter",
  FIELD_VISIT: "Field Visit",
  OTHER: "Other",
};

// ─── Verification Labels ───────────────────────────────────

export const VERIFICATION_LABELS: Record<OverallVerificationStatus, string> = {
  UNVERIFIED: "Unverified",
  PARTIALLY_VERIFIED: "Partially Verified",
  VERIFIED: "Verified",
  VERIFICATION_EXPIRED: "Verification Expired",
  SUSPENDED: "Suspended",
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  NOT_REVIEWED: "Not Reviewed",
  CLAIMED: "Claimed",
  DOCUMENTED: "Documented",
  VERIFIED: "Verified",
  FAILED: "Failed",
  EXPIRED: "Expired",
};

export const VERIFICATION_CATEGORY_LABELS: Record<VerificationCategory, string> = {
  IDENTITY: "Identity",
  LOCATION: "Location",
  PRODUCTION: "Production",
  COFFEE: "Coffee",
  QUALITY: "Quality",
  CERTIFICATION: "Certification",
  EXPORT_READINESS: "Export Readiness",
  TRACEABILITY: "Traceability",
  COMMERCIAL: "Commercial",
};

// ─── Lot Status Labels ─────────────────────────────────────

export const LOT_STATUS_LABELS: Record<LotStatus, string> = {
  DRAFT: "Draft",
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SAMPLE_REQUESTED: "Sample Requested",
  SAMPLE_SENT: "Sample Sent",
  CUPPING: "Cupping",
  SOLD: "Sold",
  EXHAUSTED: "Exhausted",
  ARCHIVED: "Archived",
};

// ─── Visibility Labels ─────────────────────────────────────

export const GROWER_VISIBILITY_LABELS: Record<GrowerVisibility, string> = {
  INTERNAL_ONLY: "Internal Only",
  APPROVED_ROASTERS_ONLY: "Approved Roasters",
  SELECTED_ROASTERS: "Selected Roasters",
  PUBLIC_PROFILE: "Public Profile",
};

// ─── Board Registration Labels ─────────────────────────────

export const BOARD_REGISTRATION_LABELS: Record<BoardRegistrationStatus, string> = {
  REGISTERED: "Registered",
  UNREGISTERED: "Unregistered",
  EXEMPT: "Exempt",
  UNKNOWN: "Unknown",
};

// ─── Outreach Labels ───────────────────────────────────────

export const OUTREACH_TYPE_LABELS: Record<OutreachType, string> = {
  EMAIL: "Email",
  PHONE_CALL: "Phone Call",
  WHATSAPP: "WhatsApp",
  IN_PERSON_MEETING: "In-Person Meeting",
  VIDEO_CALL: "Video Call",
  TRADE_EVENT: "Trade Event",
  OTHER: "Other",
};

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  NO_RESPONSE: "No Response",
  REJECTED: "Rejected",
  INTERESTED: "Interested",
  FOLLOW_UP_REQUIRED: "Follow-Up Required",
};

// ─── Price Basis Labels ────────────────────────────────────

export const PRICE_BASIS_LABELS: Record<PriceBasis, string> = {
  FOB_ORIGIN: "FOB Origin",
  CIF_PORT: "CIF Port",
  EXW: "EXW",
  DDP: "DDP",
  OTHER: "Other",
};

// ─── Pipeline Stages (for ops dashboard funnel) ───────────
// Ordered from top-of-funnel to bottom.

export interface PipelineStage {
  statuses: GrowerRelationshipStatus[];
  label: string;
  color: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    statuses: ["DISCOVERED", "IDENTIFIED"],
    label: "Discovery",
    color: "#94a3b8", // slate-400
  },
  {
    statuses: ["CONTACTED", "RESPONDED", "INTERESTED"],
    label: "Engagement",
    color: "#38bdf8", // sky-400
  },
  {
    statuses: [
      "INFORMATION_REQUESTED",
      "APPLICATION_STARTED",
      "APPLICATION_RECEIVED",
    ],
    label: "Application",
    color: "#c9a84c", // lotus gold
  },
  {
    statuses: ["UNDER_VERIFICATION", "VERIFIED"],
    label: "Verification",
    color: "#1a3c2e", // forest green
  },
  {
    statuses: ["SAMPLE_REQUESTED", "SAMPLE_RECEIVED", "CUPPING"],
    label: "Sampling",
    color: "#a78bfa", // violet-400
  },
  {
    statuses: ["QUALIFIED"],
    label: "Qualified",
    color: "#34d399", // emerald-400
  },
  {
    statuses: ["ACTIVE_GROWER"],
    label: "Active",
    color: "#1a3c2e", // forest green
  },
  {
    statuses: ["DORMANT", "REJECTED"],
    label: "Inactive",
    color: "#6b7280", // gray-500
  },
];

// ─── Readiness weights ──────────────────────────────────────

export const READINESS_WEIGHTS = {
  profile: 0.25,
  verification: 0.20,
  documentation: 0.15,
  lot: 0.20,
  sample: 0.10,
  export: 0.10,
} as const;

// ─── Pagination defaults ────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
