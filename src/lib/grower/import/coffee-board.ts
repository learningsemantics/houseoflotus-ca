import { db } from "@/lib/db";
import { INDIAN_COFFEE_STATES } from "../constants";
import type { CoffeeBoardRow, ImportPreviewResult, MatchResult } from "./types";
import type { CoffeeSpecies, ProcessingMethod, CertificationType } from "@prisma/client";

// ─── Column Mapping ───────────────────────────────────────
// Maps human-readable CSV headers (case-insensitive, flexible)
// to our internal CoffeeBoardRow fields.

const COLUMN_ALIASES: Record<string, keyof CoffeeBoardRow> = {
  // Identity
  "estate name": "estateName",
  "estate_name": "estateName",
  "name": "estateName",
  "grower name": "growerName",
  "grower_name": "growerName",
  "owner name": "growerName",
  "owner_name": "growerName",
  "coffee board id": "coffeeBoardId",
  "coffee_board_id": "coffeeBoardId",
  "cbi id": "coffeeBoardId",
  "registration no": "registrationNumber",
  "registration_no": "registrationNumber",
  "registration number": "registrationNumber",
  "registration_number": "registrationNumber",
  "reg no": "registrationNumber",
  "grower type": "growerType",
  "grower_type": "growerType",
  "type": "growerType",
  "category": "growerType",
  "established year": "establishedYear",
  "established_year": "establishedYear",
  "year established": "establishedYear",
  "year_established": "establishedYear",

  // Location
  state: "state",
  district: "district",
  taluk: "taluk",
  village: "village",
  address: "address",
  "postal code": "postalCode",
  "postal_code": "postalCode",
  pincode: "postalCode",
  pin: "postalCode",

  // Contact
  "contact name": "contactName",
  "contact_name": "contactName",
  "contact person": "contactName",
  "contact_person": "contactName",
  email: "contactEmail",
  "contact email": "contactEmail",
  "contact_email": "contactEmail",
  phone: "contactPhone",
  "contact phone": "contactPhone",
  "contact_phone": "contactPhone",
  telephone: "contactPhone",
  mobile: "contactPhone",

  // Production
  "total acreage": "totalAcreage",
  "total_acreage": "totalAcreage",
  "total area": "totalAcreage",
  "total_area": "totalAcreage",
  "coffee acreage": "coffeeAcreage",
  "coffee_acreage": "coffeeAcreage",
  "coffee area": "coffeeAcreage",
  "coffee_area": "coffeeAcreage",
  "annual production (kg)": "annualProductionKg",
  "annual_production_kg": "annualProductionKg",
  "annual production": "annualProductionKg",
  "annual_production": "annualProductionKg",
  production: "annualProductionKg",

  // Coffee
  species: "primarySpecies",
  "primary species": "primarySpecies",
  "primary_species": "primarySpecies",
  "coffee species": "primarySpecies",
  "coffee_species": "primarySpecies",
  "processing methods": "processingMethods",
  "processing_methods": "processingMethods",
  process: "processingMethods",
  varietals: "varietals",
  varieties: "varietals",
  "altitude min (m)": "altitudeMinMeters",
  "altitude_min_meters": "altitudeMinMeters",
  "altitude min": "altitudeMinMeters",
  "altitude max (m)": "altitudeMaxMeters",
  "altitude_max_meters": "altitudeMaxMeters",
  "altitude max": "altitudeMaxMeters",

  // Commercial
  "export volume (kg)": "annualExportVolumeKg",
  "export_volume_kg": "annualExportVolumeKg",
  "export volume": "annualExportVolumeKg",
  "export_experience": "exportExperience",
  "export experience": "exportExperience",
  "export markets": "existingExportMarkets",
  "export_markets": "existingExportMarkets",
  "typical lot size (kg)": "typicalLotSizeKg",
  "typical_lot_size_kg": "typicalLotSizeKg",
  "lot size": "typicalLotSizeKg",

  // Certifications
  certifications: "certifications",
  "certification type": "certifications",
  "certification_type": "certifications",
};

// ─── Species normalization ────────────────────────────────

const SPECIES_MAP: Record<string, CoffeeSpecies> = {
  arabica: "ARABICA",
  robusta: "ROBUSTA",
  liberica: "LIBERICA",
  excelsa: "EXCELSA",
};

