"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function PendingApprovalPage() {
  const router = useRouter()
  const [org, setOrg] = useState<{ legalName: string; status: string; submittedAt: string | null; rejectionReason: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  async function checkStatus() {
    try {
      const res = await fetch("/api/onboarding/status")
      const data = await res.json()
      if (data.status === "APPROVED") {
        setTimeout(() => router.push("/dashboard"), 1500)
        return
      }
      if (data.hasOrganization) setOrg(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { checkStatus() }, [])
  useEffect(() => {
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  async function signOut() {
    await fetch("/api/auth/sign-out", { method: "POST" })
    router.push("/sign-in")
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f2eee5" }}><p>Loading…</p></div>

  const statusConfig: Record<string, { label: string; color: string; message: string }> = {
    SUBMITTED: { label: "Submitted", color: "bg-yellow-100 text-yellow-800", message: "Your application has been received and is waiting for review." },
    UNDER_REVIEW: { label: "Under Review", color: "bg-blue-100 text-blue-800", message: "Our team is reviewing your application." },
    APPROVED: { label: "Approved", color: "bg-green-100 text-green-800", message: "Your application has been approved! Redirecting…" },
    NEEDS_INFORMATION: { label: "Needs Information", color: "bg-orange-100 text-orange-800", message: "We need additional information. Please check your email." },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800", message: org?.rejectionReason || "Your application was not approved. Please contact hello@houseoflotus.ca." },
    SUSPENDED: { label: "Suspended", color: "bg-gray-100 text-gray-800", message: "Your account has been suspended. Please contact hello@houseoflotus.ca." },
  }

  const config = statusConfig[org?.status ?? "SUBMITTED"] ?? statusConfig.SUBMITTED

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f2eee5" }}>
      <Card className="w-full max-w-md border-0 shadow-lg text-center">
        <CardContent className="pt-10 pb-8 space-y-6">
          <span className="text-[#c99743] text-5xl inline-block rotate-45" aria-hidden="true">♢</span>
          <h1 className="font-[Georgia,serif] text-2xl text-[#151513]">{org?.legalName ?? "Your Application"}</h1>
          <Badge className={config.color}>{config.label}</Badge>
          <p className="text-[#686157]">{config.message}</p>
          {org?.submittedAt && (
            <p className="text-xs text-[#8e8579]">Submitted {new Date(org.submittedAt).toLocaleDateString()}</p>
          )}
          <Button variant="outline" onClick={signOut} className="border-[#151513]">Sign out</Button>
        </CardContent>
      </Card>
    </div>
  )
}
