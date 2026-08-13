import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const supabaseUser = await requireAuth();

    const membership = await db.organizationMember.findFirst({
      where: {
        userId: supabaseUser.id,
        organization: { status: "APPROVED" },
      },
      include: {
        organization: {
          include: {
            buyerProfile: true,
            address: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "No approved organization found" }, { status: 404 });
    }

    return NextResponse.json({
      organization: membership.organization,
      role: membership.role,
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Organization GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, organization } = await requireRole("BUYER_ADMIN");
    const body = await request.json();

    // Separate org fields from buyer profile fields and address fields
    const orgFields: Record<string, unknown> = {};
    const buyerFields: Record<string, unknown> = {};
    const addressFields: Record<string, unknown> = {};

    const orgUpdateKeys = [
      "legalName", "operatingName", "website", "businessType",
      "province", "city", "address", "postalCode",
      "yearEstablished", "numberOfLocations",
    ];

    const buyerUpdateKeys = [
      "roastingInHouse", "roastingCapacityKgMonth", "annualGreenCoffeeKg",
      "currentOrigins", "mainCoffeeUse", "typicalOrderSize", "preferredMinOrder",
      "importExperience", "certificationsRequired", "roasterNotes",
      "targetPriceRangeCadKg", "preferredSpecies", "preferredProcessingMethods",
      "preferredFlavourProfiles", "preferredOrigins", "sampleInterest",
      "groupOrderInterest", "targetPurchasingTimeline",
    ];

    const addressUpdateKeys = [
      "billingStreet", "billingCity", "billingProvince", "billingPostalCode",
      "deliveryStreet", "deliveryCity", "deliveryProvince", "deliveryPostalCode",
    ];

    for (const [key, value] of Object.entries(body)) {
      if (orgUpdateKeys.includes(key)) {
        orgFields[key] = value;
      } else if (buyerUpdateKeys.includes(key)) {
        buyerFields[key] = value;
      } else if (addressUpdateKeys.includes(key)) {
        addressFields[key] = value;
      }
    }

    // Update organization
    if (Object.keys(orgFields).length > 0) {
      await db.organization.update({
        where: { id: organization.id },
        data: orgFields as Record<string, string | number | null>,
      });
    }

    // Update or create buyer profile
    if (Object.keys(buyerFields).length > 0) {
      // Convert arrays to JSON strings for Prisma string fields
      const jsonFields = [
        "mainCoffeeUse", "preferredSpecies", "preferredProcessingMethods",
        "preferredFlavourProfiles", "preferredOrigins", "targetPriceRangeCadKg",
        "certificationsRequired",
      ];

      for (const key of jsonFields) {
        if (key in buyerFields && typeof buyerFields[key] !== "string") {
          buyerFields[key] = JSON.stringify(buyerFields[key]);
        }
      }

      const existingProfile = await db.buyerProfile.findUnique({
        where: { organizationId: organization.id },
      });

      if (existingProfile) {
        await db.buyerProfile.update({
          where: { id: existingProfile.id },
          data: buyerFields as Record<string, string | number | boolean | null>,
        });
      } else {
        await db.buyerProfile.create({
          data: {
            organizationId: organization.id,
            ...(buyerFields as Record<string, string | number | boolean | null>),
          },
        });
      }
    }

    // Update address
    if (Object.keys(addressFields).length > 0) {
      const existingAddress = await db.address.findUnique({
        where: { organizationId: organization.id },
      });

      if (existingAddress) {
        await db.address.update({
          where: { id: existingAddress.id },
          data: addressFields as Record<string, string | null>,
        });
      } else {
        await db.address.create({
          data: {
            organizationId: organization.id,
            ...(addressFields as Record<string, string | null>),
          },
        });
      }
    }

    // Audit log
    await logAudit({
      action: "ORG_UPDATED",
      actorUserId: user.id,
      organizationId: organization.id,
      metadata: { updatedOrgFields: Object.keys(orgFields), updatedBuyerFields: Object.keys(buyerFields) },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code: string }).code;
      if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
        return NextResponse.json({ error: code === "UNAUTHORIZED" ? "Unauthorized" : "Insufficient permissions" }, { status: code === "UNAUTHORIZED" ? 401 : 403 });
      }
    }
    console.error("Organization PUT error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
