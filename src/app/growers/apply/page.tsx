"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  MapPin,
  Coffee,
  Award,
  FileCheck,
  Pencil,
  Sprout,
} from "lucide-react";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Checkbox } from "components/ui/checkbox";
import { Separator } from "components/ui/separator";
import { Badge } from "components/ui/badge";
import { Card, CardContent } from "components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

import { AuthBranding } from "components/auth/branding";
import {
  INDIAN_COFFEE_STATES,
  COFFEE_SPECIES_LABELS,
  PROCESSING_METHOD_LABELS,
  CERTIFICATION_TYPE_LABELS,
  GROWER_TYPE_LABELS,
} from "lib/grower/constants";

// ─── Brand colours ─────────────────────────────────────────

const FG = "#1a3c2e";
const LG = "#c9a84c";
const IVORY = "#f5f0e8";
const TXT = "#151513";
const MUTED = "#756e62";
const BORDER = "rgba(21,21,19,.12)";
const BORDER_STRONG = "rgba(21,21,19,.17)";
const ERROR = "#c76331";

// ─── Constants ─────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const GROWER_TYPES = Object.keys(GROWER_TYPE_LABELS) as Array<
  keyof typeof GROWER_TYPE_LABELS
>;
const SPECIES_KEYS = Object.keys(COFFEE_SPECIES_LABELS) as Array<
  keyof typeof COFFEE_SPECIES_LABELS
>;
const PROCESSING_KEYS = Object.keys(PROCESSING_METHOD_LABELS) as Array<
  keyof typeof PROCESSING_METHOD_LABELS
>;
const CERT_KEYS = Object.keys(CERTIFICATION_TYPE_LABELS) as Array<
  keyof typeof CERTIFICATION_TYPE_LABELS
>;

const COMMERCIAL_MODELS = [
  "Direct Trade",
  "FOB",
  "CIF",
  "Ex-Works",
  "Spot Purchase",
  "Forward Contract",
  "Other",
] as const;

const LANGUAGES = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Other",
] as const;

const STEPS = [
  { id: 1, label: "Identity", icon: User },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Production", icon: Coffee },
  { id: 4, label: "Quality & Commercial", icon: Award },
  { id: 5, label: "Review & Consent", icon: FileCheck },
];

// ─── Form state type ───────────────────────────────────────

interface FormData {
  // Step 1
  legalName: string;
  displayName: string;
  growerType: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredLanguage: string;

  // Step 2
  state: string;
  district: string;
  taluk: string;
  village: string;
  estateName: string;
  address: string;
  gpsCoordinates: string;

  // Step 3
  totalAcreage: string;
  coffeeAcreage: string;
  primarySpecies: string;
  allSpecies: string[];
  annualProductionKg: string;
  harvestMonths: string[];
  varieties: string;
  processingMethods: string[];

  // Step 4
  typicalCupScore: string;
  cuppingExperience: string;
  laboratoryTesting: string;
  sampleAvailability: string;
  typicalLotSizeKg: string;
  minLotSizeKg: string;
  exportExperience: string;
  exportMarkets: string;
  preferredCommercialModel: string;
  priceExpectationUsdKg: string;
  certifications: string[];
  sustainabilityPractices: string;
  growerStory: string;

  // Step 5
  consentStorage: boolean;
  consentAccuracy: boolean;
}

const INITIAL_FORM: FormData = {
  legalName: "",
  displayName: "",
  growerType: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  preferredLanguage: "",
  state: "",
  district: "",
  taluk: "",
  village: "",
  estateName: "",
  address: "",
  gpsCoordinates: "",
  totalAcreage: "",
  coffeeAcreage: "",
  primarySpecies: "",
  allSpecies: [],
  annualProductionKg: "",
  harvestMonths: [],
  varieties: "",
  processingMethods: [],
  typicalCupScore: "",
  cuppingExperience: "",
  laboratoryTesting: "",
  sampleAvailability: "",
  typicalLotSizeKg: "",
  minLotSizeKg: "",
  exportExperience: "",
  exportMarkets: "",
  preferredCommercialModel: "",
  priceExpectationUsdKg: "",
  certifications: [],
  sustainabilityPractices: "",
  growerStory: "",
  consentStorage: false,
  consentAccuracy: false,
};

// ─── Checkbox Group ────────────────────────────────────────

