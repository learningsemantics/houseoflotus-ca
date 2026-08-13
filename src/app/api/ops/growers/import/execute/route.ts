import { NextRequest, NextResponse } from "next/server";
import { requireOpsAdmin } from "@/lib/ops-auth";
import { db } from "@/lib/db";
import { parseCsv, validateImportRow, findMatchingGrower } from "@/lib/grower/import/coffee-board";
import { bulkCreateProvenanceForImport } from "@/lib/grower/provenance";
import { logAudit } from "@/lib/audit";
import type { DataSourceType, DuplicateMatchType, ImportRecordStatus } from "@prisma/client";
import { z } from "zod";

const executeImportSchema = z.object({
  csvContent: z.string().min(1),
  sourceType: z.enum([
    "COFFEE_BOARD_INDIA",
    "GOVERNMENT_DIRECTORY",
    "COOPERATIVE",
    "ESTATE_WEBSITE",
    "INDUSTRY_ASSOCIATION",
    "REFERRAL",
    "TRADE_EVENT",
    "DIRECT_OUTREACH",
    "GROWER_APPLICATION",
    "EXPORTER",
    "FIELD_VISIT",
    "OTHER",
  ] as DataSourceType[]),
  sourceName: z.string().max(300).optional(),
  sourceReference: z.string().max(500).optional(),
  sourceUrl: z.string().url().or(z.literal("")).optional(),
  createNewOnly: z.boolean().default(false),
  // Row-level decisions from the preview UI
  rowDecisions: z.record(z.enum(["create", "update", "skip", "merge"]).optional()).optional(),
});

// ─── POST /api/ops/growers/import/execute ───────────

