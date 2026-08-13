import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { onboardingSubmitSchema } from "@/lib/validations/onboarding";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabaseUser = await requireAuth();

    // 2. Parse and validate body
    const body = await request.json();
    const parsed = onboardingSubmitSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 3. Check if user already has an organization
    const existingMembership = await db.organizationMember.findFirst({
      where: { userId: supabaseUser.id },
      include: { organization: true },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You have already submitted an application." },
        { status: 409 }
      );
    }

    // 4. Find or create the internal User record
    let user = await db.user.findUnique({
      where: { supabaseUid: supabaseUser.id },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          supabaseUid: supabaseUser.id,
          email: supabaseUser.email ?? "",
          firstName: data.firstName,
          lastName: data.lastName,
          jobTitle: data.jobTitle ?? null,
          phone: data.phone ?? null,
        },
      });
    } else {
      // Update user profile with latest info
      user = await db.user.update({
        where: { id: user.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          jobTitle: data.jobTitle ?? null,
          phone: data.phone ?? null,
        },
      });
    }

    // 5. Create Organization
    const organization = await db.organization.create({
      data: {
        legalName: data.legalName,
        operatingName: data.operatingName ?? null,
        website: data.website || null,
        businessType: data.businessType,
        province: data.province,
        city: data.city,
        address: data.address ?? null,
        postalCode: data.postalCode ?? null,
        yearEstablished: data.yearEstablished ?? null,
        numberOfLocations: data.numberOfLocations ?? null,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // 6. Create OrganizationMember (primary BUYER_ADMIN)
    await db.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "BUYER_ADMIN",
        isPrimary: true,
      },
    });

    // 7. Create BuyerProfile
    await db.buyerProfile.create({
      data: {
        organizationId: organization.id,
        roastingInHouse: data.roastingInHouse,
        roastingCapacityKgMonth: data.roastingCapacityKgMonth ?? null,
        annualGreenCoffeeKg: data.annualGreenCoffeeKg ?? null,
        currentOrigins: data.currentOrigins ?? null,
        mainCoffeeUse: data.mainCoffeeUses
          ? JSON.stringify(data.mainCoffeeUses)
          : null,
        typicalOrderSize: data.typicalOrderSizeKg?.toString() ?? null,
        preferredMinOrder: data.preferredMinOrderKg?.toString() ?? null,
        importExperience: data.importExperience ?? null,
        certificationsRequired: data.certificationsRequired ?? null,
        roasterNotes: data.notes ?? null,
        // Commercial preferences
        targetPriceRangeCadKg:
          data.targetPriceMinCadKg || data.targetPriceMaxCadKg
            ? JSON.stringify({
                min: data.targetPriceMinCadKg ?? null,
                max: data.targetPriceMaxCadKg ?? null,
              })
            : null,
        preferredSpecies: data.preferredSpecies
          ? JSON.stringify(data.preferredSpecies)
          : null,
        preferredProcessingMethods: data.preferredProcessingMethods
          ? JSON.stringify(data.preferredProcessingMethods)
          : null,
        preferredFlavourProfiles: data.preferredFlavourProfiles
          ? JSON.stringify(data.preferredFlavourProfiles)
          : null,
        preferredOrigins: data.preferredOrigins
          ? JSON.stringify(data.preferredOrigins)
          : null,
        sampleInterest: data.sampleInterest,
        groupOrderInterest: data.groupOrderInterest,
        targetPurchasingTimeline: data.targetPurchasingTimeline ?? null,
      },
    });

    // 8. Create Address record (registered address from org data)
    await db.address.create({
      data: {
        organizationId: organization.id,
        billingStreet: data.address ?? null,
        billingCity: data.city,
        billingProvince: data.province,
        billingPostalCode: data.postalCode ?? null,
        billingCountry: "Canada",
        deliveryStreet: data.address ?? null,
        deliveryCity: data.city,
        deliveryProvince: data.province,
        deliveryPostalCode: data.postalCode ?? null,
        deliveryCountry: "Canada",
        isSameAsRegistered: true,
      },
    });

    // 9. Create Consent Records
    const headersList = request.headers;
    const ipAddress =
      headersList.get("x-forwarded-for") ??
      headersList.get("x-real-ip") ??
      null;
    const userAgent = headersList.get("user-agent") ?? null;

    await db.consentRecord.createMany({
      data: [
        {
          organizationId: organization.id,
          consentType: "TERMS_ACCEPTANCE",
          ipAddress,
          userAgent,
        },
        {
          organizationId: organization.id,
          consentType: "PRIVACY_CONSENT",
          ipAddress,
          userAgent,
        },
        ...(data.marketingConsent
          ? [
              {
                organizationId: organization.id,
                consentType: "MARKETING_CONSENT" as const,
                ipAddress,
                userAgent,
              },
            ]
          : []),
      ],
    });

    // 10. Create Onboarding Step records (mark all as completed)
    await db.onboardingStep.createMany({
      data: [1, 2, 3, 4, 5].map((step) => ({
        userId: user.id,
        step,
      })),
    });

    // 11. Audit log
    await logAudit({
      action: "ORG_SUBMITTED",
      actorUserId: user.id,
      organizationId: organization.id,
      metadata: {
        businessType: data.businessType,
        province: data.province,
        city: data.city,
      },
    });

    return NextResponse.json({
      organizationId: organization.id,
      message: "Application submitted successfully",
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AuthError") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    console.error("Onboarding submit error:", err);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