const PROCESSING_MAP: Record<string, ProcessingMethod> = {
  washed: "WASHED",
  natural: "NATURAL",
  dry: "NATURAL",
  honey: "HONEY",
  "semi-washed": "SEMI_WASHED",
  semiwashed: "SEMI_WASHED",
  "pulled natural": "PULPED_NATURAL",
  "pulp natural": "PULPED_NATURAL",
  pulpednatural: "PULPED_NATURAL",
  "wet-hulling": "WET_HULLING",
  wethulling: "WET_HULLING",
  anaerobic: "ANAEROBIC",
  "carbonic maceration": "CARBONIC_MACERATION",
  carbonicmaceration: "CARBONIC_MACERATION",
  experimental: "EXPERIMENTAL",
};

const CERT_MAP: Record<string, CertificationType> = {
  organic: "ORGANIC",
  fairtrade: "FAIRTRADE",
  "fair trade": "FAIRTRADE",
  "rainforest alliance": "RAINFOREST_ALLIANCE",
  utz: "UTZ",
  "bird friendly": "BIRD_FRIENDLY",
  "cafe practices": "CAFE_PRACTICES",
  "4c": "FOUR_C",
  "nop usda": "NOP_USDA",
  usda: "NOP_USDA",
  "eu organic": "EU_ORGANIC",
  "jas organic": "JAS_ORGANIC",
  cor: "COR",
  codex: "CODEX",
};

// ─── Parse Helpers ─────────────────────────────────────────

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[^\d.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase().trim();
  if (["yes", "y", "true", "1"].includes(lower)) return true;
  if (["no", "n", "false", "0"].includes(lower)) return false;
  return undefined;
}

