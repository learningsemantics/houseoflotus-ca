"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AuthBranding, AuthFooter } from "@/components/auth/branding"
import { toast } from "sonner"

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<SignUpInput>({ firstName: "", lastName: "", email: "", password: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(field: keyof SignUpInput, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = signUpSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((i) => { fieldErrors[i.path[0] as string] = i.message })
      setErrors(fieldErrors)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Sign up failed")
      toast.success("Account created! Please check your email to verify.")
      router.push("/sign-in")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed")
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
            Create your account
          </CardTitle>
          <CardDescription className="text-center text-[#8e8579]">
            Join House of Lotus as a buyer partner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Jane" />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Doe" />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="jane@roastery.ca" />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min 8 chars, uppercase, lowercase, number" />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full bg-[#c99743] hover:bg-[#b8893d] text-white" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="text-center text-sm text-[#8e8579] mt-6">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-[#c99743] font-medium hover:underline">Sign in</Link>
          </p>
          <AuthFooter />
        </CardContent>
      </Card>
    </div>
  )
}