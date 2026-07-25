"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"

export default function SettingsPage() {
  const [org, setOrg] = useState<any>(null)
  const [addresses, setAddresses] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/organization").then(r => r.json()).then(data => { setOrg(data.organization); setAddresses(data.addresses) })
  }, [])

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-[Georgia,serif] text-2xl text-[#151513]">Settings</h1>
      <Card><CardHeader><CardTitle className="font-[Georgia,serif] text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-[#c99743]" />Addresses</CardTitle></CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="text-sm text-[#8e8579]">No addresses configured. Update your organization profile to add addresses.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map(a => (
                <div key={a.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1"><Badge variant="outline">{a.label}</Badge>{a.isDefault && <Badge className="bg-[#c99743] text-white">Default</Badge>}</div>
                  <p className="text-sm">{a.street ? `${a.street}, ` : ""}{a.city}{a.province ? `, ${a.province}` : ""}{a.postalCode ? ` ${a.postalCode}` : ""}</p>
                  <p className="text-xs text-[#8e8579]">{a.country}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}