"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Building2,
  Coffee,
  SlidersHorizontal,
  FileCheck,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AuthBranding } from "@/components/auth/branding";
import {
  step1PersonalSchema,
  step2OrganizationSchema,
  step3RoasterProfileSchema,
  step4CommercialSchema,
  step5ConsentSchema,
  type Step1PersonalInput,
  type Step2OrganizationInput,
  type Step3RoasterProfileInput,
  type Step4CommercialInput,
  type Step5ConsentInput,
  CANADIAN_PROVINCES,
  PROVINCE_LABELS,
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  COFFEE_USES,
  COFFEE_USE_LABELS,
  IMPORT_EXPERIENCE,
  IMPORT_EXPERIENCE_LABELS,
  COFFEE_SPECIES,
  COFFEE_SPECIES_LABELS,
  PROCESSING_METHODS,
  PROCESSING_METHOD_LABELS,
  FLAVOUR_PROFILES,
  FLAVOUR_PROFILE_LABELS,
  COFFEE_ORIGINS,
  ORIGIN_LABELS,
  PURCHASING_TIMELINES,
  PURCHASING_TIMELINE_LABELS,
} from "@/lib/validations/onboarding";

// ─── Constants ──────────────────────────────────────────

const STORAGE_KEY = "hol_onboarding_data";

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Organization", icon: Building2 },
  { id: 3, label: "Roaster Profile", icon: Coffee },
  { id: 4, label: "Preferences", icon: SlidersHorizontal },
  { id: 5, label: "Review & Submit", icon: FileCheck },
];

// ─── Helper: localStorage persistence ───────────────────

