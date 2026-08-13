import type { CoffeeSpecies, ProcessingMethod, CertificationType } from "@prisma/client";
import type { ImportPreviewRow } from "../types";

// ─── Coffee Board CSV Row (parsed) ────────────────────────
// Columns from a Coffee Board of India directory export.
// All fields are nullable since CSV data is often incomplete.

export interface CoffeeBoardRow {
  rowNumber: number;

  // Identity
  estateName?: string;
  growerName?: string;
  coffeeBoardId?: string;
  registrationNumber?: string;
  growerType?: string;
  establishedYear?: number;

  // Location
  state?: string;
  district?: string;
  taluk?: string;
  village?: string;
  address?: string;
  postalCode?: string;

  // Contact
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Production
  totalAcreage?: number;
  coffeeAcreage?: number;
  annualProductionKg?: number;

  // Coffee
  primarySpecies?: CoffeeSpecies;
  processingMethods?: ProcessingMethod[];
  varietals?: string[];
  altitudeMinMeters?: number;
  altitudeMaxMeters?: number;

  // Commercial
  annualExportVolumeKg?: number;
  exportExperience?: boolean;
  existingExportMarkets?: string[];
  typicalLotSizeKg?: number;

  // Certifications
  certifications?: CertificationType[];

  // Raw data preservation
  _raw: Record<string, string>;
}

// ─── Import Preview Result ────────────────────────────────

export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  newGrowers: number;
  possibleMatches: number;
  duplicates: number;
  errorRows: number;
  rows: ImportPreviewRow[];
}

// ─── Import Row Result (per-row during actual import) ─────

export interface ImportRowResult {
  rowNumber: number;
  status: "created" | "updated" | "duplicate_flagged" | "error";
  growerId?: string;
  growerName?: string;
  errors: string[];
}

// ─── Match Result (from findMatchingGrower) ────────────────

export type MatchType = "high_confidence" | "possible_match" | "no_match";

export interface MatchResult {
  matchType: MatchType;
  matchedGrowerId?: string;
  matchedGrowerName?: string;
  confidence: number; // 0.0 – 1.0
  matchReasons: string[];
}

// ─── Duplicate Check Result ───────────────────────────────

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateGrowerId?: string;
  duplicateGrowerName?: string;
  confidence: number;
  matchFields: string[];
}
