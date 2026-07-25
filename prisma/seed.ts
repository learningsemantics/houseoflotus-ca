import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Demo super admin
  const admin = await prisma.user.upsert({
    where: { id: "demo-super-admin" },
    create: {
      id: "demo-super-admin",
      email: "admin@houseoflotus.ca",
      firstName: "House of Lotus",
      lastName: "Admin",
      globalRole: "SUPER_ADMIN",
      isInternal: true,
      emailVerified: true,
    },
    update: {},
  });

  // Demo ops admin
  const ops = await prisma.user.upsert({
    where: { id: "demo-ops-admin" },
    create: {
      id: "demo-ops-admin",
      email: "ops@houseoflotus.ca",
      firstName: "Operations",
      lastName: "Manager",
      globalRole: "OPS_ADMIN",
      isInternal: true,
      emailVerified: true,
    },
    update: {},
  });

  // Demo buyer organization (approved)
  const demoOrg = await prisma.organization.create({
    data: {
      id: "demo-org-1",
      legalName: "Northern Roasters Canada",
      operatingName: "Northern Roasters",
      website: "https://northernroasters.ca",
      businessType: "roaster",
      province: "ON",
      city: "Toronto",
      address: "123 Coffee St",
      postalCode: "M5V 3L9",
      yearEstablished: 2018,
      numberOfLocations: 3,
      status: "APPROVED",
      submittedAt: new Date("2026-01-15"),
      reviewedAt: new Date("2026-01-16"),
      reviewedByUserId: admin.id,
      createdByUserId: admin.id,
    },
  });

  // Demo buyer user
  const buyer = await prisma.user.upsert({
    where: { id: "demo-buyer" },
    create: {
      id: "demo-buyer",
      email: "buyer@northernroasters.ca",
      firstName: "Sarah",
      lastName: "Chen",
      jobTitle: "Head of Sourcing",
      phone: "(416) 555-0123",
      globalRole: "BUYER_MEMBER",
      isInternal: false,
      emailVerified: true,
    },
    update: {},
  });

  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: buyer.id, organizationId: demoOrg.id } },
    create: { userId: buyer.id, organizationId: demoOrg.id, role: "BUYER_ADMIN" },
    update: {},
  });

  await prisma.buyerProfile.upsert({
    where: { organizationId: demoOrg.id },
    create: {
      organizationId: demoOrg.id,
      roastingInHouse: true,
      roastingCapacityKgMonth: 5000,
      annualGreenCoffeeKg: 60000,
      currentOrigins: JSON.stringify(["Karnataka", "Kerala", "Tamil Nadu"]),
      mainCoffeeUses: JSON.stringify(["espresso", "filter", "retail_bags", "wholesale"]),
      typicalOrderSizeKg: 500,
      preferredMinOrderKg: 250,
      importExperience: "broker",
      certificationsRequired: JSON.stringify(["Organic", "Fair Trade", "Rainforest Alliance"]),
      preferredSpecies: JSON.stringify(["arabica"]),
      preferredProcessingMethods: JSON.stringify(["washed", "natural", "honey"]),
      preferredFlavourProfiles: JSON.stringify(["fruity", "chocolate", "floral"]),
      preferredOrigins: JSON.stringify(["Karnataka", "Kerala"]),
      sampleInterest: true,
      groupOrderInterest: true,
      targetPurchasingTimeline: "1_3_months",
      targetPriceMinCadKg: 12,
      targetPriceMaxCadKg: 18,
    },
    update: {},
  });

  await prisma.consentRecord.createMany({
    data: [
      { userId: buyer.id, type: "TERMS_ACCEPTANCE" },
      { userId: buyer.id, type: "PRIVACY_CONSENT" },
    ],
    skipDuplicates: true,
  });

  // Demo submitted org (pending)
  const pendingOrg = await prisma.organization.create({
    data: {
      legalName: "Pacific Coast Coffee Co.",
      province: "BC",
      city: "Vancouver",
      businessType: "cafe_group",
      status: "SUBMITTED",
      submittedAt: new Date(),
      createdByUserId: admin.id,
    },
  });

  const pendingBuyer = await prisma.user.create({
    data: {
      id: "demo-pending-buyer",
      email: "buyer@pacificcoast.ca",
      firstName: "Michael",
      lastName: "Baker",
      globalRole: "BUYER_MEMBER",
      emailVerified: true,
    },
  });

  await prisma.organizationMember.create({
    data: { userId: pendingBuyer.id, organizationId: pendingOrg.id, role: "BUYER_ADMIN" },
  });

  console.log("Seed complete!");
  console.log("── Users ──");
  console.log("  admin@houseoflotus.ca (SUPER_ADMIN)");
  console.log("  ops@houseoflotus.ca (OPS_ADMIN)");
  console.log("  buyer@northernroasters.ca (BUYER_ADMIN, org: Northern Roasters — APPROVED)");
  console.log("  buyer@pacificcoast.ca (BUYER_ADMIN, org: Pacific Coast — SUBMITTED)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });