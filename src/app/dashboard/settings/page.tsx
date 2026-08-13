"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, AlertTriangle, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROVINCE_LABELS } from "@/lib/validations/onboarding";

interface OrganizationAddress {
  billingStreet?: string | null;
  billingCity?: string | null;
  billingProvince?: string | null;
  billingPostalCode?: string | null;
  deliveryStreet?: string | null;
  deliveryCity?: string | null;
  deliveryProvince?: string | null;
  deliveryPostalCode?: string | null;
}

interface OrgData {
  id: string;
  legalName: string;
  address?: OrganizationAddress | null;
}

export default function SettingsPage() {
  const [, setOrg] = useState<OrgData | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [billing, setBilling] = useState({
    billingStreet: "",
    billingCity: "",
    billingProvince: "",
    billingPostalCode: "",
  });
  const [delivery, setDelivery] = useState({
    deliveryStreet: "",
    deliveryCity: "",
    deliveryProvince: "",
    deliveryPostalCode: "",
  });

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/organization").then((r) => r.json()),
      fetch("/api/auth/session").then((r) => r.json()),
    ])
      .then(([orgData, sessionData]) => {
        if (sessionData.user?.organization) {
          setRole(sessionData.user.organization.role);
        }
        if (orgData.organization) {
          setOrg(orgData.organization);
          const addr = orgData.organization.address || {};
          setBilling({
            billingStreet: addr.billingStreet || "",
            billingCity: addr.billingCity || "",
            billingProvince: addr.billingProvince || "",
            billingPostalCode: addr.billingPostalCode || "",
          });
          setDelivery({
            deliveryStreet: addr.deliveryStreet || "",
            deliveryCity: addr.deliveryCity || "",
            deliveryProvince: addr.deliveryProvince || "",
            deliveryPostalCode: addr.deliveryPostalCode || "",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load settings");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveBilling = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billing),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success("Billing address updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const saveDelivery = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delivery),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success("Delivery address updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (role !== "BUYER_ADMIN") {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
          <CardContent className="p-6 text-center">
            <p className="text-[#756e62]">Settings are only available to organization administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Billing Address */}
      <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-4 w-4 text-[#c99743]" />
            <h3 className="font-['Georgia',serif] text-base text-[#151513]">Billing Address</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="billingStreet">Street Address</Label>
              <Input
                id="billingStreet"
                value={billing.billingStreet}
                onChange={(e) => setBilling({ ...billing, billingStreet: e.target.value })}
                className="h-11 border-[rgba(21,21,19,.17)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingCity">City</Label>
              <Input
                id="billingCity"
                value={billing.billingCity}
                onChange={(e) => setBilling({ ...billing, billingCity: e.target.value })}
                className="h-11 border-[rgba(21,21,19,.17)]"
              />
            </div>
            <div className="space-y-2">
              <Label>Province</Label>
              <Select
                value={billing.billingProvince}
                onValueChange={(v) => setBilling({ ...billing, billingProvince: v })}
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
              <Label htmlFor="billingPostalCode">Postal Code</Label>
              <Input
                id="billingPostalCode"
                value={billing.billingPostalCode}
                onChange={(e) => setBilling({ ...billing, billingPostalCode: e.target.value })}
                className="h-11 border-[rgba(21,21,19,.17)]"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              size="sm"
              onClick={saveBilling}
              disabled={saving}
              className="text-[10px] uppercase tracking-[0.12em] bg-[#c99743] text-[#14110d] hover:bg-[#b8882e]"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Billing Address
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Address */}
      <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-4 w-4 text-[#c76331]" />
            <h3 className="font-['Georgia',serif] text-base text-[#151513]">Delivery Address</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="deliveryStreet">Street Address</Label>
              <Input
                id="deliveryStreet"
                value={delivery.deliveryStreet}
                onChange={(e) => setDelivery({ ...delivery, deliveryStreet: e.target.value })}
                className="h-11 border-[rgba(21,21,19,.17)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryCity">City</Label>
              <Input
                id="deliveryCity"
                value={delivery.deliveryCity}
                onChange={(e) => setDelivery({ ...delivery, deliveryCity: e.target.value })}
                className="h-11 border-[rgba(21,21,19,.17)]"
              />
            </div>
            <div className="space-y-2">
              <Label>Province</Label>
              <Select
                value={delivery.deliveryProvince}
                onValueChange={(v) => setDelivery({ ...delivery, deliveryProvince: v })}
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
              <Label htmlFor="deliveryPostalCode">Postal Code</Label>
              <Input
                id="deliveryPostalCode"
                value={delivery.deliveryPostalCode}
                onChange={(e) => setDelivery({ ...delivery, deliveryPostalCode: e.target.value })}
                className="h-11 border-[rgba(21,21,19,.17)]"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              size="sm"
              onClick={saveDelivery}
              disabled={saving}
              className="text-[10px] uppercase tracking-[0.12em] bg-[#c99743] text-[#14110d] hover:bg-[#b8882e]"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Delivery Address
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-[#c76331]/20 bg-[#c76331]/[0.03]">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-[#c76331]" />
            <h3 className="font-['Georgia',serif] text-base text-[#c76331]">Danger Zone</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-[#151513]">Request Account Deletion</p>
              <p className="text-xs text-[#756e62] mt-1">
                If you wish to permanently delete your organization&apos;s account and all associated data,
                please contact us at{" "}
                <a href="mailto:support@houseoflotus.ca" className="text-[#c99743] underline">
                  support@houseoflotus.ca
                </a>
                . Account deletion is performed manually by our team after verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
