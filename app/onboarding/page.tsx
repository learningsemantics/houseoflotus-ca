"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { User, Building2, Coffee, Settings2, CheckCircle2, ChevronLeft, ChevronRight, Pencil } from "lucide-react"

const STEPS = ["Personal Details", "Organization", "Roaster Profile", "Preferences", "Review & Submit"]
const STEP_ICONS = [User, Building2, Coffee, Settings2, CheckCircle2]

const CANADIAN_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Northwest Territories", "Nunavut", "Yukon"
]

const BUSINESS_TYPES = ["Roaster", "Café / Coffee Shop", "Restaurant / Hospitality", "Retailer", "Distributor", "Wholesaler", "Other"]

const COFFEE_USES = ["espresso", "filter", "retail_bags", "wholesale", "private_label", "hospitality"] as const
const COFFEE_USE_LABELS: Record<string, string> = {
  espresso: "Espresso", filter: "Filter / Pour-over", retail_bags: "Retail Bags", wholesale: "Wholesale",
  private_label: "Private Label", hospitality: "Hospitality / Food Service"
}

const SPECIES_OPTIONS = ["Arabica", "Robusta", "Liberica", "Excelsa"]
const PROCESSING_OPTIONS = ["Washed", "Natural", "Honey", "Wet-hulled", "Anaerobic", "Carbonic Maceration"]
const FLAVOUR_OPTIONS = ["Fruity", "Floral", "Chocolate", "Nutty", "Caramel", "Spice", "Herbal", "Earthy", "Winey", "Bright / Citrus"]
const ORIGIN_OPTIONS = ["Ethiopia", "Colombia", "Brazil", "Guatemala", "Costa Rica", "Kenya", "Rwanda", "Indonesia", "Honduras", "Peru", "Mexico", "Yemen", "Panama", "Other"]

const TIMELINE_OPTIONS = ["immediately", "within_1_month", "1_to_3_months", "3_to_6_months", "exploring"]

interface FormData {
  firstName: string; lastName: string; jobTitle: string; phone: string
  legalName: string; operatingName: string; website: string; businessType: string
  province: string; city: string; address: string; postalCode: string
  yearEstablished: string; numberOfLocations: string
  roastingInHouse: boolean; capacity: string; annualConsumption: string
  currentOrigins: string; mainCoffeeUses: string[]; typicalOrderSizeKg: string
  preferredMinOrderKg: string; importExperience: string; certifications: string; notes: string
  targetPriceMinCadKg: string; targetPriceMaxCadKg: string; preferredSpecies: string[]
  preferredProcessingMethods: string[]; preferredFlavourProfiles: string[]; preferredOrigins: string[]
  sampleInterest: boolean; groupOrderInterest: boolean; targetPurchasingTimeline: string
  termsAccepted: boolean; privacyAccepted: boolean; marketingAccepted: boolean
}

