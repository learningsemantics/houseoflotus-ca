import { z } from "zod";

// ─── Canadian Provinces ─────────────────────────────────

export const CANADIAN_PROVINCES = [
  "AB", // Alberta
  "BC", // British Columbia
  "MB", // Manitoba
  "NB", // New Brunswick
  "NL", // Newfoundland and Labrador
  "NS", // Nova Scotia
  "NT", // Northwest Territories
  "NU", // Nunavut
  "ON", // Ontario
  "PE", // Prince Edward Island
  "QC", // Quebec
  "SK", // Saskatchewan
  "YT", // Yukon
] as const;

export const PROVINCE_LABELS: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

// ─── Enums ───────────────────────────────────────────────

export const BUSINESS_TYPES = [
  "roaster",
  "cafe_group",
  "restaurant_group",
  "hospitality",
  "private_label",
  "specialty_importer",
  "corporate_gifting",
  "other",
] as const;

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  roaster: "Roaster",
  cafe_group: "Café Group",
  restaurant_group: "Restaurant Group",
  hospitality: "Hospitality / Hotel",
  private_label: "Private Label",
  specialty_importer: "Specialty Importer",
  corporate_gifting: "Corporate Gifting",
  other: "Other",
};

export const COFFEE_USES = [
  "espresso",
  "filter",
  "retail_bags",
  "wholesale",
  "private_label",
  "hospitality",
] as const;

export const COFFEE_USE_LABELS: Record<string, string> = {
  espresso: "Espresso-Based",
  filter: "Filter / Brewed",
  retail_bags: "Retail Bags",
  wholesale: "Wholesale",
  private_label: "Private Label",
  hospitality: "Hospitality / Food Service",
};

export const IMPORT_EXPERIENCE = ["none", "direct", "broker", "both"] as const;

export const IMPORT_EXPERIENCE_LABELS: Record<string, string> = {
  none: "No Import Experience",
  direct: "Direct from Origin",
  broker: "Through Broker / Importer",
  both: "Both Direct & Broker",
};

export const COFFEE_SPECIES = ["arabica", "robusta", "liberica", "excelsa"] as const;

export const COFFEE_SPECIES_LABELS: Record<string, string> = {
  arabica: "Arabica",
  robusta: "Robusta",
  liberica: "Liberica",
  excelsa: "Excelsa",
};

export const PROCESSING_METHODS = [
  "washed",
  "natural",
  "honey",
  "anaerobic",
  "wet_hulled",
  "carbonic_maceration",
  "lactic",
] as const;

export const PROCESSING_METHOD_LABELS: Record<string, string> = {
  washed: "Washed",
  natural: "Natural / Dry",
  honey: "Honey",
  anaerobic: "Anaerobic Fermentation",
  wet_hulled: "Wet-Hulled (Giling Basah)",
  carbonic_maceration: "Carbonic Maceration",
  lactic: "Lactic Fermentation",
};

export const FLAVOUR_PROFILES = [
  "fruity",
  "floral",
  "chocolate",
  "nutty",
  "spicy",
  "caramel",
  "citrus",
  "berry",
  "tropical",
  "earthy",
  "winey",
  "tea_like",
] as const;

export const FLAVOUR_PROFILE_LABELS: Record<string, string> = {
  fruity: "Fruity",
  floral: "Floral",
  chocolate: "Chocolate",
  nutty: "Nutty",
  spicy: "Spicy",
  caramel: "Caramel",
  citrus: "Citrus",
  berry: "Berry",
  tropical: "Tropical",
  earthy: "Earthy",
  winey: "Winey",
  tea_like: "Tea-Like",
};

export const COFFEE_ORIGINS = [
  "ethiopia",
  "colombia",
  "brazil",
  "guatemala",
  "costa_rica",
  "kenya",
  "rwanda",
  "burundi",
  "honduras",
  "peru",
  "nicaragua",
  "mexico",
  "sumatra",
  "jamaica",
  "panama",
  "yemen",
  "india",
  "vietnam",
  "papua_new_guinea",
  "other",
] as const;

export const ORIGIN_LABELS: Record<string, string> = {
  ethiopia: "Ethiopia",
  colombia: "Colombia",
  brazil: "Brazil",
  guatemala: "Guatemala",
  costa_rica: "Costa Rica",
  kenya: "Kenya",
  rwanda: "Rwanda",
  burundi: "Burundi",
  honduras: "Honduras",
  peru: "Peru",
  nicaragua: "Nicaragua",
  mexico: "Mexico",
  sumatra: "Sumatra (Indonesia)",
  jamaica: "Jamaica",
  panama: "Panama",
  yemen: "Yemen",
  india: "India",
  vietnam: "Vietnam",
  papua_new_guinea: "Papua New Guinea",
  other: "Other",
};

export const PURCHASING_TIMELINES = [
  "immediate",
  "within_30_days",
  "within_90_days",
  "within_6_months",
  "exploring",
] as const;

export const PURCHASING_TIMELINE_LABELS: Record<string, string> = {
  immediate: "Immediately",
  within_30_days: "Within 30 days",
  within_90_days: "Within 90 days",
  within_6_months: "Within 6 months",
  exploring: "Just Exploring",
};

// ─── Step 1: Personal Details ─────────────────────────────

