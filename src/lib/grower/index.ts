// ─── Grower Lib — Barrel Export ─────────────────────────
// Public API for the grower domain library.
// Import from '@/lib/grower' instead of individual files.

// Types
export type {
  SanitizedGrower,
  SanitizedCertification,
  GrowerDetailResponse,
  GrowerListResponse,
  GrowerListItem,
  GrowerFilters,
  GrowerReadiness,
  ReadinessDimension,
  ReadinessItem,
  CoffeeLotPublic,
  ImportPreview,
  ImportPreviewRow,
  ImportResult,
  ReconciliationReport,
  ReconciliationConflict,
  GrowerNonPiiKeys,
} from "./types";

export { PII_FIELDS } from "./types";

// Constants
export {
  INDIAN_COFFEE_STATES,
  COFFEE_SPECIES_LABELS,
  PROCESSING_METHOD_LABELS,
  CERTIFICATION_TYPE_LABELS,
  GROWER_RELATIONSHIP_STATUS_LABELS,
  GROWER_TYPE_LABELS,
  DATA_SOURCE_TYPE_LABELS,
  VERIFICATION_LABELS,
  CLAIM_STATUS_LABELS,
  VERIFICATION_CATEGORY_LABELS,
  LOT_STATUS_LABELS,
  GROWER_VISIBILITY_LABELS,
  BOARD_REGISTRATION_LABELS,
  OUTREACH_TYPE_LABELS,
  OUTREACH_STATUS_LABELS,
  PRICE_BASIS_LABELS,
  PIPELINE_STAGES,
  READINESS_WEIGHTS,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "./constants";

export type { PipelineStage } from "./constants";

// Sanitize
export {
  sanitizeGrowerForPublic,
  sanitizeGrowerList,
  sanitizeLotForPublic,
  isPiiField,
  stripPiiFromObject,
} from "./sanitize";

// Provenance
export {
  createProvenanceForField,
  createProvenanceForImport,
  getFieldProvenance,
  getGrowerProvenance,
  bulkCreateProvenanceForImport,
} from "./provenance";

// Import Pipeline
export {
  parseCsv,
  validateImportRow,
  findMatchingGrower,
  previewImport,
} from "./import";

export type {
  CoffeeBoardRow,
  ImportPreviewResult,
  ImportRowResult,
  MatchResult,
  MatchType,
  DuplicateCheckResult,
} from "./import";