const defaultForm: FormData = {
  firstName: "", lastName: "", jobTitle: "", phone: "",
  legalName: "", operatingName: "", website: "", businessType: "", province: "", city: "", address: "", postalCode: "",
  yearEstablished: "", numberOfLocations: "",
  roastingInHouse: false, capacity: "", annualConsumption: "", currentOrigins: "", mainCoffeeUses: [],
  typicalOrderSizeKg: "", preferredMinOrderKg: "", importExperience: "", certifications: "", notes: "",
  targetPriceMinCadKg: "", targetPriceMaxCadKg: "", preferredSpecies: [],
  preferredProcessingMethods: [], preferredFlavourProfiles: [], preferredOrigins: [],
  sampleInterest: true, groupOrderInterest: false, targetPurchasingTimeline: "",
  termsAccepted: false, privacyAccepted: false, marketingAccepted: false,
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hol_onboarding")
      if (saved) setForm(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem("hol_onboarding", JSON.stringify(form)) } catch { /* ignore */ }
  }, [form])

  const update = useCallback((field: keyof FormData, value: string | boolean | string[]) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }, [])

  const toggleArrayItem = useCallback((field: keyof FormData, item: string) => {
    setForm((f) => {
      const arr = (f[field] as string[]) || []
      return { ...f, [field]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item] }
    })
  }, [])

  function validateStep(s: number): boolean {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!form.firstName.trim()) e.firstName = "First name is required"
      if (!form.lastName.trim()) e.lastName = "Last name is required"
    } else if (s === 1) {
      if (!form.legalName.trim()) e.legalName = "Legal name is required"
      if (!form.city.trim()) e.city = "City is required"
    } else if (s === 2) {
      // no required fields
    } else if (s === 3) {
      // no required fields
    } else if (s === 4) {
      if (!form.termsAccepted) e.termsAccepted = "You must accept the terms"
      if (!form.privacyAccepted) e.privacyAccepted = "You must accept the privacy policy"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function nextStep() {
    if (!validateStep(step)) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function prevStep() { setStep((s) => Math.max(s - 1, 0)) }

  async function handleSubmit() {
    if (!validateStep(4)) return
    setLoading(true)
    try {
      const res = await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Submission failed")
      localStorage.removeItem("hol_onboarding")
      toast.success("Application submitted successfully!")
      router.push("/pending-approval")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "#f2eee5" }}>
      <div className="max-w-2xl mx-auto">
        {/* Branding */}
        <div className="text-center mb-8">
          <span className="text-[#c99743] text-2xl inline-block rotate-45" aria-hidden="true">♢</span>
          <h1 className="font-[Georgia,serif] text-2xl tracking-[0.13em] text-[#151513] mt-2">HOUSE OF LOTUS</h1>
          <p className="text-[7px] tracking-[0.42em] text-[#756e62] uppercase">Canada</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((label, i) => {
              const Icon = STEP_ICONS[i]
              const isActive = i === step
              const isDone = i < step
              return (
                <div key={label} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                      isDone ? "bg-[#c99743] text-white" : isActive ? "bg-[#c99743]/20 text-[#c99743] border-2 border-[#c99743]" : "bg-[#e8e2d6] text-[#8e8579]"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] mt-1 text-center hidden sm:block ${isActive ? "text-[#c99743] font-medium" : "text-[#8e8579]"}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="h-1 bg-[#e8e2d6] rounded-full overflow-hidden">
            <div className="h-full bg-[#c99743] transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="font-[Georgia,serif] text-xl text-[#151513]">{STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && <StepPersonal form={form} update={update} errors={errors} />}
            {step === 1 && <StepOrganization form={form} update={update} errors={errors} />}
            {step === 2 && <StepRoaster form={form} update={update} toggleArrayItem={toggleArrayItem} />}
            {step === 3 && <StepPreferences form={form} update={update} toggleArrayItem={toggleArrayItem} />}
            {step === 4 && <StepReview form={form} setStep={setStep} update={update} errors={errors} />}

            <Separator className="my-6" />

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={step === 0} className="border-[#c99743] text-[#c99743] hover:bg-[#c99743]/10">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              {step < 4 ? (
                <Button onClick={nextStep} className="bg-[#c99743] hover:bg-[#b8893d] text-white">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="bg-[#c99743] hover:bg-[#b8893d] text-white">
                  {loading ? "Submitting…" : "Submit Application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#8e8579] mt-6">© {new Date().getFullYear()} House of Lotus Canada</p>
      </div>
    </div>
  )
}

/* ── Step Components ────────────────────────────── */

function StepPersonal({ form, update, errors }: { form: FormData; update: (f: keyof FormData, v: string) => void; errors: Record<string, string> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="firstName">First name *</Label>
        <Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Jane" />
        {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lastName">Last name *</Label>
        <Input id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Doe" />
        {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="jobTitle">Job title</Label>
        <Input id="jobTitle" value={form.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} placeholder="Head Roaster" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(416) 555-0123" />
      </div>
    </div>
  )
}

function StepOrganization({ form, update, errors }: { form: FormData; update: (f: keyof FormData, v: string) => void; errors: Record<string, string> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="legalName">Legal business name *</Label>
          <Input id="legalName" value={form.legalName} onChange={(e) => update("legalName", e.target.value)} placeholder="Acme Roasters Inc." />
          {errors.legalName && <p className="text-xs text-red-500">{errors.legalName}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="operatingName">Operating / trade name</Label>
          <Input id="operatingName" value={form.operatingName} onChange={(e) => update("operatingName", e.target.value)} placeholder="Acme Coffee" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website">Website</Label>
          <Input id="website" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://acmeroasters.ca" />
        </div>
        <div className="space-y-1.5">
          <Label>Business type</Label>
          <Select value={form.businessType} onValueChange={(v) => update("businessType", v)}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Province *</Label>
          <Select value={form.province} onValueChange={(v) => update("province", v)}>
            <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
            <SelectContent>
              {CANADIAN_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City *</Label>
          <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Toronto" />
          {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Street address</Label>
          <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="123 Main St" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input id="postalCode" value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} placeholder="M5V 2H1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="yearEstablished">Year established</Label>
          <Input id="yearEstablished" type="number" value={form.yearEstablished} onChange={(e) => update("yearEstablished", e.target.value)} placeholder="2018" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="numberOfLocations">Number of locations</Label>
          <Input id="numberOfLocations" type="number" value={form.numberOfLocations} onChange={(e) => update("numberOfLocations", e.target.value)} placeholder="3" />
        </div>
      </div>
    </div>
  )
}

function StepRoaster({ form, update, toggleArrayItem }: { form: FormData; update: (f: keyof FormData, v: string | boolean | string[]) => void; toggleArrayItem: (f: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-[#f2eee5] rounded-lg">
        <Label htmlFor="roastingInHouse" className="cursor-pointer">Roasting in-house</Label>
        <Switch id="roastingInHouse" checked={form.roastingInHouse} onCheckedChange={(v) => update("roastingInHouse", v)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="capacity">Roasting capacity (kg/month)</Label>
          <Input id="capacity" type="number" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} placeholder="500" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="annualConsumption">Annual green coffee (kg)</Label>
          <Input id="annualConsumption" type="number" value={form.annualConsumption} onChange={(e) => update("annualConsumption", e.target.value)} placeholder="6000" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="currentOrigins">Current origins you source from</Label>
          <Textarea id="currentOrigins" value={form.currentOrigins} onChange={(e) => update("currentOrigins", e.target.value)} placeholder="Ethiopia, Colombia, Brazil…" rows={2} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Main coffee uses</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COFFEE_USES.map((use) => (
            <label key={use} className="flex items-center gap-2 p-2 rounded-md border border-[#e8e2d6] cursor-pointer hover:bg-[#f2eee5] transition-colors">
              <Checkbox checked={form.mainCoffeeUses.includes(use)} onCheckedChange={() => toggleArrayItem("mainCoffeeUses", use)} />
              <span className="text-sm">{COFFEE_USE_LABELS[use]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="typicalOrderSizeKg">Typical order size (kg)</Label>
          <Input id="typicalOrderSizeKg" type="number" value={form.typicalOrderSizeKg} onChange={(e) => update("typicalOrderSizeKg", e.target.value)} placeholder="200" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preferredMinOrderKg">Preferred min order (kg)</Label>
          <Input id="preferredMinOrderKg" type="number" value={form.preferredMinOrderKg} onChange={(e) => update("preferredMinOrderKg", e.target.value)} placeholder="50" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Import experience</Label>
          <Select value={form.importExperience} onValueChange={(v) => update("importExperience", v)}>
            <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No experience</SelectItem>
              <SelectItem value="direct">Direct imports</SelectItem>
              <SelectItem value="broker">Via broker</SelectItem>
              <SelectItem value="both">Both direct and broker</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="certifications">Certifications required</Label>
          <Input id="certifications" value={form.certifications} onChange={(e) => update("certifications", e.target.value)} placeholder="Organic, Fair Trade…" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Additional notes</Label>
        <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Anything else you'd like us to know…" rows={3} />
      </div>
    </div>
  )
}

function StepPreferences({ form, update, toggleArrayItem }: { form: FormData; update: (f: keyof FormData, v: string | boolean | string[]) => void; toggleArrayItem: (f: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="targetPriceMinCadKg">Target price min (CAD/kg)</Label>
          <Input id="targetPriceMinCadKg" type="number" step="0.01" value={form.targetPriceMinCadKg} onChange={(e) => update("targetPriceMinCadKg", e.target.value)} placeholder="8.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetPriceMaxCadKg">Target price max (CAD/kg)</Label>
          <Input id="targetPriceMaxCadKg" type="number" step="0.01" value={form.targetPriceMaxCadKg} onChange={(e) => update("targetPriceMaxCadKg", e.target.value)} placeholder="18.00" />
        </div>
      </div>

      <CheckboxGroup label="Preferred species" items={SPECIES_OPTIONS} selected={form.preferredSpecies} onToggle={(v) => toggleArrayItem("preferredSpecies", v)} />
      <CheckboxGroup label="Preferred processing methods" items={PROCESSING_OPTIONS} selected={form.preferredProcessingMethods} onToggle={(v) => toggleArrayItem("preferredProcessingMethods", v)} />
      <CheckboxGroup label="Preferred flavour profiles" items={FLAVOUR_OPTIONS} selected={form.preferredFlavourProfiles} onToggle={(v) => toggleArrayItem("preferredFlavourProfiles", v)} />
      <CheckboxGroup label="Preferred origins" items={ORIGIN_OPTIONS} selected={form.preferredOrigins} onToggle={(v) => toggleArrayItem("preferredOrigins", v)} />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center justify-between p-3 bg-[#f2eee5] rounded-lg flex-1">
          <Label htmlFor="sampleInterest" className="cursor-pointer">Interested in samples</Label>
          <Switch id="sampleInterest" checked={form.sampleInterest} onCheckedChange={(v) => update("sampleInterest", v)} />
        </div>
        <div className="flex items-center justify-between p-3 bg-[#f2eee5] rounded-lg flex-1">
          <Label htmlFor="groupOrderInterest" className="cursor-pointer">Interested in group orders</Label>
          <Switch id="groupOrderInterest" checked={form.groupOrderInterest} onCheckedChange={(v) => update("groupOrderInterest", v)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Target purchasing timeline</Label>
        <Select value={form.targetPurchasingTimeline} onValueChange={(v) => update("targetPurchasingTimeline", v)}>
          <SelectTrigger><SelectValue placeholder="Select timeline" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="immediately">Immediately</SelectItem>
            <SelectItem value="within_1_month">Within 1 month</SelectItem>
            <SelectItem value="1_to_3_months">1–3 months</SelectItem>
            <SelectItem value="3_to_6_months">3–6 months</SelectItem>
            <SelectItem value="exploring">Just exploring</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function CheckboxGroup({ label, items, selected, onToggle }: { label: string; items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((item) => (
          <label key={item} className="flex items-center gap-2 p-2 rounded-md border border-[#e8e2d6] cursor-pointer hover:bg-[#f2eee5] transition-colors">
            <Checkbox checked={selected.includes(item)} onCheckedChange={() => onToggle(item)} />
            <span className="text-sm">{item}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function StepReview({ form, setStep, update, errors }: { form: FormData; setStep: (s: number | ((p: number) => number)) => void; update: (f: keyof FormData, v: string | boolean | string[]) => void; errors: Record<string, string> }) {
  const sections = [
    { title: "Personal Details", step: 0, items: [["Name", `${form.firstName} ${form.lastName}`], ["Job title", form.jobTitle || "—"], ["Phone", form.phone || "—"]] },
    { title: "Organization", step: 1, items: [["Legal name", form.legalName], ["Operating name", form.operatingName || "—"], ["Business type", form.businessType || "—"], ["Location", `${form.city}, ${form.province || ""}`], ["Year established", form.yearEstablished || "—"]] },
    { title: "Roaster Profile", step: 2, items: [["In-house roasting", form.roastingInHouse ? "Yes" : "No"], ["Capacity", form.capacity ? `${form.capacity} kg/mo` : "—"], ["Annual consumption", form.annualConsumption ? `${form.annualConsumption} kg` : "—"], ["Main uses", form.mainCoffeeUses.length > 0 ? form.mainCoffeeUses.map((u) => COFFEE_USE_LABELS[u] || u).join(", ") : "—"]] },
    { title: "Preferences", step: 3, items: [["Price range", (form.targetPriceMinCadKg || form.targetPriceMaxCadKg) ? `$${form.targetPriceMinCadKg || "?"}–$${form.targetPriceMaxCadKg || "?"} CAD/kg` : "—"], ["Species", form.preferredSpecies.join(", ") || "—"], ["Processing", form.preferredProcessingMethods.join(", ") || "—"], ["Origins", form.preferredOrigins.join(", ") || "—"]] },
  ]

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-[Georgia,serif] text-base text-[#151513]">{section.title}</h3>
            <Button variant="ghost" size="sm" className="text-[#c99743]" onClick={() => setStep(section.step)}>
              <Pencil className="w-3 h-3 mr-1" /> Edit
            </Button>
          </div>
          <div className="space-y-1 pl-2 border-l-2 border-[#e8e2d6]">
            {section.items.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm py-0.5">
                <span className="text-[#8e8579]">{label}</span>
                <span className="text-[#151513] text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Separator />

      <div className="space-y-3">
        <h3 className="font-[Georgia,serif] text-base text-[#151513]">Agreements</h3>
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox checked={form.termsAccepted} onCheckedChange={(v) => update("termsAccepted", !!v)} />
          <span className="text-sm text-[#151513]">I accept the <a href="#" className="text-[#c99743] underline">Terms of Service</a> *</span>
        </label>
        {errors.termsAccepted && <p className="text-xs text-red-500 ml-6">{errors.termsAccepted}</p>}
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox checked={form.privacyAccepted} onCheckedChange={(v) => update("privacyAccepted", !!v)} />
          <span className="text-sm text-[#151513]">I accept the <a href="#" className="text-[#c99743] underline">Privacy Policy</a> *</span>
        </label>
        {errors.privacyAccepted && <p className="text-xs text-red-500 ml-6">{errors.privacyAccepted}</p>}
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox checked={form.marketingAccepted} onCheckedChange={(v) => update("marketingAccepted", !!v)} />
          <span className="text-sm text-[#151513]">I consent to receiving marketing communications (optional)</span>
        </label>
      </div>
    </div>
  )
}
