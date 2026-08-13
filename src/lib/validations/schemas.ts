import { z } from "zod";

// ─── Step 1: Personal Details ─────────────────────────
export const personalDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  jobTitle: z.string().min(1, "Job title is required").max(200),
  phone: z.string().min(5, "Valid phone number required").max(30),
  email: z.string().email("Valid email required"),
});
export type PersonalDetails = z.infer<typeof personalDetailsSchema>;

// ─── Step 2: Organization Details ────────────────────
export const orgDetailsSchema = z.object({
  legalName: z.string().min(1, "Legal name is required").max(300),
  operatingName: z.string().max(300).optional(),
  website: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  businessType: z.string().min(1, "Business type is required"),
  province: z.string().min(1, "Province is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().max(500).optional(),
  postalCode: z
    .string()
    .regex(
      /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
      "Invalid Canadian postal code"
    )
    .optional()
    .or(z.literal("")),
  yearEstablished: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
  numberOfLocations: z.coerce.number().int().min(1).optional(),
});
export type OrgDetails = z.infer<typeof orgDetailsSchema>;

// ─── Step 3: Roaster Profile ──────────────────────────
export const roasterProfileSchema = z.object({
  roastingInHouse: z.boolean(),
  roastingCapacityKgMonth: z.coerce.number().min(0).optional(),
  annualGreenCoffeeKg: z.coerce.number().min(0).optional(),
  currentOrigins: z.string().max(1000).optional(),
  mainCoffeeUse: z.array(z.string()).min(1, "Select at least one use").max(10),
  typicalOrderSize: z.string().max(200).optional(),
  preferredMinOrder: z.string().max(200).optional(),
  importExperience: z.string().max(1000).optional(),
  certificationsRequired: z.array(z.string()).max(20).optional(),
  roasterNotes: z.string().max(2000).optional(),
});
export type RoasterProfile = z.infer<typeof roasterProfileSchema>;

// ─── Step 4: Commercial Preferences ───────────────────
export const commercialPrefsSchema = z.object({
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  preferredSpecies: z.array(z.string()).max(20).optional(),
  preferredProcessingMethods: z.array(z.string()).max(20).optional(),
  preferredFlavourProfiles: z.array(z.string()).max(20).optional(),
  preferredOrigins: z.array(z.string()).max(20).optional(),
  sampleInterest: z.boolean(),
  groupOrderInterest: z.boolean(),
  targetPurchasingTimeline: z.string().max(200).optional(),
});
export type CommercialPrefs = z.infer<typeof commercialPrefsSchema>;

// ─── Step 5: Consent ──────────────────────────────────
export const consentSchema = z.object({
  termsAccepted: z.literal(true, { message: "You must accept the terms" }),
  privacyConsent: z.literal(true, { message: "Privacy consent is required" }),
  marketingConsent: z.boolean().optional(),
});
export type ConsentData = z.infer<typeof consentSchema>;

// ─── Auth ─────────────────────────────────────────────
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters").max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "At least 8 characters").max(128),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ─── Team Invitation ──────────────────────────────────
export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["BUYER_ADMIN", "BUYER_MEMBER"]),
});

// ─── Organization Update ──────────────────────────────
export const updateOrgSchema = z.object({
  operatingName: z.string().max(300).optional(),
  website: z.string().url().or(z.literal("")).optional(),
  businessType: z.string().max(200).optional(),
  province: z.string().max(100).optional(),
  city: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  postalCode: z.string().max(20).optional(),
  yearEstablished: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  numberOfLocations: z.number().int().min(1).optional(),
});

// ─── Admin Actions ────────────────────────────────────
export const adminActionSchema = z.object({
  action: z.enum(["approve", "request_info", "reject", "suspend"]),
  reason: z.string().max(2000).optional(),
});
