"use client"

import { useState } from "react"
import Link from "next/link"
import { forgotPasswordSchema } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AuthBranding, AuthFooter } from "@/components/auth/branding"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = forgotPasswordSchema.safeParse({ email })
    if (!result.success) { setError(result.error.issues[0].message); return }
    setLoading(true)
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: result.data.email }),
      })
      setSent(true)
    } catch {
      toast.error("Something went wrong")
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
            Reset your password
          </CardTitle>
          <CardDescription className="text-center text-[#8e8579]">
            {sent ? "Check your email for a reset link" : "We'll send you a link to reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-[#686157]">If an account exists for {email}, you will receive a password reset email shortly.</p>
              <Link href="/sign-in"><Button variant="outline" className="border-[#151513]">Back to sign in</Button></Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError("") }} placeholder="jane@roastery.ca" />
                {error && <p className="text-xs text-red-500">{error}</p>}
              </div>
              <Button type="submit" className="w-full bg-[#c99743] hover:bg-[#b8893d] text-white" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
          <p className="text-center text-sm text-[#8e8579] mt-6">
            <Link href="/sign-in" className="text-[#c99743] hover:underline">Back to sign in</Link>
          </p>
          <AuthFooter />
        </CardContent>
      </Card>
    </div>
  )
}