export const step1PersonalSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name is too long"),
  jobTitle: z.string().max(100, "Job title is too long").optional(),
  phone: z.string().max(30, "Phone number is too long").optional(),
});
export type Step1PersonalInput = z.infer<typeof step1PersonalSchema>;

// ─── Step 2: Organization Details ────────────────────────

export const step2OrganizationSchema = z.object({
  legalName: z
    .string()
    .min(1, "Legal business name is required")
    .max(200, "Legal name is too long"),
  operatingName: z.string().max(200, "Operating name is too long").optional(),
  website: z
    .string()
    .max(300, "Website URL is too long")
    .url("Please enter a valid URL (include https://)")
    .optional()
    .or(z.literal("")),
  businessType: z.enum(BUSINESS_TYPES, {
    required_error: "Business type is required",
  }),
  province: z.enum(CANADIAN_PROVINCES, {
    required_error: "Province is required",
  }),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City name is too long"),
  address: z.string().max(300, "Address is too long").optional(),
  postalCode: z
    .string()
    .max(10, "Postal code is too long")
    .optional(),
  yearEstablished: z
    .number()
    .int()
    .min(1800, "Year must be 1800 or later")
    .max(new Date().getFullYear(), "Year cannot be in the future")
    .optional(),
  numberOfLocations: z
    .number()
    .int()
    .min(1, "Must have at least 1 location")
    .max(10000, "Number seems too high")
    .optional(),
});
export type Step2OrganizationInput = z.infer<typeof step2OrganizationSchema>;

// ─── Step 3: Roaster Profile ──────────────────────────────

export const step3RoasterProfileSchema = z.object({
  roastingInHouse: z.boolean(),
  roastingCapacityKgMonth: z
    .number()
    .positive("Capacity must be positive")
    .optional(),
  annualGreenCoffeeKg: z
    .number()
    .positive("Amount must be positive")
    .optional(),
  currentOrigins: z.string().max(500, "Text is too long").optional(),
  mainCoffeeUses: z.array(z.enum(COFFEE_USES)).optional(),
  typicalOrderSizeKg: z
    .number()
    .positive("Order size must be positive")
    .optional(),
  preferredMinOrderKg: z
    .number()
    .positive("Order minimum must be positive")
    .optional(),
  importExperience: z.enum(IMPORT_EXPERIENCE).optional(),
  certificationsRequired: z.string().max(500, "Text is too long").optional(),
  notes: z.string().max(2000, "Notes are too long").optional(),
});
export type Step3RoasterProfileInput = z.infer<typeof step3RoasterProfileSchema>;

// ─── Step 4: Commercial Preferences ─────────────────────

export const step4CommercialSchema = z
  .object({
    targetPriceMinCadKg: z
      .number()
      .positive("Price must be positive")
      .optional(),
    targetPriceMaxCadKg: z
      .number()
      .positive("Price must be positive")
      .optional(),
    preferredSpecies: z.array(z.enum(COFFEE_SPECIES)).optional(),
    preferredProcessingMethods: z
      .array(z.enum(PROCESSING_METHODS))
      .optional(),
    preferredFlavourProfiles: z
      .array(z.enum(FLAVOUR_PROFILES))
      .optional(),
    preferredOrigins: z.array(z.enum(COFFEE_ORIGINS)).optional(),
    sampleInterest: z.boolean().default(true),
    groupOrderInterest: z.boolean().default(false),
    targetPurchasingTimeline: z
      .enum(PURCHASING_TIMELINES)
      .optional(),
  })
  .refine(
    (data) => {
      if (data.targetPriceMinCadKg && data.targetPriceMaxCadKg) {
        return data.targetPriceMaxCadKg >= data.targetPriceMinCadKg;
      }
      return true;
    },
    {
      message: "Maximum price must be at least the minimum price",
      path: ["targetPriceMaxCadKg"],
    }
  );
export type Step4CommercialInput = z.infer<typeof step4CommercialSchema>;

// ─── Step 5: Consent ─────────────────────────────────────

export const step5ConsentSchema = z
  .object({
    termsAccepted: z.literal(true, {
      errorMap: () => ({
        message: "You must accept the terms and conditions to continue",
      }),
    }),
    privacyConsent: z.literal(true, {
      errorMap: () => ({
        message: "You must consent to the privacy policy to continue",
      }),
    }),
    marketingConsent: z.boolean().optional(),
  });
export type Step5ConsentInput = z.infer<typeof step5ConsentSchema>;

// ─── Combined Onboarding Schema ─────────────────────────

export const fullOnboardingSchema = step1PersonalSchema
  .merge(step2OrganizationSchema)
  .merge(step3RoasterProfileSchema)
  .merge(step4CommercialSchema)
  .merge(step5ConsentSchema);

export type FullOnboardingInput = z.infer<typeof fullOnboardingSchema>;

// ─── API Submit Schema (all fields combined) ────────────

export const onboardingSubmitSchema = step1PersonalSchema
  .merge(step2OrganizationSchema)
  .merge(step3RoasterProfileSchema)
  .merge(step4CommercialSchema)
  .extend({
    termsAccepted: z.boolean().refine((v) => v === true, {
      message: "You must accept the terms and conditions",
    }),
    privacyConsent: z.boolean().refine((v) => v === true, {
      message: "You must consent to the privacy policy",
    }),
    marketingConsent: z.boolean().optional(),
  });

export type OnboardingSubmitInput = z.infer<typeof onboardingSubmitSchema>;
