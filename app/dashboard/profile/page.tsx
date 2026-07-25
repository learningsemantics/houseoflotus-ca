"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Pencil, Check } from "lucide-react"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(data => {
      setProfile(data.profile)
      if (data.profile) setForm({ firstName: data.profile.firstName ?? "", lastName: data.profile.lastName ?? "", jobTitle: data.profile.jobTitle ?? "", phone: data.profile.phone ?? "" })
    })
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error()
      setProfile(p => ({ ...p, ...form }))
      setEditing(false)
      toast.success("Profile updated")
    } catch { toast.error("Save failed") }
    setSaving(false)
  }

  if (!profile) return <p className="text-[#8e8579]">Loading…</p>
  const initials = (profile.firstName?.[0] ?? "") + (profile.lastName?.[0] ?? "")
  const fields = ["firstName", "lastName", "jobTitle", "phone"]
  const labels: Record<string, string> = { firstName: "First Name", lastName: "Last Name", jobTitle: "Job Title", phone: "Phone" }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-[Georgia,serif] text-2xl text-[#151513]">Profile</h1>
        <Button variant={editing ? "default" : "outline"} className={editing ? "bg-[#c99743]" : "border-[#151513]"} onClick={() => editing ? save() : setEditing(true)} disabled={saving}>
          {editing ? <><Check className="w-4 h-4 mr-1" />Save</> : <><Pencil className="w-4 h-4 mr-1" />Edit</>}
        </Button>
      </div>
      <Card><CardContent className="pt-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#f2eee5] flex items-center justify-center text-[#c99743] font-[Georgia,serif] text-xl">{initials || "U"}</div>
          <div><p className="text-sm text-[#8e8579]">Email (managed by authentication)</p><p className="font-medium">{profile.email}</p></div>
        </div>
        <div className="space-y-3">
          {fields.map(f => (
            <div key={f} className="grid grid-cols-3 gap-3 items-center">
              <Label className="text-xs text-[#8e8579]">{labels[f]}</Label>
              {editing ? <Input className="col-span-2" value={form[f] ?? ""} onChange={e => setForm({ ...form, [f]: e.target.value })} /> : <p className="col-span-2 text-sm">{profile[f] ?? "—"}</p>}
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  )
}