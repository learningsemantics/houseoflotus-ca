import { db } from "@/lib/db";
import type { DataSourceType, GrowerProvenance } from "@prisma/client";

// ─── Types ─────────────────────────────────────────────────

interface CreateProvenanceForFieldInput {
  growerId: string;
  fieldName: string;
  newValue: unknown;
  oldValue?: unknown;
  sourceType: DataSourceType;
  sourceName?: string;
  sourceReference?: string;
  sourceUrl?: string;
  sourceDetail?: string;
  sourceDate?: Date;
  userId?: string;
  isAiAssisted?: boolean;
  aiModel?: string;
  aiConfidence?: number;
}

interface CreateProvenanceForImportInput {
  growerId: string;
  fieldName: string;
  value: unknown;
  sourceType: DataSourceType;
  sourceReference: string;
  userId?: string;
}

/**
 * Create a provenance record for a field update.
 * Called whenever a grower field is modified to track
 * where the data came from and who made the change.
 */
export async function createProvenanceForField({
  growerId,
  fieldName,
  newValue,
  oldValue,
  sourceType,
  sourceName,
  sourceReference,
  sourceUrl,
  sourceDetail,
  sourceDate,
  userId,
  isAiAssisted = false,
  aiModel,
  aiConfidence,
}: CreateProvenanceForFieldInput): Promise<GrowerProvenance> {
  const fieldValue = typeof newValue === "string" ? newValue : JSON.stringify(newValue);
  const previousValue =
    oldValue !== undefined
      ? typeof oldValue === "string"
        ? oldValue
        : JSON.stringify(oldValue)
      : null;

  return db.growerProvenance.create({
    data: {
      growerId,
      fieldName,
      fieldValue,
      previousValue,
      sourceType,
      sourceName,
      sourceReference,
      sourceUrl,
      sourceDetail,
      sourceDate: sourceDate ?? undefined,
      isAiAssisted,
      aiModel: isAiAssisted ? aiModel : null,
      aiConfidence: isAiAssisted ? aiConfidence : null,
      createdByUserId: userId,
    },
  });
}

/**
 * Create a provenance record for an import operation.
 * Convenience wrapper with import-specific defaults.
 */
export async function createProvenanceForImport({
  growerId,
  fieldName,
  value,
  sourceType,
  sourceReference,
  userId,
}: CreateProvenanceForImportInput): Promise<GrowerProvenance> {
  return createProvenanceForField({
    growerId,
    fieldName,
    newValue: value,
    sourceType,
    sourceReference,
    userId,
  });
}

/**
 * Get all provenance records for a specific field on a grower.
 * Returns records in reverse chronological order (newest first).
 */
export async function getFieldProvenance(
  growerId: string,
  fieldName: string
): Promise<GrowerProvenance[]> {
  return db.growerProvenance.findMany({
    where: {
      growerId,
      fieldName,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      verifiedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * Get all provenance records for a grower, optionally filtered by source type.
 */
export async function getGrowerProvenance(
  growerId: string,
  options?: {
    sourceType?: DataSourceType;
    isVerified?: boolean;
    fieldName?: string;
    limit?: number;
  }
): Promise<GrowerProvenance[]> {
  const where: Record<string, unknown> = { growerId };

  if (options?.sourceType) where.sourceType = options.sourceType;
  if (options?.isVerified !== undefined) where.isVerified = options.isVerified;
  if (options?.fieldName) where.fieldName = options.fieldName;

  return db.growerProvenance.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      verifiedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/**
 * Create provenance records in bulk for an import operation.
 * Uses a Prisma transaction for atomicity.
 */
export async function bulkCreateProvenanceForImport(
  records: {
    growerId: string;
    fieldName: string;
    value: unknown;
    sourceType: DataSourceType;
    sourceReference: string;
  }[],
  userId?: string
): Promise<void> {
  if (records.length === 0) return;

  await db.$transaction(
    records.map((r) =>
      db.growerProvenance.create({
        data: {
          growerId: r.growerId,
          fieldName: r.fieldName,
          fieldValue:
            typeof r.value === "string" ? r.value : JSON.stringify(r.value),
          sourceType: r.sourceType,
          sourceReference: r.sourceReference,
          createdByUserId: userId,
        },
      })
    )
  );
}
