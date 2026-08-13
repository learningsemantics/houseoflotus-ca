"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Check,
  X,
  Pencil,
  Save,
  Building2,
  Coffee,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";

import {
  BUSINESS_TYPE_LABELS,
  PROVINCE_LABELS,
  COFFEE_USE_LABELS,
  IMPORT_EXPERIENCE_LABELS,
  COFFEE_SPECIES_LABELS,
  PROCESSING_METHOD_LABELS,
  FLAVOUR_PROFILE_LABELS,
  ORIGIN_LABELS,
  PURCHASING_TIMELINE_LABELS,
} from "@/lib/validations/onboarding";

interface Organization {
  id: string;
  legalName: string;
  operatingName?: string | null;
  website?: string | null;
  businessType?: string | null;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  postalCode?: string | null;
  yearEstablished?: number | null;
  numberOfLocations?: number | null;
  status: string;
  submittedAt?: string | null;
  updatedAt: string;
  buyerProfile?: {
    roastingInHouse?: boolean | null;
    roastingCapacityKgMonth?: number | null;
    annualGreenCoffeeKg?: number | null;
    currentOrigins?: string | null;
    mainCoffeeUse?: string | null;
    typicalOrderSize?: string | null;
    preferredMinOrder?: string | null;
    importExperience?: string | null;
    certificationsRequired?: string | null;
    roasterNotes?: string | null;
    targetPriceRangeCadKg?: string | null;
    preferredSpecies?: string | null;
    preferredProcessingMethods?: string | null;
    preferredFlavourProfiles?: string | null;
    preferredOrigins?: string | null;
    sampleInterest?: boolean;
    groupOrderInterest?: boolean;
    targetPurchasingTimeline?: string | null;
  } | null;
}

