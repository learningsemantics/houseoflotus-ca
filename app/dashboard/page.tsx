"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, FileText, Package, ArrowRight } from "lucide-react"

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(setSession)
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-[Georgia,serif] text-3xl text-[#151513]">Welcome, {session?.user?.firstName ?? "there"}</h1>
        {session?.organization && (
          <p className="text-[#686157] mt-1">{session.organization.legalName} <Badge variant="outline" className="ml-2 text-green-700 border-green-300">{session.organization.status}</Badge></p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ label: "Sourcing Projects", icon: LayoutDashboard, value: 0 }, { label: "Active RFQs", icon: FileText, value: 0 }, { label: "Samples", icon: Package, value: 0 }].map(m => (
          <Card key={m.label}><CardContent className="pt-6 flex items-center gap-4"><div className="p-2 rounded-lg bg-[#f2eee5]"><m.icon className="w-5 h-5 text-[#c99743]" /></div><div><p className="text-2xl font-semibold text-[#151513]">{m.value}</p><p className="text-xs text-[#8e8579]">{m.label}</p></div></CardContent></Card>
        ))}
      </div>

      <Card className="border-[#c99743]/20 bg-white">
        <CardHeader><CardTitle className="font-[Georgia,serif] text-lg flex items-center gap-2"><ArrowRight className="w-5 h-5 text-[#c99743]" /> Get Started</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-[#686157]">Welcome to the House of Lotus pilot platform. Complete your organization profile to begin sourcing exceptional Indian coffees. Our team will review your application and unlock full access.</p>
        </CardContent>
      </Card>
    </div>
  )
}