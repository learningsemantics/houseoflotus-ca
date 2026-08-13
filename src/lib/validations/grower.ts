import { z } from "zod";

// ─── Create Grower ─────────────────────────────────────────
// displayName is the only required field. Everything else is
// optional so ops can create a minimal record and enrich later.

export const createGrowerSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(300, "Display name must be 300 characters or fewer"),

  // Identity
  legalName: z.string().max(300).optional(),
  growerType: z.enum([
    "INDIVIDUAL",
    "ESTATE",
    "COOPERATIVE",
    "PRODUCER_GROUP",
    "PROCESSOR",
    "EXPORTER",
    "GROWER_EXPORTER",
  ]).optional(),
  coffeeBoardRegistration: z
    .enum(["REGISTERED", "UNREGISTERED", "EXEMPT", "UNKNOWN"])
    .optional(),
  coffeeBoardId: z.string().max(100).optional(),
  registrationNumber: z.string().max(100).optional(),
  taxId: z.string().max(100).optional(),
  establishedYear: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
  website: z.string().url().or(z.literal("")).optional(),

  // Contact (PII)
  contactName: z.string().max(300).optional(),
  contactEmail: z.string().email().or(z.literal("")).optional(),
  contactPhone: z.string().max(30).optional(),
  contactMethod: z.string().max(50).optional(),
  languages: z.string().optional(), // JSON array

  // Location
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  taluk: z.string().max(100).optional(),
  village: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  // Production
  totalAcreage: z.number().min(0).optional(),
  coffeeAcreage: z.number().min(0).optional(),
  annualProductionKg: z.number().min(0).optional(),
  annualExportVolumeKg: z.number().min(0).optional(),

  // Coffee
  primarySpecies: z
    .enum(["ARABICA", "ROBUSTA", "LIBERICA", "EXCELSA"])
    .optional(),
  allSpecies: z.string().optional(), // JSON array
  varietals: z.string().optional(), // JSON array
  processingMethods: z.string().optional(), // JSON array
  harvestMonths: z.string().optional(), // JSON array
  altitudeMinMeters: z.number().int().min(0).max(3000).optional(),
  altitudeMaxMeters: z.number().int().min(0).max(3000).optional(),

  // Quality
  typicalCupScore: z.number().min(0).max(100).optional(),
  cuppingExperience: z.string().max(1000).optional(),
  laboratoryTesting: z.boolean().optional(),
  sampleAvailability: z.boolean().optional(),
  traceabilityCapability: z.boolean().optional(),

  // Commercial
  typicalLotSizeKg: z.number().min(0).optional(),
  minLotSizeKg: z.number().min(0).optional(),
  exportExperience: z.boolean().optional(),
  existingExportMarkets: z.string().optional(), // JSON array
  preferredCommercialModel: z.string().max(200).optional(),
  priceExpectationUsdKg: z.number().min(0).optional(),
  packagingCapability: z.string().max(200).optional(),

  // Infrastructure
  warehouseCapability: z.boolean().optional(),
  processingCapability: z.boolean().optional(),
  dryingCapability: z.boolean().optional(),

  // Sustainability & Story
  sustainabilityPractices: z.string().optional(), // JSON array
  growerStory: z.string().max(5000).optional(),
  buyerVisibleDescription: z.string().max(2000).optional(),
  internalNotes: z.string().max(5000).optional(),

  // Pipeline
  relationshipStatus: z
    .enum([
      "DISCOVERED",
      "IDENTIFIED",
      "CONTACTED",
      "RESPONDED",
      "INTERESTED",
      "INFORMATION_REQUESTED",
      "APPLICATION_STARTED",
      "APPLICATION_RECEIVED",
      "UNDER_VERIFICATION",
      "VERIFIED",
      "SAMPLE_REQUESTED",
      "SAMPLE_RECEIVED",
      "CUPPING",
      "QUALIFIED",
      "ACTIVE_GROWER",
      "DORMANT",
      "REJECTED",
    ])
    .optional(),
  visibility: z
    .enum([
      "INTERNAL_ONLY",
      "APPROVED_ROASTERS_ONLY",
      "SELECTED_ROASTERS",
      "PUBLIC_PROFILE",
    ])
    .optional(),
  nextAction: z.string().max(500).optional(),
  nextActionDate: z.string().datetime().or(z.date()).optional(),
});

export type CreateGrowerInput = z.infer<typeof createGrowerSchema>;

// ─── Update Grower (partial of create) ────────────────────

export const updateGrowerSchema = createGrowerSchema.partial().omit({
  displayName: true, // displayName cannot be removed, only changed
});

export type UpdateGrowerInput = z.infer<typeof updateGrowerSchema>;

// ─── Add Provenance ────────────────────────────────────────

export const addProvenanceSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
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
  ]),
  sourceReference: z.string().max(500).optional(),
  sourceName: z.string().max(300).optional(),
  sourceUrl: z.string().url().or(z.literal("")).optional(),
  sourceDetail: z.string().max(2000).optional(),
  sourceDate: z.string().datetime().or(z.date()).optional(),
});

export type AddProvenanceInput = z.infer<typeof addProvenanceSchema>;

// ─── Add Certification ────────────────────────────────────