function parseJsonField(field?: string | null): string[] {
  if (!field) return [];
  try {
    const parsed = JSON.parse(field);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function labelMap(map: Record<string, string>, value: string): string {
  return map[value] || value;
}

export default function OrganizationPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const fetchOrg = useCallback(() => {
    fetch("/api/organization")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        setOrg(data.organization);
        setRole(data.role);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load organization");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  const startEdit = () => {
    if (!org) return;
    setForm({
      legalName: org.legalName,
      operatingName: org.operatingName || "",
      website: org.website || "",
      businessType: org.businessType || "",
      province: org.province || "",
      city: org.city || "",
      address: org.address || "",
      postalCode: org.postalCode || "",
      yearEstablished: org.yearEstablished || "",
      numberOfLocations: org.numberOfLocations || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(form)) {
        if (key === "yearEstablished" || key === "numberOfLocations") {
          payload[key] = value ? Number(value) : null;
        } else {
          payload[key] = value || null;
        }
      }

      const res = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }

      toast.success("Organization details updated");
      setEditing(false);
      fetchOrg();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <p className="text-[#756e62]">No organization found.</p>
      </div>
    );
  }

  const isAdmin = role === "BUYER_ADMIN";
  const bp = org.buyerProfile;
  const priceRange = bp?.targetPriceRangeCadKg ? JSON.parse(bp.targetPriceRangeCadKg) : null;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Onboarding Completion */}
      <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-[#c99743]" />
            <h3 className="text-xs uppercase tracking-[0.12em] text-[#756e62] font-medium">
              Onboarding Completion
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Personal Details", done: true },
              { label: "Organization Details", done: !!org.legalName },
              { label: "Roaster Profile", done: !!bp },
              { label: "Commercial Preferences", done: !!bp?.preferredSpecies },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-2">
                {step.done ? (
                  <Check className="h-4 w-4 text-[#68715e]" />
                ) : (
                  <X className="h-4 w-4 text-[#b5ad9e]" />
                )}
                <span className={`text-xs ${step.done ? "text-[#151513]" : "text-[#b5ad9e]"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="bg-white/60 border border-[rgba(21,21,19,.12)]">
          <TabsTrigger value="details">Organization Details</TabsTrigger>
          <TabsTrigger value="preferences">Buyer Preferences</TabsTrigger>
        </TabsList>

        {/* Organization Details */}
        <TabsContent value="details">
          <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#c99743]" />
                  <h3 className="font-['Georgia',serif] text-base text-[#151513]">
                    Organization Details
                  </h3>
                </div>
                {isAdmin && (
                  !editing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startEdit}
                      className="text-[10px] uppercase tracking-[0.12em] border-[#c99743]/30 text-[#c99743] hover:bg-[#c99743]/5"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(false)}
                        className="text-[10px] uppercase tracking-[0.12em]"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="text-[10px] uppercase tracking-[0.12em] bg-[#c99743] text-[#14110d] hover:bg-[#b8882e]"
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {editing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="legalName">Legal Business Name</Label>
                      <Input
                        id="legalName"
                        value={String(form.legalName || "")}
                        onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                        className="h-11 border-[rgba(21,21,19,.17)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operatingName">Operating Name</Label>
                      <Input
                        id="operatingName"
                        value={String(form.operatingName || "")}
                        onChange={(e) => setForm({ ...form, operatingName: e.target.value })}
                        className="h-11 border-[rgba(21,21,19,.17)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={String(form.website || "")}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        className="h-11 border-[rgba(21,21,19,.17)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Type</Label>
                      <Select
                        value={String(form.businessType || "")}
                        onValueChange={(v) => setForm({ ...form, businessType: v })}
                      >
                        <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(BUSINESS_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Province</Label>
                      <Select
                        value={String(form.province || "")}
                        onValueChange={(v) => setForm({ ...form, province: v })}
                      >
                        <SelectTrigger className="h-11 border-[rgba(21,21,19,.17)]">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PROVINCE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={String(form.city || "")}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="h-11 border-[rgba(21,21,19,.17)]"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={String(form.address || "")}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="h-11 border-[rgba(21,21,19,.17)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={String(form.postalCode || "")}
                        onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                        className="h-11 border-[rgba(21,21,19,.17)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearEstablished">Year Established</Label>
                      <Input
                        id="yearEstablished"
                        type="number"
                        value={String(form.yearEstablished || "")}
                        onChange={(e) => setForm({ ...form, yearEstablished: e.target.value })}
                        className="h-11 border-[rgba(21,21,19,.17)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numberOfLocations">Number of Locations</Label>
                      <Input
                        id="numberOfLocations"
                        type="number"
                        value={String(form.numberOfLocations || "")}
                        onChange={(e) => setForm({ ...form, numberOfLocations: e.target.value })}
                        className="h-11 border-[rgba(21,21,19,.17)]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <DetailField label="Legal Business Name" value={org.legalName} />
                    <DetailField label="Operating Name" value={org.operatingName} />
                    <DetailField label="Website" value={org.website} />
                    <DetailField label="Business Type" value={org.businessType ? BUSINESS_TYPE_LABELS[org.businessType] : ""} />
                    <DetailField label="Province" value={org.province ? PROVINCE_LABELS[org.province] : ""} />
                    <DetailField label="City" value={org.city} />
                    <DetailField label="Address" value={org.address} />
                    <DetailField label="Postal Code" value={org.postalCode} />
                    <DetailField label="Year Established" value={org.yearEstablished?.toString()} />
                    <DetailField label="Number of Locations" value={org.numberOfLocations?.toString()} />
                  </>
                )}
              </div>

              {!editing && (
                <p className="text-[10px] text-[#b5ad9e] mt-6">
                  Last updated: {new Date(org.updatedAt).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buyer Preferences */}
        <TabsContent value="preferences">
          <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Coffee className="h-4 w-4 text-[#c99743]" />
                <h3 className="font-['Georgia',serif] text-base text-[#151513]">
                  Buyer Preferences
                </h3>
                <Badge className="bg-[#c99743]/10 text-[#c99743] border-[#c99743]/20 text-[9px] ml-auto">
                  Read-only
                </Badge>
              </div>

              {!bp ? (
                <p className="text-sm text-[#756e62] italic">No buyer profile information available.</p>
              ) : (
                <div className="space-y-6">
                  {/* Roaster Profile */}
                  <section>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#c76331] font-semibold mb-3 flex items-center gap-2">
                      <Coffee className="h-3.5 w-3.5" /> Roaster Profile
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <DetailField label="Roasting In-House" value={bp.roastingInHouse ? "Yes" : "No"} />
                      <DetailField label="Roasting Capacity (kg/month)" value={bp.roastingCapacityKgMonth?.toString()} />
                      <DetailField label="Annual Green Coffee (kg)" value={bp.annualGreenCoffeeKg?.toString()} />
                      <DetailField label="Current Origins" value={bp.currentOrigins} />
                      <DetailField label="Main Coffee Uses" value={parseJsonField(bp.mainCoffeeUse).map((v) => labelMap(COFFEE_USE_LABELS, v)).join(", ")} />
                      <DetailField label="Import Experience" value={bp.importExperience ? IMPORT_EXPERIENCE_LABELS[bp.importExperience] : ""} />
                      <DetailField label="Certifications Required" value={bp.certificationsRequired} />
                      <DetailField label="Notes" value={bp.roasterNotes} />
                    </div>
                  </section>

                  <Separator className="bg-[rgba(21,21,19,.08)]" />

                  {/* Commercial Preferences */}
                  <section>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#c76331] font-semibold mb-3 flex items-center gap-2">
                      <ShoppingBag className="h-3.5 w-3.5" /> Commercial Preferences
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <DetailField
                        label="Price Range (CAD/kg)"
                        value={priceRange ? `$${priceRange.min} – $${priceRange.max}` : ""}
                      />
                      <DetailField label="Preferred Species" value={parseJsonField(bp.preferredSpecies).map((v) => labelMap(COFFEE_SPECIES_LABELS, v)).join(", ")} />
                      <DetailField label="Processing Methods" value={parseJsonField(bp.preferredProcessingMethods).map((v) => labelMap(PROCESSING_METHOD_LABELS, v)).join(", ")} />
                      <DetailField label="Flavour Profiles" value={parseJsonField(bp.preferredFlavourProfiles).map((v) => labelMap(FLAVOUR_PROFILE_LABELS, v)).join(", ")} />
                      <DetailField label="Preferred Origins" value={parseJsonField(bp.preferredOrigins).map((v) => labelMap(ORIGIN_LABELS, v)).join(", ")} />
                      <DetailField label="Sample Interest" value={bp.sampleInterest ? "Yes" : "No"} />
                      <DetailField label="Group Order Interest" value={bp.groupOrderInterest ? "Yes" : "No"} />
                      <DetailField label="Purchasing Timeline" value={bp.targetPurchasingTimeline ? PURCHASING_TIMELINE_LABELS[bp.targetPurchasingTimeline] : ""} />
                    </div>
                  </section>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#756e62] mb-1">{label}</p>
      <p className="text-sm text-[#151513]">
        {value || <span className="text-[#b5ad9e] italic">Not set</span>}
      </p>
    </div>
  );
}