function CheckboxGroup({
  label,
  options,
  values,
  labelsMap,
  onChange,
}: {
  label: string;
  options: readonly string[];
  values: string[];
  labelsMap: Record<string, string>;
  onChange: (selected: string[]) => void;
}) {
  const toggle = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter((v) => v !== option));
    } else {
      onChange([...values, option]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs uppercase tracking-[0.1em]" style={{ color: TXT }}>
        {label}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${
              values.includes(option)
                ? "border-[#c9a84c]/60 bg-[#c9a84c]/10 text-[#c9a84c]"
                : `border-[${BORDER_STRONG}] bg-transparent text-[#756e62] hover:border-[#c9a84c]/50`
            }`}
          >
            <span
              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-[2px] border border-current shrink-0"
            >
              {values.includes(option) && (
                <Check className="h-2.5 w-2.5 text-[#c9a84c]" />
              )}
            </span>
            {labelsMap[option] ?? option}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Review Section ────────────────────────────────────────

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: BORDER }}>
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: TXT }}
        >
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-xs transition-colors hover:text-[#c76331]"
          style={{ color: LG }}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export default function GrowerApplyPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ─── Update helpers ────────────────────────────────────────

  const set = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ─── Validation per step ───────────────────────────────────

  const validateStep = useCallback(
    (s: number): string | null => {
      if (s === 1) {
        if (!form.legalName.trim()) return "Legal name is required";
        if (!form.displayName.trim()) return "Operating / display name is required";
      }
      return null;
    },
    [form],
  );

  // ─── Navigation ───────────────────────────────────────────

  const handleNext = useCallback(() => {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    if (step < 5) setStep(step + 1);
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const goToStep = useCallback(
    (s: number) => {
      if (s < step) setStep(s);
    },
    [step],
  );

  // ─── Submit ────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!form.consentStorage) {
      toast.error("Please accept the data consent to continue");
      return;
    }
    if (!form.consentAccuracy) {
      toast.error("Please confirm the accuracy of your information");
      return;
    }
    if (!form.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setSubmitting(true);
    try {
      // Parse GPS coordinates
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (form.gpsCoordinates.trim()) {
        const parts = form.gpsCoordinates
          .split(/[\s,]+/)
          .map(Number)
          .filter((n) => !isNaN(n));
        if (parts.length >= 2) {
          latitude = parts[0];
          longitude = parts[1];
        }
      }

      const payload = {
        displayName: form.displayName.trim(),
        legalName: form.legalName.trim() || undefined,
        growerType: form.growerType || undefined,
        contactName: form.contactName.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        languages: form.preferredLanguage
          ? JSON.stringify([form.preferredLanguage])
          : undefined,

        // Location
        state: form.state || undefined,
        district: form.district.trim() || undefined,
        taluk: form.taluk.trim() || undefined,
        village: form.village.trim() || undefined,
        address: form.estateName.trim()
          ? [form.estateName.trim(), form.address.trim()].filter(Boolean).join(", ",
            )
          : form.address.trim() || undefined,
        latitude,
        longitude,

        // Production
        totalAcreage: form.totalAcreage
          ? parseFloat(form.totalAcreage)
          : undefined,
        coffeeAcreage: form.coffeeAcreage
          ? parseFloat(form.coffeeAcreage)
          : undefined,
        primarySpecies: (form.primarySpecies || undefined) as
          | "ARABICA"
          | "ROBUSTA"
          | "LIBERICA"
          | "EXCELSA"
          | undefined,
        allSpecies:
          form.allSpecies.length > 0
            ? JSON.stringify(form.allSpecies)
            : undefined,
        annualProductionKg: form.annualProductionKg
          ? parseFloat(form.annualProductionKg)
          : undefined,
        harvestMonths:
          form.harvestMonths.length > 0
            ? JSON.stringify(form.harvestMonths)
            : undefined,
        varietals: form.varieties.trim()
          ? JSON.stringify(
              form.varieties
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean),
            )
          : undefined,
        processingMethods:
          form.processingMethods.length > 0
            ? JSON.stringify(form.processingMethods)
            : undefined,

        // Quality
        typicalCupScore: form.typicalCupScore
          ? parseFloat(form.typicalCupScore)
          : undefined,
        cuppingExperience: form.cuppingExperience.trim() || undefined,
        laboratoryTesting:
          form.laboratoryTesting === "yes" ? true : undefined,
        sampleAvailability:
          form.sampleAvailability === "yes" ? true : undefined,

        // Commercial
        typicalLotSizeKg: form.typicalLotSizeKg
          ? parseFloat(form.typicalLotSizeKg)
          : undefined,
        minLotSizeKg: form.minLotSizeKg
          ? parseFloat(form.minLotSizeKg)
          : undefined,
        exportExperience:
          form.exportExperience === "yes" ? true : undefined,
        existingExportMarkets: form.exportMarkets.trim()
          ? JSON.stringify(
              form.exportMarkets
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean),
            )
          : undefined,
        preferredCommercialModel:
          form.preferredCommercialModel || undefined,
        priceExpectationUsdKg: form.priceExpectationUsdKg
          ? parseFloat(form.priceExpectationUsdKg)
          : undefined,
        sustainabilityPractices:
          form.sustainabilityPractices.trim() || undefined,
        growerStory: form.growerStory.trim() || undefined,
      };

      // Also send certifications as separate payload hint
      // Certifications are stored as a relation, not a JSON field.
      // The API will handle them; for now we embed them in metadata.
      const res = await fetch("/api/growers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          certifications: form.certifications.length > 0 ? JSON.stringify(form.certifications) : undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        const msg =
          result.details
            ? Object.values(result.details).flat().join(" ")
            : result.error || "Submission failed. Please try again.";
        toast.error(msg);
        return;
      }

      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  // ─── Success screen ────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <AuthBranding />
        <div
          className="mt-8 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${FG}15` }}
        >
          <Sprout className="h-8 w-8" style={{ color: FG }} />
        </div>
        <h1
          className="mt-6 text-2xl font-['Georgia',serif] tracking-tight"
          style={{ color: TXT }}
        >
          Application Received
        </h1>
        <p className="mt-2 max-w-md text-sm" style={{ color: MUTED }}>
          Thank you for applying to join the House of Lotus grower network.
          Our team will review your application and reach out within 5-7
          business days.
        </p>
        <div
          className="mt-6 rounded-lg border p-4 text-sm"
          style={{
            borderColor: BORDER,
            backgroundColor: IVORY,
            color: TXT,
          }}
        >
          <strong>What happens next?</strong>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-left text-xs" style={{ color: MUTED }}>
            <li>We verify your information and coffee credentials</li>
            <li>A sourcing specialist may reach out for clarification</li>
            <li>Approved growers gain access to our roaster marketplace</li>
          </ol>
        </div>
        <Button
          className="mt-8 text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ backgroundColor: LG, color: "#14110d" }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#b8963b")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = LG)
          }
          onClick={() => setForm(INITIAL_FORM)}
        >
          Submit Another Application
        </Button>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-center">
        <AuthBranding />
        <div
          className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ backgroundColor: `${FG}10`, color: FG }}
        >
          <Sprout className="h-3 w-3" />
          Grower Application
        </div>
        <h1
          className="mt-3 font-['Georgia',serif] text-2xl tracking-tight md:text-3xl"
          style={{ color: TXT }}
        >
          Join Our Grower Network
        </h1>
        <p className="mt-2 text-sm" style={{ color: MUTED }}>
          Tell us about your coffee estate — no commitment required
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="relative flex items-center justify-between">
          <div
            className="absolute left-8 right-8 top-5 z-0 h-px"
            style={{ backgroundColor: BORDER_STRONG }}
          />
          <div
            className="absolute left-8 top-5 z-0 h-px transition-all duration-500"
            style={{
              backgroundColor: LG,
              width: `${((step - 1) / (STEPS.length - 1)) * (100 - 16 / STEPS.length)}%`,
            }}
          />

          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isCompleted = s.id < step;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToStep(s.id)}
                disabled={s.id > step}
                className={`relative z-10 flex cursor-pointer flex-col items-center gap-1.5 group ${
                  s.id > step
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isCompleted
                      ? "border-transparent text-white"
                      : isActive
                        ? `border-transparent text-white`
                        : `border-[${BORDER_STRONG}] text-[#b5ad9e]`
                  }`}
                  style={{
                    backgroundColor: isCompleted || isActive ? FG : "white",
                    borderColor: isCompleted || isActive ? FG : BORDER_STRONG,
                    color: isCompleted || isActive ? "white" : "#b5ad9e",
                  }}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`hidden text-[10px] uppercase tracking-[0.1em] sm:block ${
                    isActive ? "font-semibold" : ""
                  }`}
                  style={{ color: isActive ? FG : MUTED }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Card */}
      <Card
        className="border shadow-sm"
        style={{
          borderColor: BORDER,
          backgroundColor: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        <CardContent className="p-6 md:p-8">
          {step === 1 && (
            <Step1Identity form={form} set={set} />
          )}
          {step === 2 && (
            <Step2Location form={form} set={set} />
          )}
          {step === 3 && (
            <Step3Production
              form={form}
              set={set}
            />
          )}
          {step === 4 && (
            <Step4Quality
              form={form}
              set={set}
            />
          )}
          {step === 5 && (
            <Step5Review form={form} set={set} goToStep={goToStep} />
          )}
        </CardContent>

        {/* Navigation */}
        <div
          className="flex items-center justify-between px-6 pb-6 md:px-8 md:pb-8"
        >
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1 || submitting}
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: MUTED }}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#b5ad9e]">
              Step {step} of {STEPS.length}
            </span>
            {step < 5 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="h-11 px-6 text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
                style={{ backgroundColor: LG, color: "#14110d" }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#b8963b")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = LG)
                }
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="h-11 px-6 text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
                style={{ backgroundColor: LG, color: "#14110d" }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#b8963b")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = LG)
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit Application
                    <Check className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-[#b5ad9e]">
        All fields are optional except where marked with *
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 1: Identity
// ═══════════════════════════════════════════════════════════

function Step1Identity({
  form,
  set,
}: {
  form: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2
          className="font-['Georgia',serif] text-xl"
          style={{ color: TXT }}
        >
          Identity
        </h2>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          Basic information about your coffee business.
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="legalName"
          className="text-xs uppercase tracking-[0.1em]"
          style={{ color: TXT }}
        >
          Legal name *
        </Label>
        <Input
          id="legalName"
          value={form.legalName}
          onChange={(e) => set("legalName", e.target.value)}
          placeholder="Registered business name"
          className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="displayName"
          className="text-xs uppercase tracking-[0.1em]"
          style={{ color: TXT }}
        >
          Operating / display name *
        </Label>
        <Input
          id="displayName"
          value={form.displayName}
          onChange={(e) => set("displayName", e.target.value)}
          placeholder="How you want to appear to buyers"
          className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="growerType"
          className="text-xs uppercase tracking-[0.1em]"
          style={{ color: TXT }}
        >
          Grower type
        </Label>
        <Select
          value={form.growerType}
          onValueChange={(v) => set("growerType", v)}
        >
          <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {GROWER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {GROWER_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator style={{ backgroundColor: `${BORDER}` }} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="contactName"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Contact person name
          </Label>
          <Input
            id="contactName"
            value={form.contactName}
            onChange={(e) => set("contactName", e.target.value)}
            placeholder="Full name"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="contactEmail"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Email
          </Label>
          <Input
            id="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            placeholder="you@example.com"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="contactPhone"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Phone
          </Label>
          <Input
            id="contactPhone"
            value={form.contactPhone}
            onChange={(e) => set("contactPhone", e.target.value)}
            placeholder="+91 98765 43210"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="preferredLanguage"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Preferred language
          </Label>
          <Select
            value={form.preferredLanguage}
            onValueChange={(v) => set("preferredLanguage", v)}
          >
            <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 2: Location
// ═══════════════════════════════════════════════════════════

function Step2Location({
  form,
  set,
}: {
  form: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2
          className="font-['Georgia',serif] text-xl"
          style={{ color: TXT }}
        >
          Location
        </h2>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          Where is your coffee grown?
        </p>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="state"
          className="text-xs uppercase tracking-[0.1em]"
          style={{ color: TXT }}
        >
          State
        </Label>
        <Select value={form.state} onValueChange={(v) => set("state", v)}>
          <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]">
            <SelectValue placeholder="Select your state" />
          </SelectTrigger>
          <SelectContent>
            {INDIAN_COFFEE_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(
          [
            ["district", "District"],
            ["taluk", "Taluk"],
            ["village", "Village"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-2">
            <Label
              htmlFor={key}
              className="text-xs uppercase tracking-[0.1em]"
              style={{ color: TXT }}
            >
              {label}
            </Label>
            <Input
              id={key}
              value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={label}
              className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="estateName"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Estate name
          </Label>
          <Input
            id="estateName"
            value={form.estateName}
            onChange={(e) => set("estateName", e.target.value)}
            placeholder="Name of your estate"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="gpsCoordinates"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            GPS coordinates{" "}
            <span style={{ color: MUTED }}>(optional)</span>
          </Label>
          <Input
            id="gpsCoordinates"
            value={form.gpsCoordinates}
            onChange={(e) => set("gpsCoordinates", e.target.value)}
            placeholder="12.2958, 76.6394"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="address"
          className="text-xs uppercase tracking-[0.1em]"
          style={{ color: TXT }}
        >
          Address
        </Label>
        <Textarea
          id="address"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Street address, landmark, etc."
          rows={3}
          className="border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 3: Production
// ═══════════════════════════════════════════════════════════

function Step3Production({
  form,
  set,
}: {
  form: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2
          className="font-['Georgia',serif] text-xl"
          style={{ color: TXT }}
        >
          Production
        </h2>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          Tell us about your coffee cultivation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="totalAcreage"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Total acreage
          </Label>
          <Input
            id="totalAcreage"
            type="number"
            min="0"
            value={form.totalAcreage}
            onChange={(e) => set("totalAcreage", e.target.value)}
            placeholder="100"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="coffeeAcreage"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Coffee acreage
          </Label>
          <Input
            id="coffeeAcreage"
            type="number"
            min="0"
            value={form.coffeeAcreage}
            onChange={(e) => set("coffeeAcreage", e.target.value)}
            placeholder="50"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
      </div>

      <Separator style={{ backgroundColor: BORDER }} />

      <div className="space-y-2">
        <Label
          htmlFor="primarySpecies"
          className="text-xs uppercase tracking-[0.1em]"
          style={{ color: TXT }}
        >
          Primary species
        </Label>
        <Select
          value={form.primarySpecies}
          onValueChange={(v) => set("primarySpecies", v)}
        >
          <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]">
            <SelectValue placeholder="Select primary species" />
          </SelectTrigger>
          <SelectContent>
            {SPECIES_KEYS.map((s) => (
              <SelectItem key={s} value={s}>
                {COFFEE_SPECIES_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CheckboxGroup
        label="All species grown"
        options={SPECIES_KEYS}
        values={form.allSpecies}
        labelsMap={COFFEE_SPECIES_LABELS as unknown as Record<string, string>}
        onChange={(selected) =>
          set("allSpecies", selected as unknown as string[])
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="annualProductionKg"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Annual production (kg)
          </Label>
          <Input
            id="annualProductionKg"
            type="number"
            min="0"
            value={form.annualProductionKg}
            onChange={(e) => set("annualProductionKg", e.target.value)}
            placeholder="10000"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="varieties"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Varieties
          </Label>
          <Input
            id="varieties"
            value={form.varieties}
            onChange={(e) => set("varieties", e.target.value)}
            placeholder="SLN-9, S-795, Cauvery"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
          <p className="text-xs" style={{ color: MUTED }}>
            Comma-separated
          </p>
        </div>
      </div>

      <Separator style={{ backgroundColor: BORDER }} />

      <CheckboxGroup
        label="Harvest period"
        options={MONTHS}
        values={form.harvestMonths}
        labelsMap={Object.fromEntries(
          MONTHS.map((m) => [m, m]),
        )}
        onChange={(selected) =>
          set("harvestMonths", selected as unknown as string[])
        }
      />

      <CheckboxGroup
        label="Processing methods"
        options={PROCESSING_KEYS}
        values={form.processingMethods}
        labelsMap={
          PROCESSING_METHOD_LABELS as unknown as Record<string, string>
        }
        onChange={(selected) => {
          set(
            "processingMethods",
            selected as unknown as string[],
          );
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 4: Quality & Commercial
// ═══════════════════════════════════════════════════════════

function Step4Quality({
  form,
  set,
}: {
  form: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2
          className="font-['Georgia',serif] text-xl"
          style={{ color: TXT }}
        >
          Quality & Commercial
        </h2>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          Help us understand your coffee quality and commercial preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="typicalCupScore"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Typical cup score
          </Label>
          <Input
            id="typicalCupScore"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.typicalCupScore}
            onChange={(e) => set("typicalCupScore", e.target.value)}
            placeholder="82.5"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="cuppingExperience"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Cupping experience
          </Label>
          <Input
            id="cuppingExperience"
            value={form.cuppingExperience}
            onChange={(e) => set("cuppingExperience", e.target.value)}
            placeholder="e.g. SCA certified Q-grader"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(
          [
            ["laboratoryTesting", "Lab testing available"],
            ["sampleAvailability", "Sample availability"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-2">
            <Label
              htmlFor={key}
              className="text-xs uppercase tracking-[0.1em]"
              style={{ color: TXT }}
            >
              {label}
            </Label>
            <Select
              value={form[key]}
              onValueChange={(v) => set(key, v)}
            >
              <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]">
                <SelectValue placeholder="Yes / No" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <Separator style={{ backgroundColor: BORDER }} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="typicalLotSizeKg"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Typical lot size (kg)
          </Label>
          <Input
            id="typicalLotSizeKg"
            type="number"
            min="0"
            value={form.typicalLotSizeKg}
            onChange={(e) => set("typicalLotSizeKg", e.target.value)}
            placeholder="500"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="minLotSizeKg"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Minimum lot size (kg)
          </Label>
          <Input
            id="minLotSizeKg"
            type="number"
            min="0"
            value={form.minLotSizeKg}
            onChange={(e) => set("minLotSizeKg", e.target.value)}
            placeholder="100"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="exportExperience"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Export experience
          </Label>
          <Select
            value={form.exportExperience}
            onValueChange={(v) => set("exportExperience", v)}
          >
            <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]">
              <SelectValue placeholder="Yes / No" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="exportMarkets"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Export markets
          </Label>
          <Input
            id="exportMarkets"
            value={form.exportMarkets}
            onChange={(e) => set("exportMarkets", e.target.value)}
            placeholder="USA, Germany, Japan"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
          <p className="text-xs" style={{ color: MUTED }}>
            Comma-separated
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="preferredCommercialModel"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Preferred commercial model
          </Label>
          <Select
            value={form.preferredCommercialModel}
            onValueChange={(v) => set("preferredCommercialModel", v)}
          >
            <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {COMMERCIAL_MODELS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="priceExpectationUsdKg"
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: TXT }}
          >
            Price expectation (USD/kg)
          </Label>
          <Input
            id="priceExpectationUsdKg"
            type="number"
            min="0"
            step="0.01"
            value={form.priceExpectationUsdKg}
            onChange={(e) =>
              set("priceExpectationUsdKg", e.target.value)
            }
            placeholder="6.50"
            className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
          />
        </div>
      </div>

      <Separator style={{ backgroundColor: BORDER }} />

      <CheckboxGroup
        label="Certifications"
        options={CERT_KEYS}
        values={form.certifications}
        labelsMap={
          CERTIFICATION_TYPE_LABELS as unknown as Record<
            string,
            string
          >
        }
        onChange={(selected) => {
          set(
            "certifications",
            selected as unknown as string[],
          );
        }}
      />

      <div className="space-y-2">
        <Label
          htmlFor="sustainabilityPractices"
          className="text-xs uppercase tracking-[0.1em]"
          style={{ color: TXT }}
        >
          Sustainability practices
        </Label>
        <Textarea
          id="sustainabilityPractices"
          value={form.sustainabilityPractices}
          onChange={(e) =>
            set("sustainabilityPractices", e.target.value)
          }
          placeholder="Shade-grown, rainwater harvesting, organic composting..."
          rows={3}
          className="border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="growerStory"
          className="text-xs uppercase tracking-[0.1em]"
          style={{ color: TXT }}
        >
          Your story
        </Label>
        <Textarea
          id="growerStory"
          value={form.growerStory}
          onChange={(e) => set("growerStory", e.target.value)}
          placeholder="Share the story of your estate, your journey in coffee, and what makes your beans special..."
          rows={4}
          className="border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c9a84c]"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 5: Review & Consent
// ═══════════════════════════════════════════════════════════

function hasValue(v: string | undefined | null) {
  return v !== undefined && v !== null && v.trim() !== "";
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span
        className="text-xs uppercase tracking-wider"
        style={{ color: MUTED }}
      >
        {label}
      </span>
      <p style={{ color: TXT }}>{value || "—"}</p>
    </div>
  );
}

function Step5Review({
  form,
  set,
  goToStep,
}: {
  form: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  goToStep: (step: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2
          className="font-['Georgia',serif] text-xl"
          style={{ color: TXT }}
        >
          Review & Submit
        </h2>
        <p className="mt-1 text-sm" style={{ color: MUTED }}>
          Review your information before submitting your grower application.
        </p>
      </div>

      {/* Identity Review */}
      <ReviewSection title="Identity" onEdit={() => goToStep(1)}>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <ReviewRow label="Legal name" value={form.legalName} />
          <ReviewRow label="Display name" value={form.displayName} />
          {form.growerType && (
            <ReviewRow
              label="Type"
              value={GROWER_TYPE_LABELS[form.growerType as keyof typeof GROWER_TYPE_LABELS] ?? form.growerType}
            />
          )}
          {hasValue(form.contactName) && (
            <ReviewRow label="Contact" value={form.contactName} />
          )}
          {hasValue(form.contactEmail) && (
            <ReviewRow label="Email" value={form.contactEmail} />
          )}
          {hasValue(form.contactPhone) && (
            <ReviewRow label="Phone" value={form.contactPhone} />
          )}
          {hasValue(form.preferredLanguage) && (
            <ReviewRow
              label="Language"
              value={form.preferredLanguage}
            />
          )}
        </div>
      </ReviewSection>

      {/* Location Review */}
      <ReviewSection title="Location" onEdit={() => goToStep(2)}>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {form.state && <ReviewRow label="State" value={form.state} />}
          {hasValue(form.district) && (
            <ReviewRow label="District" value={form.district} />
          )}
          {hasValue(form.taluk) && (
            <ReviewRow label="Taluk" value={form.taluk} />
          )}
          {hasValue(form.village) && (
            <ReviewRow label="Village" value={form.village} />
          )}
          {hasValue(form.estateName) && (
            <ReviewRow label="Estate" value={form.estateName} />
          )}
          {hasValue(form.address) && (
            <div className="sm:col-span-2">
              <ReviewRow
                label="Address"
                value={form.address}
              />
            </div>
          )}
        </div>
      </ReviewSection>

      {/* Production Review */}
      <ReviewSection title="Production" onEdit={() => goToStep(3)}>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {hasValue(form.totalAcreage) && (
            <ReviewRow
              label="Total acreage"
              value={`${form.totalAcreage} acres`}
            />
          )}
          {hasValue(form.coffeeAcreage) && (
            <ReviewRow
              label="Coffee acreage"
              value={`${form.coffeeAcreage} acres`}
            />
          )}
          {form.primarySpecies && (
            <ReviewRow
              label="Primary species"
              value={
                COFFEE_SPECIES_LABELS[
                  form.primarySpecies as keyof typeof COFFEE_SPECIES_LABELS
                ] ?? form.primarySpecies
              }
            />
          )}
          {form.allSpecies.length > 0 && (
            <div className="sm:col-span-2">
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: MUTED }}
              >
                All species
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {form.allSpecies.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="border-0 text-xs"
                    style={{
                      backgroundColor: `${LG}15`,
                      color: LG,
                    }}
                  >
                    {COFFEE_SPECIES_LABELS[s as keyof typeof COFFEE_SPECIES_LABELS] ?? s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {hasValue(form.annualProductionKg) && (
            <ReviewRow
              label="Annual production"
              value={`${Number(form.annualProductionKg).toLocaleString()} kg`}
            />
          )}
          {hasValue(form.varieties) && (
            <ReviewRow label="Varieties" value={form.varieties} />
          )}
          {form.harvestMonths.length > 0 && (
            <div className="sm:col-span-2">
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: MUTED }}
              >
                Harvest months
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {form.harvestMonths.map((m) => (
                  <Badge
                    key={m}
                    variant="secondary"
                    className="border-0 text-xs"
                    style={{
                      backgroundColor: `${FG}10`,
                      color: FG,
                    }}
                  >
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {form.processingMethods.length > 0 && (
            <div className="sm:col-span-2">
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: MUTED }}
              >
                Processing methods
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {form.processingMethods.map((m) => (
                  <Badge
                    key={m}
                    variant="secondary"
                    className="border-0 text-xs"
                    style={{
                      backgroundColor: `${LG}15`,
                      color: LG,
                    }}
                  >
                    {PROCESSING_METHOD_LABELS[m as keyof typeof PROCESSING_METHOD_LABELS] ?? m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </ReviewSection>

      {/* Quality & Commercial Review */}
      <ReviewSection title="Quality & Commercial" onEdit={() => goToStep(4)}>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {hasValue(form.typicalCupScore) && (
            <ReviewRow
              label="Cup score"
              value={form.typicalCupScore}
            />
          )}
          {hasValue(form.cuppingExperience) && (
            <ReviewRow
              label="Cupping experience"
              value={form.cuppingExperience}
            />
          )}
          {form.laboratoryTesting && (
            <ReviewRow
              label="Lab testing"
              value={
                form.laboratoryTesting === "yes" ? "Yes" : "No"
              }
            />
          )}
          {form.sampleAvailability && (
            <ReviewRow
              label="Sample availability"
              value={
                form.sampleAvailability === "yes" ? "Yes" : "No"
              }
            />
          )}
          {hasValue(form.typicalLotSizeKg) && (
            <ReviewRow
              label="Typical lot size"
              value={`${Number(form.typicalLotSizeKg).toLocaleString()} kg`}
            />
          )}
          {hasValue(form.minLotSizeKg) && (
            <ReviewRow
              label="Min lot size"
              value={`${Number(form.minLotSizeKg).toLocaleString()} kg`}
            />
          )}
          {form.exportExperience && (
            <ReviewRow
              label="Export experience"
              value={
                form.exportExperience === "yes" ? "Yes" : "No"
              }
            />
          )}
          {hasValue(form.exportMarkets) && (
            <ReviewRow
              label="Export markets"
              value={form.exportMarkets}
            />
          )}
          {form.preferredCommercialModel && (
            <ReviewRow
              label="Commercial model"
              value={form.preferredCommercialModel}
            />
          )}
          {hasValue(form.priceExpectationUsdKg) && (
            <ReviewRow
              label="Price expectation"
              value={`$${form.priceExpectationUsdKg}/kg USD`}
            />
          )}
          {form.certifications.length > 0 && (
            <div className="sm:col-span-2">
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: MUTED }}
              >
                Certifications
              </span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {form.certifications.map((c) => (
                  <Badge
                    key={c}
                    variant="secondary"
                    className="border-0 text-xs"
                    style={{
                      backgroundColor: `${LG}15`,
                      color: LG,
                    }}
                  >
                    {CERTIFICATION_TYPE_LABELS[c as keyof typeof CERTIFICATION_TYPE_LABELS] ?? c}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {hasValue(form.sustainabilityPractices) && (
            <div className="sm:col-span-2">
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: MUTED }}
              >
                Sustainability
              </span>
              <p className="mt-1" style={{ color: TXT }}>
                {form.sustainabilityPractices}
              </p>
            </div>
          )}
          {hasValue(form.growerStory) && (
            <div className="sm:col-span-2">
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: MUTED }}
              >
                Grower story
              </span>
              <p className="mt-1" style={{ color: TXT }}>
                {form.growerStory}
              </p>
            </div>
          )}
        </div>
      </ReviewSection>

      <Separator style={{ backgroundColor: BORDER }} />

      {/* Consent */}
      <div className="space-y-4">
        <h3
          className="font-['Georgia',serif] text-lg"
          style={{ color: TXT }}
        >
          Terms & Consent
        </h3>

        <div className="space-y-3">
          <div
            className="flex items-start gap-3 rounded-lg border p-3"
            style={{ borderColor: BORDER }}
          >
            <Checkbox
              id="consentStorage"
              checked={form.consentStorage}
              onCheckedChange={(v) =>
                set("consentStorage", v === true)
              }
              className="mt-0.5 data-[state=checked]:border-[#c9a84c] data-[state=checked]:bg-[#c9a84c]"
            />
            <Label
              htmlFor="consentStorage"
              className="cursor-pointer text-sm leading-relaxed"
              style={{ color: TXT }}
            >
              I consent to House of Lotus storing and using my
              information for sourcing and commercial engagement.{" "}
              <span style={{ color: ERROR }}>*</span>
            </Label>
          </div>

          <div
            className="flex items-start gap-3 rounded-lg border p-3"
            style={{ borderColor: BORDER }}
          >
            <Checkbox
              id="consentAccuracy"
              checked={form.consentAccuracy}
              onCheckedChange={(v) =>
                set("consentAccuracy", v === true)
              }
              className="mt-0.5 data-[state=checked]:border-[#c9a84c] data-[state=checked]:bg-[#c9a84c]"
            />
            <Label
              htmlFor="consentAccuracy"
              className="cursor-pointer text-sm leading-relaxed"
              style={{ color: TXT }}
            >
              I confirm the information provided is accurate.{" "}
              <span style={{ color: ERROR }}>*</span>
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