export const addCertificationSchema = z.object({
  certificationType: z.enum([
    "ORGANIC",
    "FAIRTRADE",
    "RAINFOREST_ALLIANCE",
    "UTZ",
    "BIRD_FRIENDLY",
    "CAFE_PRACTICES",
    "FOUR_C",
    "NOP_USDA",
    "EU_ORGANIC",
    "JAS_ORGANIC",
    "COR",
    "CODEX",
    "NONE_KNOWN",
  ]),
  certifyingBody: z.string().max(300).optional(),
  certificateNumber: z.string().max(100).optional(),
  certificateUrl: z.string().url().or(z.literal("")).optional(),
  issueDate: z.string().datetime().or(z.date()).optional(),
  expiryDate: z.string().datetime().or(z.date()).optional(),
  notes: z.string().max(2000).optional(),
});

export type AddCertificationInput = z.infer<typeof addCertificationSchema>;

// ─── Add Note ──────────────────────────────────────────────

export const addNoteSchema = z.object({
  content: z
    .string()
    .min(1, "Note content is required")
    .max(10000, "Note content must be 10,000 characters or fewer"),
  category: z
    .enum(["GENERAL", "VERIFICATION", "QUALITY", "COMPLIANCE", "RELATIONSHIP"])
    .optional(),
  isPinned: z.boolean().optional(),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;

// ─── Add Outreach ──────────────────────────────────────────

export const addOutreachSchema = z.object({
  outreachType: z.enum([
    "EMAIL",
    "PHONE_CALL",
    "WHATSAPP",
    "IN_PERSON_MEETING",
    "VIDEO_CALL",
    "TRADE_EVENT",
    "OTHER",
  ]),
  scheduledDate: z.string().datetime().or(z.date()),
  subject: z.string().max(500).optional(),
  content: z.string().max(10000).optional(),
  status: z
    .enum([
      "SCHEDULED",
      "COMPLETED",
      "NO_RESPONSE",
      "REJECTED",
      "INTERESTED",
      "FOLLOW_UP_REQUIRED",
    ])
    .optional(),
  response: z.string().max(5000).optional(),
  followUpDate: z.string().datetime().or(z.date()).optional(),
});

export type AddOutreachInput = z.infer<typeof addOutreachSchema>;

// ─── Create Estate ─────────────────────────────────────────

export const createEstateSchema = z.object({
  name: z
    .string()
    .min(1, "Estate name is required")
    .max(300, "Estate name must be 300 characters or fewer"),
  growerId: z.string().min(1, "Grower ID is required"),
  state: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  taluk: z.string().max(100).optional(),
  village: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  altitudeMinMeters: z.number().int().min(0).max(3000).optional(),
  altitudeMaxMeters: z.number().int().min(0).max(3000).optional(),
  acreageHectares: z.number().min(0).optional(),
});

export type CreateEstateInput = z.infer<typeof createEstateSchema>;

// ─── Create Coffee Lot ─────────────────────────────────────

export const createCoffeeLotSchema = z.object({
  growerId: z.string().min(1, "Grower ID is required"),
  estateId: z.string().optional(),

  // Identity
  lotCode: z.string().max(100).optional(),
  cropYear: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),

  // Coffee
  species: z.enum(["ARABICA", "ROBUSTA", "LIBERICA", "EXCELSA"]).optional(),
  variety: z.string().max(200).optional(),
  process: z
    .enum([
      "WASHED",
      "NATURAL",
      "HONEY",
      "SEMI_WASHED",
      "PULPED_NATURAL",
      "WET_HULLING",
      "ANAEROBIC",
      "CARBONIC_MACERATION",
      "EXPERIMENTAL",
    ])
    .optional(),
  grade: z.string().max(100).optional(),
  altitudeMinMeters: z.number().int().min(0).max(3000).optional(),
  altitudeMaxMeters: z.number().int().min(0).max(3000).optional(),

  // Quantity
  quantityKg: z.number().min(0).optional(),
  moqKg: z.number().min(0).optional(),

  // Quality
  moistureContent: z.number().min(0).max(30).optional(),
  waterActivity: z.number().min(0).max(1).optional(),
  cupScore: z.number().min(0).max(100).optional(),
  tastingNotes: z.string().max(3000).optional(),

  // Harvest
  harvestStart: z.string().datetime().or(z.date()).optional(),
  harvestEnd: z.string().datetime().or(z.date()).optional(),

  // Commercial
  indicativePriceUsdKg: z.number().min(0).optional(),
  priceBasis: z
    .enum(["FOB_ORIGIN", "CIF_PORT", "EXW", "DDP", "OTHER"])
    .optional(),
  priceDate: z.string().datetime().or(z.date()).optional(),
  currency: z.string().max(10).optional(),
  packagingDescription: z.string().max(1000).optional(),

  // Status
  sampleAvailable: z.boolean().optional(),
  exportReady: z.boolean().optional(),
  visibility: z
    .enum([
      "INTERNAL_ONLY",
      "APPROVED_ROASTERS_ONLY",
      "SELECTED_ROASTERS",
      "PUBLIC_PROFILE",
    ])
    .optional(),

  // Certifications
  certifications: z.string().optional(), // JSON array

  // Documentation
  documentationStatus: z.string().max(50).optional(),
});

export type CreateCoffeeLotInput = z.infer<typeof createCoffeeLotSchema>;

// ─── Import Query (search/filter params) ──────────────────

export const importQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  relationshipStatus: z.string().optional(),
  verificationStatus: z.string().optional(),
  growerType: z.string().optional(),
  state: z.string().optional(),
  primarySpecies: z.string().optional(),
  visibility: z.string().optional(),
  dataSourceType: z.string().optional(),
  hasSample: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  exportReady: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  sortBy: z.string().max(100).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ImportQueryInput = z.infer<typeof importQuerySchema>;