export async function POST(request: NextRequest) {
  try {
    const user = await requireOpsAdmin();

    const body = await request.json();
    const parsed = executeImportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { csvContent, sourceType, sourceName, sourceReference, createNewOnly, rowDecisions } = parsed.data;

    // Create import batch
    const batch = await db.importBatch.create({
      data: {
        sourceType,
        sourceName,
        sourceReference,
        createdByUserId: user.id,
        status: "PROCESSING",
      },
    });

    const rows = parseCsv(csvContent);
    let imported = 0;
    let updated = 0;
    let duplicatesFlagged = 0;
    let errors = 0;
    const provenanceRecords: {
      growerId: string;
      fieldName: string;
      value: unknown;
      sourceType: DataSourceType;
      sourceReference: string;
    }[] = [];

    for (const row of rows) {
      // Check row-level decision from preview
      const decision = rowDecisions?.[String(row.rowNumber)];
      if (decision === "skip") continue;

      const validation = validateImportRow(row);
      if (!validation.valid) {
        await db.importRecord.create({
          data: {
            batchId: batch.id,
            rowNumber: row.rowNumber,
            rawData: JSON.stringify(row._raw),
            status: "ERROR" as ImportRecordStatus,
            errors: JSON.stringify(validation.errors),
          },
        });
        errors++;
        continue;
      }

      const displayName = row.estateName || row.growerName || "(unknown)";
      const match = await findMatchingGrower(row);

      // Determine what to do based on match and decisions
      if (createNewOnly && match.matchType !== "no_match") {
        await db.importRecord.create({
          data: {
            batchId: batch.id,
            rowNumber: row.rowNumber,
            rawData: JSON.stringify(row._raw),
            matchedStatus: "HIGH_CONFIDENCE_MATCH" as DuplicateMatchType,
            matchedGrowerId: match.matchedGrowerId,
            status: "DUPLICATE_FLAGGED" as ImportRecordStatus,
          },
        });
        duplicatesFlagged++;
        continue;
      }

      if (match.matchType === "high_confidence" && match.confidence >= 0.95 && decision !== "create") {
        // Update existing grower
        if (decision === "skip") {
          continue;
        }

        const updateData: Record<string, unknown> = { updatedByUserId: user.id };
        if (row.state) updateData.state = row.state;
        if (row.district) updateData.district = row.district;
        if (row.taluk) updateData.taluk = row.taluk;
        if (row.village) updateData.village = row.village;
        if (row.contactName) updateData.contactName = row.contactName;
        if (row.contactEmail) updateData.contactEmail = row.contactEmail;
        if (row.contactPhone) updateData.contactPhone = row.contactPhone;
        if (row.totalAcreage) updateData.totalAcreage = row.totalAcreage;
        if (row.coffeeAcreage) updateData.coffeeAcreage = row.coffeeAcreage;
        if (row.annualProductionKg) updateData.annualProductionKg = row.annualProductionKg;
        if (row.annualExportVolumeKg) updateData.annualExportVolumeKg = row.annualExportVolumeKg;
        if (row.primarySpecies) updateData.primarySpecies = row.primarySpecies;
        if (row.altitudeMinMeters) updateData.altitudeMinMeters = row.altitudeMinMeters;
        if (row.altitudeMaxMeters) updateData.altitudeMaxMeters = row.altitudeMaxMeters;
        if (row.typicalLotSizeKg) updateData.typicalLotSizeKg = row.typicalLotSizeKg;
        if (row.exportExperience !== undefined) updateData.exportExperience = row.exportExperience;
        if (row.existingExportMarkets) updateData.existingExportMarkets = JSON.stringify(row.existingExportMarkets);
        if (row.processingMethods) updateData.processingMethods = JSON.stringify(row.processingMethods);
        if (row.varietals) updateData.varietals = JSON.stringify(row.varietals);
        if (row.certifications) updateData.certifications = JSON.stringify(row.certifications);
        if (row.establishedYear) updateData.establishedYear = row.establishedYear;

        if (match.matchedGrowerId) {
          await db.grower.update({
            where: { id: match.matchedGrowerId },
            data: updateData,
          });

          await db.importRecord.create({
            data: {
              batchId: batch.id,
              rowNumber: row.rowNumber,
              rawData: JSON.stringify(row._raw),
              growerId: match.matchedGrowerId,
              matchedStatus: "HIGH_CONFIDENCE_MATCH" as DuplicateMatchType,
              matchedGrowerId: match.matchedGrowerId,
              status: "ACCEPTED" as ImportRecordStatus,
            },
          });

          updated++;
        }
        continue;
      }

      // Create new grower
      const grower = await db.grower.create({
        data: {
          displayName,
          legalName: row.estateName,
          coffeeBoardId: row.coffeeBoardId,
          registrationNumber: row.registrationNumber,
          establishedYear: row.establishedYear,
          state: row.state,
          district: row.district,
          taluk: row.taluk,
          village: row.village,
          address: row.address,
          postalCode: row.postalCode,
          contactName: row.contactName,
          contactEmail: row.contactEmail,
          contactPhone: row.contactPhone,
          totalAcreage: row.totalAcreage,
          coffeeAcreage: row.coffeeAcreage,
          annualProductionKg: row.annualProductionKg,
          annualExportVolumeKg: row.annualExportVolumeKg,
          primarySpecies: row.primarySpecies,
          allSpecies: row.primarySpecies ? JSON.stringify([row.primarySpecies]) : undefined,
          altitudeMinMeters: row.altitudeMinMeters,
          altitudeMaxMeters: row.altitudeMaxMeters,
          typicalLotSizeKg: row.typicalLotSizeKg,
          exportExperience: row.exportExperience ?? false,
          existingExportMarkets: row.existingExportMarkets ? JSON.stringify(row.existingExportMarkets) : undefined,
          processingMethods: row.processingMethods ? JSON.stringify(row.processingMethods) : undefined,
          varietals: row.varietals ? JSON.stringify(row.varietals) : undefined,
          relationshipOwnerUserId: user.id,
          createdByUserId: user.id,
          updatedByUserId: user.id,
        },
      });

      // Track provenance for non-null fields
      const ref = sourceReference || `${sourceType} Import ${new Date().toISOString()}`;
      if (row.state) provenanceRecords.push({ growerId: grower.id, fieldName: "state", value: row.state, sourceType, sourceReference: ref });
      if (row.district) provenanceRecords.push({ growerId: grower.id, fieldName: "district", value: row.district, sourceType, sourceReference: ref });
      if (row.primarySpecies) provenanceRecords.push({ growerId: grower.id, fieldName: "primarySpecies", value: row.primarySpecies, sourceType, sourceReference: ref });
      if (row.annualProductionKg) provenanceRecords.push({ growerId: grower.id, fieldName: "annualProductionKg", value: row.annualProductionKg, sourceType, sourceReference: ref });
      if (row.altitudeMinMeters) provenanceRecords.push({ growerId: grower.id, fieldName: "altitudeMinMeters", value: row.altitudeMinMeters, sourceType, sourceReference: ref });
      if (row.altitudeMaxMeters) provenanceRecords.push({ growerId: grower.id, fieldName: "altitudeMaxMeters", value: row.altitudeMaxMeters, sourceType, sourceReference: ref });
      if (row.establishedYear) provenanceRecords.push({ growerId: grower.id, fieldName: "establishedYear", value: row.establishedYear, sourceType, sourceReference: ref });

      await db.importRecord.create({
        data: {
          batchId: batch.id,
          rowNumber: row.rowNumber,
          rawData: JSON.stringify(row._raw),
          growerId: grower.id,
          status: "IMPORTED" as ImportRecordStatus,
        },
      });

      imported++;

      await logAudit({
        action: "GROWER_CREATED",
        actorUserId: user.id,
        growerId: grower.id,
        metadata: { source: "import", sourceType, batchId: batch.id, rowNumber: row.rowNumber },
      });
    }

    // Bulk create provenance in a transaction
    if (provenanceRecords.length > 0) {
      await bulkCreateProvenanceForImport(provenanceRecords, user.id);
    }

    // Update batch with final counts
    await db.importBatch.update({
      where: { id: batch.id },
      data: {
        totalRows: rows.length,
        importedRows: imported,
        duplicateRows: duplicatesFlagged,
        errorRows: errors,
        status: "COMPLETED",
      },
    });

    await logAudit({
      action: "IMPORT_BATCH_CREATED",
      actorUserId: user.id,
      metadata: {
        batchId: batch.id,
        sourceType,
        totalRows: rows.length,
        imported,
        updated,
        duplicatesFlagged,
        errors,
      },
    });

    return NextResponse.json({
      batchId: batch.id,
      totalRows: rows.length,
      created: imported,
      updated,
      duplicatesFlagged,
      errors,
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: string; message: string };
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHORIZED" ? 401 : 403 });
    }
    console.error("[POST /ops/growers/import/execute]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
