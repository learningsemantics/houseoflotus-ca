"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "lib/supabase/client"
import { signInSchema, type SignInInput } from "lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AuthBranding, AuthFooter } from "@/components/auth/branding"
import { toast } from "sonner"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/dashboard"
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<SignInInput>({ email: "", password: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(field: keyof SignInInput, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = signInSchema.safeParse(form)
    if (!result.success) {
      const fe: Record<string, string> = {}
      result.error.issues.forEach((i) => { fe[i.path[0] as string] = i.message })
      setErrors(fe)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Sign in failed")

      // Determine redirect based on org status
      if (data.orgStatus === "APPROVED") {
        router.push("/dashboard")
      } else if (data.orgStatus && data.orgStatus !== "DRAFT") {
        router.push("/pending-approval")
      } else {
        router.push(data.hasOrganization ? "/pending-approval" : "/onboarding")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f2eee5" }}>
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="pb-4">
          <AuthBranding />
          <CardTitle className="font-[Georgia,serif] text-2xl text-center text-[#151513] font-normal">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-[#8e8579]">
            Sign in to your House of Lotus account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="jane@roastery.ca" />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Your password" />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
            <div className="text-right">
              <Link href="/forgot-password" className="text-xs text-[#c99743] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full bg-[#c99743] hover:bg-[#b8893d] text-white" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="text-center text-sm text-[#8e8579] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="text-[#c99743] font-medium hover:underline">Create one</Link>
          </p>
          <AuthFooter />
        </CardContent>
      </Card>
    </div>
  )
}