function parseStringArray(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(/[;,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function parseSpecies(value: string | undefined): CoffeeSpecies | undefined {
  if (!value) return undefined;
  const key = value.toLowerCase().trim();
  return SPECIES_MAP[key];
}

function parseProcessingMethods(
  value: string | undefined
): ProcessingMethod[] | undefined {
  if (!value) return undefined;
  const parts = value.split(/[;,|]/).map((s) => s.trim().toLowerCase());
  const methods: ProcessingMethod[] = [];
  for (const p of parts) {
    const mapped = PROCESSING_MAP[p];
    if (mapped) methods.push(mapped);
  }
  return methods.length > 0 ? methods : undefined;
}

function parseCertifications(
  value: string | undefined
): CertificationType[] | undefined {
  if (!value) return undefined;
  const parts = value.split(/[;,|]/).map((s) => s.trim().toLowerCase());
  const certs: CertificationType[] = [];
  for (const p of parts) {
    const mapped = CERT_MAP[p];
    if (mapped) certs.push(mapped);
  }
  return certs.length > 0 ? certs : undefined;
}

// ─── parseCsv ─────────────────────────────────────────────
/**
 * Parse a CSV string (from Coffee Board of India export)
 * into an array of CoffeeBoardRow objects.
 *
 * Handles:
 * - Header normalization (case-insensitive, flexible aliases)
 * - Comma, semicolon, and tab delimiters (auto-detected)
 * - Quoted fields with embedded delimiters
 * - BOM removal
 */

export function parseCsv(csvContent: string): CoffeeBoardRow[] {
  // Remove BOM if present
  const cleaned = csvContent.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];

  // Detect delimiter
  const firstLine = cleaned.split("\n")[0];
  const delimiter =
    firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

  const lines = cleaned.split("\n");
  if (lines.length < 2) return []; // Need at least header + 1 data row

  // Parse header
  const headers = splitCsvLine(lines[0], delimiter).map((h) =>
    h.trim().toLowerCase()
  );

  // Map headers to known fields
  const headerMap = headers.map((h) => COLUMN_ALIASES[h]);

  const rows: CoffeeBoardRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitCsvLine(line, delimiter);
    const raw: Record<string, string> = {};
    const row: CoffeeBoardRow = { rowNumber: i, _raw: raw };

    for (let j = 0; j < headers.length; j++) {
      const value = values[j]?.trim() ?? "";
      raw[headers[j]] = value;

      const field = headerMap[j];
      if (!field) continue;

      switch (field) {
        case "estateName":
        case "growerName":
        case "coffeeBoardId":
        case "registrationNumber":
        case "growerType":
        case "state":
        case "district":
        case "taluk":
        case "village":
        case "address":
        case "postalCode":
        case "contactName":
        case "contactEmail":
        case "contactPhone":
          (row as Record<string, unknown>)[field] = value || undefined;
          break;

        case "establishedYear":
          row.establishedYear = parseNumber(value);
          break;

        case "totalAcreage":
          row.totalAcreage = parseNumber(value);
          break;

        case "coffeeAcreage":
          row.coffeeAcreage = parseNumber(value);
          break;

        case "annualProductionKg":
          row.annualProductionKg = parseNumber(value);
          break;

        case "altitudeMinMeters":
          row.altitudeMinMeters = parseNumber(value);
          break;

        case "altitudeMaxMeters":
          row.altitudeMaxMeters = parseNumber(value);
          break;

        case "annualExportVolumeKg":
          row.annualExportVolumeKg = parseNumber(value);
          break;

        case "typicalLotSizeKg":
          row.typicalLotSizeKg = parseNumber(value);
          break;

        case "exportExperience":
          row.exportExperience = parseBoolean(value);
          break;

        case "primarySpecies":
          row.primarySpecies = parseSpecies(value);
          break;

        case "processingMethods":
          row.processingMethods = parseProcessingMethods(value);
          break;

        case "varietals":
          row.varietals = parseStringArray(value);
          break;

        case "existingExportMarkets":
          row.existingExportMarkets = parseStringArray(value);
          break;

        case "certifications":
          row.certifications = parseCertifications(value);
          break;
      }
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Split a single CSV line respecting quoted fields.
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }

  result.push(current);
  return result;
}

// ─── validateImportRow ─────────────────────────────────────
/**
 * Validate a parsed CoffeeBoardRow and return errors.
 * A row is valid if it has at least a name or Coffee Board ID.
 */

export function validateImportRow(
  row: CoffeeBoardRow
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row.estateName && !row.growerName && !row.coffeeBoardId) {
    errors.push(
      "Row must have at least an estate name, grower name, or Coffee Board ID"
    );
  }

  // Validate state if provided
  if (row.state) {
    const normalized = row.state.trim().toLowerCase();
    const validState = INDIAN_COFFEE_STATES.some(
      (s) => s.toLowerCase() === normalized
    );
    if (!validState) {
      errors.push(
        `State "${row.state}" is not a recognized Indian coffee-producing state`
      );
    }
  }

  // Validate altitude range
  if (
    row.altitudeMinMeters !== undefined &&
    row.altitudeMaxMeters !== undefined &&
    row.altitudeMinMeters > row.altitudeMaxMeters
  ) {
    errors.push(
      "Minimum altitude cannot exceed maximum altitude"
    );
  }

  // Validate production numbers
  if (row.annualProductionKg !== undefined && row.annualProductionKg < 0) {
    errors.push("Annual production cannot be negative");
  }

  if (row.annualExportVolumeKg !== undefined && row.annualExportVolumeKg < 0) {
    errors.push("Export volume cannot be negative");
  }

  // Validate email format
  if (row.contactEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.contactEmail)) {
      errors.push(`Invalid email format: ${row.contactEmail}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─── findMatchingGrower ────────────────────────────────────
/**
 * Attempt to find an existing grower record that matches the
 * imported row. Uses Coffee Board ID (exact), then name + state
 * heuristic matching.
 */

export async function findMatchingGrower(
  row: CoffeeBoardRow
): Promise<MatchResult> {
  // 1. Exact match on Coffee Board ID (highest confidence)
  if (row.coffeeBoardId) {
    const exact = await db.grower.findFirst({
      where: { coffeeBoardId: row.coffeeBoardId },
    });

    if (exact) {
      return {
        matchType: "high_confidence",
        matchedGrowerId: exact.id,
        matchedGrowerName: exact.displayName,
        confidence: 0.98,
        matchReasons: [
          `Coffee Board ID match: ${row.coffeeBoardId}`,
        ],
      };
    }
  }

  // 2. Exact match on registration number
  if (row.registrationNumber) {
    const reg = await db.grower.findFirst({
      where: { registrationNumber: row.registrationNumber },
    });

    if (reg) {
      return {
        matchType: "high_confidence",
        matchedGrowerId: reg.id,
        matchedGrowerName: reg.displayName,
        confidence: 0.95,
        matchReasons: [
          `Registration number match: ${row.registrationNumber}`,
        ],
      };
    }
  }

  // 3. Name + state heuristic (possible match)
  const name = row.estateName || row.growerName;
  if (name && row.state) {
    const normalized = name.toLowerCase().trim();

    // Look for name similarity in the state's growers
    const growersInState = await db.grower.findMany({
      where: {
        state: {
          equals: row.state,
          mode: "insensitive",
        },
      },
      select: { id: true, displayName: true, legalName: true },
      take: 50,
    });

    if (growersInState.length > 0) {
      const similar = growersInState.find((g) => {
        const gName = g.displayName.toLowerCase().trim();
        const gLegal = g.legalName?.toLowerCase().trim() ?? "";
        return (
          gName === normalized ||
          gLegal === normalized ||
          gName.includes(normalized) ||
          normalized.includes(gName)
        );
      });

      if (similar) {
        const isExactName =
          similar.displayName.toLowerCase().trim() === normalized;
        return {
          matchType: isExactName ? "high_confidence" : "possible_match",
          matchedGrowerId: similar.id,
          matchedGrowerName: similar.displayName,
          confidence: isExactName ? 0.85 : 0.65,
          matchReasons: [
            `Name similarity in ${row.state}: "${name}" ≈ "${similar.displayName}"`,
          ],
        };
      }
    }
  }

  // 4. Name-only match (lower confidence)
  if (name) {
    const nameMatch = await db.grower.findFirst({
      where: {
        displayName: {
          equals: name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (nameMatch) {
      return {
        matchType: "possible_match",
        matchedGrowerId: nameMatch.id,
        matchedGrowerName: nameMatch.displayName,
        confidence: 0.5,
        matchReasons: [
          `Name match (no state): "${name}"`,
        ],
      };
    }
  }

  return {
    matchType: "no_match",
    confidence: 0,
    matchReasons: [],
  };
}

// ─── previewImport ─────────────────────────────────────────
/**
 * Parse a CSV and produce a preview of what would happen
 * if the import were executed. For each row: validate, check
 * for duplicates, and classify.
 */

export async function previewImport(
  csvContent: string
): Promise<ImportPreviewResult> {
  const parsedRows = parseCsv(csvContent);

  const result: ImportPreviewResult = {
    totalRows: parsedRows.length,
    validRows: 0,
    newGrowers: 0,
    possibleMatches: 0,
    duplicates: 0,
    errorRows: 0,
    rows: [],
  };

  for (const row of parsedRows) {
    const validation = validateImportRow(row);

    if (!validation.valid) {
      result.errorRows++;
      result.rows.push({
        rowNumber: row.rowNumber,
        displayName: row.estateName || row.growerName || "(unknown)",
        state: row.state ?? null,
        matchType: "duplicate", // will show as error
        errors: validation.errors,
      });
      continue;
    }

    result.validRows++;

    const match = await findMatchingGrower(row);

    if (match.matchType === "high_confidence" && match.confidence >= 0.95) {
      result.duplicates++;
      result.rows.push({
        rowNumber: row.rowNumber,
        displayName: row.estateName || row.growerName || "(unknown)",
        state: row.state ?? null,
        matchType: "duplicate",
        matchedGrowerId: match.matchedGrowerId,
        matchedGrowerName: match.matchedGrowerName,
        confidence: match.confidence,
        errors: [],
      });
    } else if (
      match.matchType === "high_confidence" ||
      match.matchType === "possible_match"
    ) {
      result.possibleMatches++;
      result.rows.push({
        rowNumber: row.rowNumber,
        displayName: row.estateName || row.growerName || "(unknown)",
        state: row.state ?? null,
        matchType: "possible_match",
        matchedGrowerId: match.matchedGrowerId,
        matchedGrowerName: match.matchedGrowerName,
        confidence: match.confidence,
        errors: [],
      });
    } else {
      result.newGrowers++;
      result.rows.push({
        rowNumber: row.rowNumber,
        displayName: row.estateName || row.growerName || "(unknown)",
        state: row.state ?? null,
        matchType: "new",
        errors: [],
      });
    }
  }

  return result;
}
