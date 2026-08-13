import type {
  Grower,
  CoffeeLot,
} from "@prisma/client";
import type { SanitizedGrower, SanitizedCertification, CoffeeLotPublic, PII_FIELDS } from "./types";

// Shared PII field set for lookups
const PII_FIELD_SET: ReadonlySet<string> = new Set([
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
]);

/**
 * Strip all PII and internal fields from a Grower record.
 * Safe to return in any roaster-facing API response.
 */
export function sanitizeGrowerForPublic(
  grower: Grower & {
    certifications?: { certificationType: string; certifyingBody: string | null; status: string; expiryDate: Date | null }[];
    coffeeLots?: { lotCode: string | null }[];
  }
): SanitizedGrower {
  // Parse JSON arrays safely
  const parseJson = <T>(value: string | null | undefined): T | null => {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  };

  const certList = (grower.certifications ?? []).map(
    (c): SanitizedCertification => ({
      certificationType: c.certificationType,
      certifyingBody: c.certifyingBody,
      status: c.status,
      expiryDate: c.expiryDate,
    })
  );

  const lots = grower.coffeeLots ?? [];

  return {
    id: grower.id,
    displayName: grower.displayName,
    growerType: grower.growerType,
    country: grower.country,
    state: grower.state,
    district: grower.district,
    latitude: grower.latitude,
    longitude: grower.longitude,
    primarySpecies: grower.primarySpecies,
    processingMethods: parseJson<string[]>(grower.processingMethods),
    altitudeMinMeters: grower.altitudeMinMeters,
    altitudeMaxMeters: grower.altitudeMaxMeters,
    typicalCupScore: grower.typicalCupScore,
    sampleAvailability: grower.sampleAvailability,
    traceabilityCapability: grower.traceabilityCapability,
    typicalLotSizeKg: grower.typicalLotSizeKg,
    minLotSizeKg: grower.minLotSizeKg,
    exportExperience: grower.exportExperience,
    certifications: certList,
    growerStory: grower.growerStory,
    buyerVisibleDescription: grower.buyerVisibleDescription,
    verificationStatus: grower.verificationStatus,
    visibility: grower.visibility,
    establishedYear: grower.establishedYear,
    lotCount: lots.length,
    lotCodes: lots.map((l) => l.lotCode).filter((c): c is string => c !== null),
    createdAt: grower.createdAt,
  };
}

/**
 * Map an array of growers through the PII sanitizer.
 */
export function sanitizeGrowerList(
  growers: (Grower & {
    certifications?: { certificationType: string; certifyingBody: string | null; status: string; expiryDate: Date | null }[];
    coffeeLots?: { lotCode: string | null }[];
  })[]
): SanitizedGrower[] {
  return growers.map(sanitizeGrowerForPublic);
}

/**
 * Strip internal fields from a CoffeeLot.
 * Returns a CoffeeLotPublic safe for roaster consumption.
 */
export function sanitizeLotForPublic(
  lot: CoffeeLot & {
    grower: { displayName: string; state: string | null };
  }
): CoffeeLotPublic {
  const parseJson = <T>(value: string | null | undefined): T | null => {
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  };

  return {
    id: lot.id,
    lotCode: lot.lotCode,
    cropYear: lot.cropYear,
    species: lot.species,
    variety: lot.variety,
    process: lot.process,
    grade: lot.grade,
    altitudeMinMeters: lot.altitudeMinMeters,
    altitudeMaxMeters: lot.altitudeMaxMeters,
    quantityKg: lot.quantityKg,
    moqKg: lot.moqKg,
    moistureContent: lot.moistureContent,
    waterActivity: lot.waterActivity,
    cupScore: lot.cupScore,
    tastingNotes: lot.tastingNotes,
    indicativePriceUsdKg: lot.indicativePriceUsdKg,
    priceBasis: lot.priceBasis,
    packagingDescription: lot.packagingDescription,
    certifications: parseJson<string[]>(lot.certifications),
    sampleAvailable: lot.sampleAvailable,
    exportReady: lot.exportReady,
    growerId: lot.growerId,
    growerDisplayName: lot.grower.displayName,
    state: lot.grower.state,
    status: lot.status,
    createdAt: lot.createdAt,
  };
}

/**
 * Check whether a given field name is a PII field.
 */
export function isPiiField(field: string): field is (typeof PII_FIELDS)[number] {
  return PII_FIELD_SET.has(field);
}

/**
 * Remove PII fields from a plain object (for audit logs, etc.).
 */
export function stripPiiFromObject<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!PII_FIELD_SET.has(key)) {
      result[key] = value;
    }
  }

  return result;
}
