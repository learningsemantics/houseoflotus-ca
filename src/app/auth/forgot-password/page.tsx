"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { AuthBranding } from "@/components/auth/branding";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Something went wrong.");
        return;
      }

      // Always show success to prevent email enumeration
      setSent(true);
      toast.success("Check your email for a reset link.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#f2eee5]">
      <Card className="w-full max-w-md border-[rgba(21,21,19,.12)] shadow-sm bg-white/60 backdrop-blur-sm">
        <CardHeader className="items-center pb-2">
          <AuthBranding />
          <CardTitle className="font-['Georgia',serif] text-2xl tracking-tight text-[#151513] text-center">
            Reset your password
          </CardTitle>
          <CardDescription className="text-[#756e62] text-center text-sm">
            {sent
              ? "Check your inbox for further instructions"
              : "Enter your email and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#c99743]/10">
                <Mail className="h-6 w-6 text-[#c99743]" />
              </div>
              <p className="text-sm text-[#756e62] text-center leading-relaxed">
                We sent a password reset link to{" "}
                <span className="font-medium text-[#151513]">{getValues("email")}</span>.
                Please check your inbox and follow the instructions.
              </p>
              <p className="text-xs text-[#b5ad9e]">
                Didn&apos;t receive it? Check your spam folder.
              </p>
              <Button
                variant="outline"
                onClick={() => setSent(false)}
                className="mt-2 border-[rgba(21,21,19,.17)] text-xs uppercase tracking-[0.1em] hover:bg-[#f2eee5]"
              >
                Try a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#151513] text-xs uppercase tracking-[0.1em]">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-[#c76331]">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#c99743] hover:bg-[#b8862e] text-[#14110d] font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 items-center">
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-1 text-sm text-[#c99743] hover:text-[#c76331] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