function loadSavedData() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToLocalStorage(data: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

function clearLocalStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Checkbox Group Component ────────────────────────────

function CheckboxGroup({
  label,
  options,
  values,
  labelsMap,
  onChange,
}: {
  label: string;
  options: readonly string[];
  values: string[] | undefined;
  labelsMap: Record<string, string>;
  onChange: (selected: string[]) => void;
}) {
  const current = values ?? [];

  const toggle = (option: string) => {
    if (current.includes(option)) {
      onChange(current.filter((v) => v !== option));
    } else {
      onChange([...current, option]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-[#151513] text-xs uppercase tracking-[0.1em]">
        {label}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors ${
              current.includes(option)
                ? "border-[#c99743] bg-[#c99743]/10 text-[#c99743]"
                : "border-[rgba(21,21,19,.17)] bg-transparent text-[#756e62] hover:border-[#c99743]/50"
            }`}
          >
            <span className="h-3.5 w-3.5 rounded-[2px] border border-current flex items-center justify-center shrink-0">
              {current.includes(option) && (
                <Check className="h-2.5 w-2.5 text-[#c99743]" />
              )}
            </span>
            {labelsMap[option]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Onboarding Page ────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Forms for each step
  const step1Form = useForm<Step1PersonalInput>({
    resolver: zodResolver(step1PersonalSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      jobTitle: "",
      phone: "",
    },
  });

  const step2Form = useForm<Step2OrganizationInput>({
    resolver: zodResolver(step2OrganizationSchema),
    defaultValues: {
      legalName: "",
      operatingName: "",
      website: "",
      businessType: undefined,
      province: undefined,
      city: "",
      address: "",
      postalCode: "",
    },
  });

  const step3Form = useForm<Step3RoasterProfileInput>({
    resolver: zodResolver(step3RoasterProfileSchema),
    defaultValues: {
      roastingInHouse: false,
    },
  });

  const step4Form = useForm<Step4CommercialInput>({
    resolver: zodResolver(step4CommercialSchema),
    defaultValues: {
      sampleInterest: true,
      groupOrderInterest: false,
    },
  });

  const step5Form = useForm<Step5ConsentInput>({
    resolver: zodResolver(step5ConsentSchema),
    defaultValues: {
      termsAccepted: false,
      privacyConsent: false,
      marketingConsent: false,
    },
  });

  // Load saved data on mount
  useState(() => {
    const saved = loadSavedData();
    if (saved) {
      if (saved.step1) step1Form.reset(saved.step1);
      if (saved.step2) step2Form.reset(saved.step2);
      if (saved.step3) step3Form.reset(saved.step3);
      if (saved.step4) step4Form.reset(saved.step4);
      if (saved.step5) step5Form.reset(saved.step5);
    }
  });

  // Save current step data to localStorage
  const persistStep = useCallback(
    (step: number) => {
      const data: Record<string, unknown> = loadSavedData() || {};
      if (step >= 1) data.step1 = step1Form.getValues();
      if (step >= 2) data.step2 = step2Form.getValues();
      if (step >= 3) data.step3 = step3Form.getValues();
      if (step >= 4) data.step4 = step4Form.getValues();
      if (step >= 5) data.step5 = step5Form.getValues();
      saveToLocalStorage(data);
    },
    [step1Form, step2Form, step3Form, step4Form, step5Form]
  );

  // Validate current step and advance; submit on final step
  const handleNext = useCallback(async () => {
    let valid = false;

    switch (currentStep) {
      case 1:
        valid = await step1Form.handleSubmit(() => true)();
        if (typeof valid === "object") valid = false;
        break;
      case 2:
        valid = await step2Form.handleSubmit(() => true)();
        if (typeof valid === "object") valid = false;
        break;
      case 3:
        valid = await step3Form.handleSubmit(() => true)();
        if (typeof valid === "object") valid = false;
        break;
      case 4:
        valid = await step4Form.handleSubmit(() => true)();
        if (typeof valid === "object") valid = false;
        break;
      case 5:
        valid = await step5Form.handleSubmit(() => true)();
        if (typeof valid === "object") valid = false;
        break;
    }

    if (!valid) return;

    persistStep(currentStep);

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Step 5: submit the application
    setSubmitting(true);
    try {
      const payload = {
        ...step1Form.getValues(),
        ...step2Form.getValues(),
        ...step3Form.getValues(),
        ...step4Form.getValues(),
        ...step5Form.getValues(),
      };

      const res = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Submission failed. Please try again.");
        return;
      }

      clearLocalStorage();
      toast.success("Application submitted successfully!");
      router.push("/pending-approval");
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  }, [currentStep, step1Form, step2Form, step3Form, step4Form, step5Form, persistStep, router]);

  const handleBack = useCallback(() => {
    persistStep(currentStep);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, persistStep]);

  const goToStep = useCallback(
    (step: number) => {
      persistStep(currentStep);
      setCurrentStep(step);
    },
    [currentStep, persistStep]
  );

  // Collect all form data for review
  const getAllData = () => ({
    step1: step1Form.getValues(),
    step2: step2Form.getValues(),
    step3: step3Form.getValues(),
    step4: step4Form.getValues(),
    step5: step5Form.getValues(),
  });

  // ─── Render ──────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#f2eee5] py-8 px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <AuthBranding />
          <h1 className="font-['Georgia',serif] text-2xl md:text-3xl tracking-tight text-[#151513] mt-4">
            Buyer Application
          </h1>
          <p className="text-sm text-[#756e62] mt-2">
            Complete your buyer profile to access our wholesale portal
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress line behind */}
            <div className="absolute top-5 left-8 right-8 h-px bg-[rgba(21,21,19,.12)] z-0" />
            <div
              className="absolute top-5 left-8 h-px bg-[#c99743] z-0 transition-all duration-500"
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * (100 - (16 / STEPS.length))}%`,
              }}
            />

            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (step.id < currentStep) goToStep(step.id);
                  }}
                  disabled={step.id > currentStep}
                  className={`relative z-10 flex flex-col items-center gap-1.5 group ${
                    step.id > currentStep ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-[#c99743] border-[#c99743] text-white"
                        : isActive
                          ? "bg-white border-[#c99743] text-[#c99743]"
                          : "bg-white border-[rgba(21,21,19,.17)] text-[#b5ad9e]"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-[0.1em] hidden sm:block ${
                      isActive ? "text-[#c99743] font-semibold" : "text-[#756e62]"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content Card */}
        <Card className="border-[rgba(21,21,19,.12)] shadow-sm bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            {currentStep === 1 && <Step1Form form={step1Form} />}
            {currentStep === 2 && <Step2Form form={step2Form} />}
            {currentStep === 3 && <Step3Form form={step3Form} />}
            {currentStep === 4 && <Step4Form form={step4Form} />}
            {currentStep === 5 && (
              <Step5Review
                form={step5Form}
                data={getAllData()}
                goToStep={goToStep}
              />
            )}
          </CardContent>

          {/* Navigation */}
          <div className="px-6 md:px-8 pb-6 md:pb-8 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || submitting}
              className="text-[#756e62] hover:text-[#151513] text-xs uppercase tracking-[0.1em]"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#b5ad9e]">
                Step {currentStep} of {STEPS.length}
              </span>
              <Button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="h-11 bg-[#c99743] hover:bg-[#b8862e] text-[#14110d] font-semibold text-xs uppercase tracking-[0.14em] px-6 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : currentStep === 5 ? (
                  <>
                    Submit Application
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-[#b5ad9e] mt-6">
          Your progress is saved automatically as you go
        </p>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 1: Personal Details
// ═══════════════════════════════════════════════════════════

function Step1Form({
  form,
}: {
  form: ReturnType<typeof useForm<Step1PersonalInput>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Georgia',serif] text-xl text-[#151513]">
          Personal Details
        </h2>
        <p className="text-sm text-[#756e62] mt-1">
          Tell us about yourself — the primary contact for your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          form={form}
          name="firstName"
          label="First name *"
          placeholder="Jane"
        />
        <FormField
          form={form}
          name="lastName"
          label="Last name *"
          placeholder="Doe"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          form={form}
          name="jobTitle"
          label="Job title"
          placeholder="Head of Coffee"
        />
        <FormField
          form={form}
          name="phone"
          label="Phone number"
          placeholder="+1 (416) 555-0123"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 2: Organization Details
// ═══════════════════════════════════════════════════════════

function Step2Form({
  form,
}: {
  form: ReturnType<typeof useForm<Step2OrganizationInput>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Georgia',serif] text-xl text-[#151513]">
          Organization Details
        </h2>
        <p className="text-sm text-[#756e62] mt-1">
          Information about your business entity.
        </p>
      </div>

      <FormField
        form={form}
        name="legalName"
        label="Legal business name *"
        placeholder="Acme Coffee Roasters Inc."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          form={form}
          name="operatingName"
          label="Operating name"
          placeholder="Acme Coffee"
        />
        <FormField
          form={form}
          name="website"
          label="Website"
          placeholder="https://acmecoffee.ca"
        />
      </div>

      {/* Business Type Select */}
      <div className="space-y-2">
        <Label
          htmlFor="businessType"
          className="text-[#151513] text-xs uppercase tracking-[0.1em]"
        >
          Business type *
        </Label>
        <Controller
          control={form.control}
          name="businessType"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]">
                <SelectValue placeholder="Select your business type" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {BUSINESS_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.businessType && (
          <p className="text-xs text-[#c76331]">
            {form.formState.errors.businessType.message}
          </p>
        )}
      </div>

      {/* Location fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="province"
            className="text-[#151513] text-xs uppercase tracking-[0.1em]"
          >
            Province *
          </Label>
          <Controller
            control={form.control}
            name="province"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {CANADIAN_PROVINCES.map((prov) => (
                    <SelectItem key={prov} value={prov}>
                      {PROVINCE_LABELS[prov]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.province && (
            <p className="text-xs text-[#c76331]">
              {form.formState.errors.province.message}
            </p>
          )}
        </div>

        <FormField
          form={form}
          name="city"
          label="City *"
          placeholder="Toronto"
        />
      </div>

      <FormField
        form={form}
        name="address"
        label="Street address"
        placeholder="123 Coffee Lane, Suite 400"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          form={form}
          name="postalCode"
          label="Postal code"
          placeholder="M5V 3A9"
        />
        <FormField
          form={form}
          name="yearEstablished"
          label="Year established"
          placeholder="2018"
          type="number"
        />
        <FormField
          form={form}
          name="numberOfLocations"
          label="Number of locations"
          placeholder="5"
          type="number"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 3: Roaster Profile
// ═══════════════════════════════════════════════════════════

function Step3Form({
  form,
}: {
  form: ReturnType<typeof useForm<Step3RoasterProfileInput>>;
}) {
  const roastingInHouse = form.watch("roastingInHouse");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Georgia',serif] text-xl text-[#151513]">
          Roaster Profile
        </h2>
        <p className="text-sm text-[#756e62] mt-1">
          Help us understand your roasting and coffee sourcing operations.
        </p>
      </div>

      {/* Roasting In-House Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-[rgba(21,21,19,.12)] bg-[#f2eee5]/40">
        <div>
          <Label className="text-[#151513] text-sm font-medium">
            Do you roast in-house?
          </Label>
          <p className="text-xs text-[#756e62] mt-0.5">
            Toggle on if your organization operates its own roastery
          </p>
        </div>
        <Controller
          control={form.control}
          name="roastingInHouse"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              className="data-[state=checked]:bg-[#c99743]"
            />
          )}
        />
      </div>

      {/* Show roasting capacity fields only if roasting in-house */}
      {roastingInHouse && (
        <div className="space-y-4 p-4 rounded-lg border border-[#c99743]/20 bg-[#c99743]/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              form={form}
              name="roastingCapacityKgMonth"
              label="Monthly roasting capacity (kg)"
              placeholder="500"
              type="number"
            />
            <FormField
              form={form}
              name="annualGreenCoffeeKg"
              label="Annual green coffee consumption (kg)"
              placeholder="6000"
              type="number"
            />
          </div>
          <FormField
            form={form}
            name="currentOrigins"
            label="Current coffee origins"
            placeholder="Ethiopia, Colombia, Brazil"
          />
        </div>
      )}

      {/* Main Coffee Uses */}
      <Controller
        control={form.control}
        name="mainCoffeeUses"
        render={({ field }) => (
          <CheckboxGroup
            label="Main coffee uses"
            options={COFFEE_USES}
            values={field.value}
            labelsMap={COFFEE_USE_LABELS}
            onChange={field.onChange}
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          form={form}
          name="typicalOrderSizeKg"
          label="Typical order size (kg)"
          placeholder="100"
          type="number"
        />
        <FormField
          form={form}
          name="preferredMinOrderKg"
          label="Preferred minimum order (kg)"
          placeholder="50"
          type="number"
        />
      </div>

      {/* Import Experience */}
      <div className="space-y-2">
        <Label className="text-[#151513] text-xs uppercase tracking-[0.1em]">
          Import experience
        </Label>
        <Controller
          control={form.control}
          name="importExperience"
          render={({ field }) => (
            <Select
              value={field.value ?? ""}
              onValueChange={(val) => field.onChange(val || undefined)}
            >
              <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]">
                <SelectValue placeholder="Select import experience level" />
              </SelectTrigger>
              <SelectContent>
                {IMPORT_EXPERIENCE.map((exp) => (
                  <SelectItem key={exp} value={exp}>
                    {IMPORT_EXPERIENCE_LABELS[exp]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <FormField
        form={form}
        name="certificationsRequired"
        label="Required certifications"
        placeholder="Fair Trade, Organic, Rainforest Alliance, etc."
      />

      <div className="space-y-2">
        <Label className="text-[#151513] text-xs uppercase tracking-[0.1em]">
          Additional notes
        </Label>
        <Textarea
          placeholder="Anything else you'd like us to know about your coffee program…"
          className="min-h-[100px] border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]"
          {...form.register("notes")}
        />
        {form.formState.errors.notes && (
          <p className="text-xs text-[#c76331]">
            {form.formState.errors.notes.message}
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 4: Commercial Preferences
// ═══════════════════════════════════════════════════════════

function Step4Form({
  form,
}: {
  form: ReturnType<typeof useForm<Step4CommercialInput>>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Georgia',serif] text-xl text-[#151513]">
          Preferences
        </h2>
        <p className="text-sm text-[#756e62] mt-1">
          Tell us about your coffee buying preferences so we can curate the best options.
        </p>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-[#151513] text-xs uppercase tracking-[0.1em]">
          Target price range (CAD/kg)
        </Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <FormField
            form={form}
            name="targetPriceMinCadKg"
            label="Minimum"
            placeholder="15.00"
            type="number"
            step="0.01"
          />
          <FormField
            form={form}
            name="targetPriceMaxCadKg"
            label="Maximum"
            placeholder="35.00"
            type="number"
            step="0.01"
          />
        </div>
        {form.formState.errors.targetPriceMaxCadKg && (
          <p className="text-xs text-[#c76331] mt-1">
            {form.formState.errors.targetPriceMaxCadKg.message}
          </p>
        )}
      </div>

      <Separator className="bg-[rgba(21,21,19,.08)]" />

      {/* Preferred Species */}
      <Controller
        control={form.control}
        name="preferredSpecies"
        render={({ field }) => (
          <CheckboxGroup
            label="Preferred species"
            options={COFFEE_SPECIES}
            values={field.value}
            labelsMap={COFFEE_SPECIES_LABELS}
            onChange={field.onChange}
          />
        )}
      />

      {/* Processing Methods */}
      <Controller
        control={form.control}
        name="preferredProcessingMethods"
        render={({ field }) => (
          <CheckboxGroup
            label="Preferred processing methods"
            options={PROCESSING_METHODS}
            values={field.value}
            labelsMap={PROCESSING_METHOD_LABELS}
            onChange={field.onChange}
          />
        )}
      />

      {/* Flavour Profiles */}
      <Controller
        control={form.control}
        name="preferredFlavourProfiles"
        render={({ field }) => (
          <CheckboxGroup
            label="Preferred flavour profiles"
            options={FLAVOUR_PROFILES}
            values={field.value}
            labelsMap={FLAVOUR_PROFILE_LABELS}
            onChange={field.onChange}
          />
        )}
      />

      {/* Preferred Origins */}
      <Controller
        control={form.control}
        name="preferredOrigins"
        render={({ field }) => (
          <CheckboxGroup
            label="Preferred origins"
            options={COFFEE_ORIGINS}
            values={field.value}
            labelsMap={ORIGIN_LABELS}
            onChange={field.onChange}
          />
        )}
      />

      <Separator className="bg-[rgba(21,21,19,.08)]" />

      {/* Interest toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-[rgba(21,21,19,.12)]">
          <div>
            <Label className="text-[#151513] text-sm font-medium">
              Interested in samples
            </Label>
            <p className="text-xs text-[#756e62]">Receive sample offerings</p>
          </div>
          <Controller
            control={form.control}
            name="sampleInterest"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                className="data-[state=checked]:bg-[#c99743]"
              />
            )}
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-[rgba(21,21,19,.12)]">
          <div>
            <Label className="text-[#151513] text-sm font-medium">
              Group ordering
            </Label>
            <p className="text-xs text-[#756e62]">Combine orders with others</p>
          </div>
          <Controller
            control={form.control}
            name="groupOrderInterest"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                className="data-[state=checked]:bg-[#c99743]"
              />
            )}
          />
        </div>
      </div>

      {/* Purchasing Timeline */}
      <div className="space-y-2">
        <Label className="text-[#151513] text-xs uppercase tracking-[0.1em]">
          Target purchasing timeline
        </Label>
        <Controller
          control={form.control}
          name="targetPurchasingTimeline"
          render={({ field }) => (
            <Select
              value={field.value ?? ""}
              onValueChange={(val) => field.onChange(val || undefined)}
            >
              <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]">
                <SelectValue placeholder="When are you looking to purchase?" />
              </SelectTrigger>
              <SelectContent>
                {PURCHASING_TIMELINES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PURCHASING_TIMELINE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STEP 5: Review & Submit
// ═══════════════════════════════════════════════════════════

function Step5Review({
  form,
  data,
  goToStep,
}: {
  form: ReturnType<typeof useForm<Step5ConsentInput>>;
  data: {
    step1: Step1PersonalInput;
    step2: Step2OrganizationInput;
    step3: Step3RoasterProfileInput;
    step4: Step4CommercialInput;
    step5: Step5ConsentInput;
  };
  goToStep: (step: number) => void;
}) {
  const {
    step1,
    step2,
    step3,
    step4,
  } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-['Georgia',serif] text-xl text-[#151513]">
          Review & Submit
        </h2>
        <p className="text-sm text-[#756e62] mt-1">
          Review your information before submitting your buyer application.
        </p>
      </div>

      {/* Personal Details Review */}
      <ReviewSection title="Personal Details" onEdit={() => goToStep(1)}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-[#756e62] text-xs uppercase tracking-wider">Name</span>
            <p className="text-[#151513]">{step1.firstName} {step1.lastName}</p>
          </div>
          {step1.jobTitle && (
            <div>
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Title</span>
              <p className="text-[#151513]">{step1.jobTitle}</p>
            </div>
          )}
          {step1.phone && (
            <div>
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Phone</span>
              <p className="text-[#151513]">{step1.phone}</p>
            </div>
          )}
        </div>
      </ReviewSection>

      {/* Organization Review */}
      <ReviewSection title="Organization" onEdit={() => goToStep(2)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[#756e62] text-xs uppercase tracking-wider">Legal Name</span>
            <p className="text-[#151513]">{step2.legalName}</p>
          </div>
          {step2.operatingName && (
            <div>
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Operating Name</span>
              <p className="text-[#151513]">{step2.operatingName}</p>
            </div>
          )}
          <div>
            <span className="text-[#756e62] text-xs uppercase tracking-wider">Type</span>
            <p className="text-[#151513]">
              <Badge variant="outline" className="border-[#c99743]/30 text-[#c99743] text-xs">
                {BUSINESS_TYPE_LABELS[step2.businessType]}
              </Badge>
            </p>
          </div>
          <div>
            <span className="text-[#756e62] text-xs uppercase tracking-wider">Location</span>
            <p className="text-[#151513]">
              {step2.city}, {PROVINCE_LABELS[step2.province]}
            </p>
          </div>
          {step2.website && (
            <div className="sm:col-span-2">
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Website</span>
              <p className="text-[#c99743]">{step2.website}</p>
            </div>
          )}
          {step2.yearEstablished && (
            <div>
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Established</span>
              <p className="text-[#151513]">{step2.yearEstablished}</p>
            </div>
          )}
          {step2.numberOfLocations && (
            <div>
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Locations</span>
              <p className="text-[#151513]">{step2.numberOfLocations}</p>
            </div>
          )}
        </div>
      </ReviewSection>

      {/* Roaster Profile Review */}
      <ReviewSection title="Roaster Profile" onEdit={() => goToStep(3)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[#756e62] text-xs uppercase tracking-wider">Roasting</span>
            <p className="text-[#151513]">
              {step3.roastingInHouse ? "In-house" : "Outsourced"}
            </p>
          </div>
          {step3.roastingInHouse && step3.roastingCapacityKgMonth && (
            <div>
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Monthly Capacity</span>
              <p className="text-[#151513]">{step3.roastingCapacityKgMonth} kg</p>
            </div>
          )}
          {step3.roastingInHouse && step3.annualGreenCoffeeKg && (
            <div>
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Annual Consumption</span>
              <p className="text-[#151513]">{step3.annualGreenCoffeeKg} kg</p>
            </div>
          )}
          {step3.mainCoffeeUses && step3.mainCoffeeUses.length > 0 && (
            <div className="sm:col-span-2">
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Coffee Uses</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {step3.mainCoffeeUses.map((use) => (
                  <Badge
                    key={use}
                    variant="secondary"
                    className="text-xs bg-[#c99743]/10 text-[#c99743] border-0"
                  >
                    {COFFEE_USE_LABELS[use]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {step3.importExperience && (
            <div>
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Import Experience</span>
              <p className="text-[#151513]">{IMPORT_EXPERIENCE_LABELS[step3.importExperience]}</p>
            </div>
          )}
        </div>
      </ReviewSection>

      {/* Preferences Review */}
      <ReviewSection title="Preferences" onEdit={() => goToStep(4)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {step4.targetPriceMinCadKg && step4.targetPriceMaxCadKg && (
            <div>
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Price Range</span>
              <p className="text-[#151513]">
                ${step4.targetPriceMinCadKg.toFixed(2)} – ${step4.targetPriceMaxCadKg.toFixed(2)}/kg CAD
              </p>
            </div>
          )}
          {step4.preferredSpecies && step4.preferredSpecies.length > 0 && (
            <div className="sm:col-span-2">
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Species</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {step4.preferredSpecies.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="text-xs bg-[#c99743]/10 text-[#c99743] border-0"
                  >
                    {COFFEE_SPECIES_LABELS[s]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {step4.preferredProcessingMethods && step4.preferredProcessingMethods.length > 0 && (
            <div className="sm:col-span-2">
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Processing</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {step4.preferredProcessingMethods.map((m) => (
                  <Badge
                    key={m}
                    variant="secondary"
                    className="text-xs bg-[#c99743]/10 text-[#c99743] border-0"
                  >
                    {PROCESSING_METHOD_LABELS[m]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {step4.preferredFlavourProfiles && step4.preferredFlavourProfiles.length > 0 && (
            <div className="sm:col-span-2">
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Flavours</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {step4.preferredFlavourProfiles.map((f) => (
                  <Badge
                    key={f}
                    variant="secondary"
                    className="text-xs bg-[#c99743]/10 text-[#c99743] border-0"
                  >
                    {FLAVOUR_PROFILE_LABELS[f]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {step4.preferredOrigins && step4.preferredOrigins.length > 0 && (
            <div className="sm:col-span-2">
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Origins</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {step4.preferredOrigins.map((o) => (
                  <Badge
                    key={o}
                    variant="secondary"
                    className="text-xs bg-[#c99743]/10 text-[#c99743] border-0"
                  >
                    {ORIGIN_LABELS[o]}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {step4.targetPurchasingTimeline && (
            <div>
              <span className="text-[#756e62] text-xs uppercase tracking-wider">Timeline</span>
              <p className="text-[#151513]">
                {PURCHASING_TIMELINE_LABELS[step4.targetPurchasingTimeline]}
              </p>
            </div>
          )}
        </div>
      </ReviewSection>

      <Separator className="bg-[rgba(21,21,19,.08)]" />

      {/* Consent */}
      <div className="space-y-4">
        <h3 className="font-['Georgia',serif] text-lg text-[#151513]">
          Terms & Consent
        </h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border border-[rgba(21,21,19,.12)]">
            <Controller
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5 data-[state=checked]:bg-[#c99743] data-[state=checked]:border-[#c99743]"
                />
              )}
            />
            <Label className="text-sm text-[#151513] leading-relaxed cursor-pointer">
              I agree to the{" "}
              <a
                href="#"
                className="text-[#c99743] underline underline-offset-2 hover:text-[#c76331]"
              >
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-[#c99743] underline underline-offset-2 hover:text-[#c76331]"
              >
                Buyer Agreement
              </a>{" "}
              of House of Lotus Canada. <span className="text-[#c76331]">*</span>
            </Label>
          </div>
          {form.formState.errors.termsAccepted && (
            <p className="text-xs text-[#c76331] ml-7">
              {form.formState.errors.termsAccepted.message}
            </p>
          )}

          <div className="flex items-start gap-3 p-3 rounded-lg border border-[rgba(21,21,19,.12)]">
            <Controller
              control={form.control}
              name="privacyConsent"
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-0.5 data-[state=checked]:bg-[#c99743] data-[state=checked]:border-[#c99743]"
                />
              )}
            />
            <Label className="text-sm text-[#151513] leading-relaxed cursor-pointer">
              I consent to the collection and use of my personal information as described in the{" "}
              <a
                href="#"
                className="text-[#c99743] underline underline-offset-2 hover:text-[#c76331]"
              >
                Privacy Policy
              </a>
              . <span className="text-[#c76331]">*</span>
            </Label>
          </div>
          {form.formState.errors.privacyConsent && (
            <p className="text-xs text-[#c76331] ml-7">
              {form.formState.errors.privacyConsent.message}
            </p>
          )}

          <div className="flex items-start gap-3 p-3 rounded-lg border border-[rgba(21,21,19,.12)]">
            <Controller
              control={form.control}
              name="marketingConsent"
              render={({ field }) => (
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                  className="mt-0.5 data-[state=checked]:bg-[#c99743] data-[state=checked]:border-[#c99743]"
                />
              )}
            />
            <Label className="text-sm text-[#151513] leading-relaxed cursor-pointer">
              I would like to receive marketing communications, new origin alerts, and special offers from House of Lotus Canada.{" "}
              <span className="text-[#756e62]">(optional)</span>
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Shared Components
// ═══════════════════════════════════════════════════════════

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
    <div className="rounded-lg border border-[rgba(21,21,19,.12)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#151513] uppercase tracking-wider">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-xs text-[#c99743] hover:text-[#c76331] transition-colors"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function FormField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  placeholder,
  type = "text",
  step,
}: {
  form: ReturnType<typeof useForm<T>>;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  step?: string;
}) {
  const {
    register,
    formState: { errors },
  } = form;

  const error = errors[name as keyof typeof errors] as { message?: string } | undefined;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={name}
        className="text-[#151513] text-xs uppercase tracking-[0.1em]"
      >
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        step={step}
        aria-invalid={!!error}
        className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]"
        {...register(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name as any,
          type === "number"
            ? { valueAsNumber: true }
            : undefined
        )}
      />
      {error && (
        <p className="text-xs text-[#c76331]">
          {error.message}
        </p>
      )}
    </div>
  );
}
