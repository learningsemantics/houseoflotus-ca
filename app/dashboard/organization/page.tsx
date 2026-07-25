"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Pencil, Check } from "lucide-react"

export default function OrganizationPage() {
  const [org, setOrg] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/organization").then(r => r.json()).then(data => {
      setOrg(data.organization)
      setProfile(data.buyerProfile)
      if (data.organization) setForm(data.organization)
    })
  }, [])

  async function save() {
    setSaving(true)
    try {
      await fetch("/api/organization", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organization: form }) })
      setOrg(form)
      setEditing(false)
      toast.success("Organization updated")
    } catch { toast.error("Save failed") }
    setSaving(false)
  }

  function updateField(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  if (!org) return <p className="text-[#8e8579]">Loading…</p>

  const fields = ["legalName", "operatingName", "website", "businessType", "province", "city", "address", "postalCode"]

  function parseJson(s: string | null) { if (!s) return []
    try { return JSON.parse(s) } catch { return [] }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-[Georgia,serif] text-2xl text-[#151513]">Organization</h1>
        <Button variant={editing ? "default" : "outline"} className={editing ? "bg-[#c99743]" : "border-[#151513]"} onClick={() => editing ? save() : setEditing(true)} disabled={saving}>
          {editing ? <><Check className="w-4 h-4 mr-1" />Save</> : <><Pencil className="w-4 h-4 mr-1" />Edit</>}
        </Button>
      </div>

      <Card><CardHeader><CardTitle className="font-[Georgia,serif] text-lg">Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {fields.map(f => (
            <div key={f} className="grid grid-cols-3 gap-3 items-center">
              <Label className="text-xs text-[#8e8579] capitalize">{f.replace(/([A-Z])/g, ' $1')}</Label>
              {editing ? <Input className="col-span-2" value={form[f] ?? ""} onChange={e => updateField(f, e.target.value)} /> : <p className="col-span-2 text-sm">{org[f] ?? "—"}</p>}
            </div>
          ))}
          <div className="grid grid-cols-3 gap-3 items-center">
            <Label className="text-xs text-[#8e8579]">Year Established</Label>
            <p className="col-span-2 text-sm">{org.yearEstablished ?? "—"}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 items-center">
            <Label className="text-xs text-[#8e8579]">Locations</Label>
            <p className="col-span-2 text-sm">{org.numberOfLocations ?? "—"}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 items-center">
            <Label className="text-xs text-[#8e8579]">Status</Label>
            <p className="col-span-2"><Badge variant="outline">{org.status}</Badge></p>
          </div>
        </CardContent>
      </Card>

      {profile && (
        <Card><CardHeader><CardTitle className="font-[Georgia,serif] text-lg">Buyer Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {profile.roastingCapacityKgMonth && <div><p className="text-xs text-[#8e8579]">Monthly Capacity</p><p className="text-sm font-medium">{profile.roastingCapacityKgMonth} kg</p></div>}
              {profile.annualGreenCoffeeKg && <div><p className="text-xs text-[#8e8579]">Annual Consumption</p><p className="text-sm font-medium">{profile.annualGreenCoffeeKg} kg</p></div>}
              {profile.importExperience && <div><p className="text-xs text-[#8e8579]">Import Experience</p><p className="text-sm font-medium capitalize">{profile.importExperience}</p></div>}
            </div>
            {profile.mainCoffeeUses && parseJson(profile.mainCoffeeUses).length > 0 && (
              <div><p className="text-xs text-[#8e8579] mb-1">Coffee Uses</p><div className="flex flex-wrap gap-1">{parseJson(profile.mainCoffeeUses).map((u: string) => <Badge key={u} variant="secondary" className="capitalize">{u.replace(/_/g, ' ')}</Badge>)}</div></div>
            )}
            {profile.preferredOrigins && parseJson(profile.preferredOrigins).length > 0 && (
              <div><p className="text-xs text-[#8e8579] mb-1">Preferred Origins</p><div className="flex flex-wrap gap-1">{parseJson(profile.preferredOrigins).map((o: string) => <Badge key={o} variant="secondary">{o}</Badge>)}</div></div>
            )}
            {profile.notes && <div><p className="text-xs text-[#8e8579]">Notes</p><p className="text-sm">{profile.notes}</p></div>}
          </CardContent>
      </Card>
      )}
    </div>
  )
}