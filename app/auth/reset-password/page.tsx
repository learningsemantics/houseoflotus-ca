"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { resetPasswordSchema } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AuthBranding, AuthFooter } from "@/components/auth/branding"
import { toast } from "sonner"

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({ password: "", confirmPassword: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!code) toast.error("Invalid or missing reset code")
  }, [code])

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => { const n = { ...e }; delete n[field]; return n })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!code) return
    const result = resetPasswordSchema.safeParse(form)
    if (!result.success) {
      const fe: Record<string, string> = {}
      result.error.issues.forEach((i) => { fe[i.path[0] as string] = i.message })
      setErrors(fe)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password: result.data.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Reset failed")
      setDone(true)
      setTimeout(() => router.push("/sign-in"), 2000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f2eee5" }}>
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="pt-8 text-center">
            <p className="text-[#c99743] text-4xl mb-4">✓</p>
            <h2 className="font-[Georgia,serif] text-xl text-[#151513]">Password updated</h2>
            <p className="text-sm text-[#8e8579] mt-2">Redirecting to sign in…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f2eee5" }}>
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="pb-4">
          <AuthBranding />
          <CardTitle className="font-[Georgia,serif] text-2xl text-center text-[#151513] font-normal">
            New password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>
            <Button type="submit" className="w-full bg-[#c99743] hover:bg-[#b8893d] text-white" disabled={loading}>
              {loading ? "Updating…" : "Reset password"}
            </Button>
          </form>
          <p className="text-center text-sm text-[#8e8579] mt-6">
            <Link href="/sign-in" className="text-[#c99743] hover:underline">Back to sign in</Link>
          </p>
          <AuthFooter />
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#f2eee5" }}><p>Loading…</p></div>}>
      <ResetForm />
    </Suspense>
  )
}