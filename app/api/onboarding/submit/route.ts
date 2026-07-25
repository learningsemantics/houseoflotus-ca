import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { logAudit } from "@/lib/audit"
import { OrganizationStatus, ConsentType, AuditAction } from "@prisma/client"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const body = await req.json()

    const {
      firstName, lastName, jobTitle, phone,
      legalName, operatingName, website, businessType,
      province, city, address, postalCode,
      yearEstablished, numberOfLocations,
      roastingInHouse, capacity, annualConsumption,
      currentOrigins, mainCoffeeUses, typicalOrderSizeKg,
      preferredMinOrderKg, importExperience, certifications, notes,
      targetPriceMinCadKg, targetPriceMaxCadKg, preferredSpecies,
      preferredProcessingMethods, preferredFlavourProfiles, preferredOrigins,
      sampleInterest, groupOrderInterest, targetPurchasingTimeline,
      termsAccepted, privacyAccepted, marketingAccepted,
    } = body

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: "First and last name are required" }, { status: 400 })
    }
    if (!legalName?.trim() || !city?.trim()) {
      return NextResponse.json({ error: "Legal name and city are required" }, { status: 400 })
    }

    // Update user profile
    await db.user.update({
      where: { id: user.id },
      data: { firstName: firstName.trim(), lastName: lastName.trim(), jobTitle: jobTitle?.trim() || null, phone: phone?.trim() || null },
    })

    // Create organization
    const org = await db.organization.create({
      data: {
        legalName: legalName.trim(),
        operatingName: operatingName?.trim() || null,
        website: website?.trim() || null,
        businessType: businessType || null,
        province: province || null,
        city: city.trim(),
        address: address?.trim() || null,
        postalCode: postalCode?.trim() || null,
        yearEstablished: yearEstablished ? parseInt(yearEstablished, 10) : null,
        numberOfLocations: numberOfLocations ? parseInt(numberOfLocations, 10) : null,
        status: OrganizationStatus.SUBMITTED,
        submittedAt: new Date(),
        createdByUserId: user.id,
      },
    })

    // Create org member as BUYER_ADMIN
    await db.organizationMember.create({
      data: { userId: user.id, organizationId: org.id, role: "BUYER_ADMIN" },
    })

    // Create buyer profile
    await db.buyerProfile.create({
      data: {
        organizationId: org.id,
        roastingInHouse: !!roastingInHouse,
        roastingCapacityKgMonth: capacity ? parseFloat(capacity) : null,
        annualGreenCoffeeKg: annualConsumption ? parseFloat(annualConsumption) : null,
        currentOrigins: currentOrigins?.trim() || null,
        mainCoffeeUses: Array.isArray(mainCoffeeUses) ? JSON.stringify(mainCoffeeUses) : null,
        typicalOrderSizeKg: typicalOrderSizeKg ? parseFloat(typicalOrderSizeKg) : null,
        preferredMinOrderKg: preferredMinOrderKg ? parseFloat(preferredMinOrderKg) : null,
        importExperience: importExperience || null,
        certificationsRequired: certifications?.trim() || null,
        notes: notes?.trim() || null,
        targetPriceMinCadKg: targetPriceMinCadKg ? parseFloat(targetPriceMinCadKg) : null,
        targetPriceMaxCadKg: targetPriceMaxCadKg ? parseFloat(targetPriceMaxCadKg) : null,
        preferredSpecies: Array.isArray(preferredSpecies) ? JSON.stringify(preferredSpecies) : null,
        preferredProcessingMethods: Array.isArray(preferredProcessingMethods) ? JSON.stringify(preferredProcessingMethods) : null,
        preferredFlavourProfiles: Array.isArray(preferredFlavourProfiles) ? JSON.stringify(preferredFlavourProfiles) : null,
        preferredOrigins: Array.isArray(preferredOrigins) ? JSON.stringify(preferredOrigins) : null,
        sampleInterest: !!sampleInterest,
        groupOrderInterest: !!groupOrderInterest,
        targetPurchasingTimeline: targetPurchasingTimeline || null,
      },
    })

    // Create organization address
    if (address?.trim() || city?.trim()) {
      await db.organizationAddress.create({
        data: {
          organizationId: org.id,
          label: "Primary",
          street: address?.trim() || null,
          city: city.trim(),
          province: province || null,
          postalCode: postalCode?.trim() || null,
          country: "Canada",
          isDefault: true,
        },
      })
    }

    // Create consent records
    const consentTypes = [
      { type: ConsentType.TERMS_ACCEPTANCE, consented: !!termsAccepted },
      { type: ConsentType.PRIVACY_CONSENT, consented: !!privacyAccepted },
      { type: ConsentType.MARKETING_CONSENT, consented: !!marketingAccepted },
    ]
    for (const c of consentTypes) {
      await db.consentRecord.upsert({
        where: { userId_type: { userId: user.id, type: c.type } },
        create: { userId: user.id, type: c.type, consented: c.consented, ip: req.headers.get("x-forwarded-for") ?? null, userAgent: req.headers.get("user-agent") ?? null },
        update: { consented: c.consented },
      })
    }

    // Audit logs
    await logAudit({ action: AuditAction.ORGANIZATION_CREATED, actorUserId: user.id, targetType: "Organization", targetId: org.id, req })
    await logAudit({ action: AuditAction.ORGANIZATION_SUBMITTED, actorUserId: user.id, targetType: "Organization", targetId: org.id, req })

    return NextResponse.json({ orgId: org.id })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    console.error("Onboarding submit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
