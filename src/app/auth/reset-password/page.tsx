"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

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
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { AuthBranding } from "@/components/auth/branding";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(data: ResetPasswordInput) {
    if (!code) {
      toast.error("Invalid or missing reset code. Please request a new password reset.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, code }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to reset password. Please try again.");
        return;
      }

      setSuccess(true);
      toast.success("Password reset successfully! You can now sign in.");
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
            {success ? "Password updated" : "Set new password"}
          </CardTitle>
          <CardDescription className="text-[#756e62] text-center text-sm">
            {success
              ? "Your password has been changed successfully"
              : "Choose a strong, unique password"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#68715e]/10">
                <CheckCircle2 className="h-6 w-6 text-[#68715e]" />
              </div>
              <p className="text-sm text-[#756e62] text-center leading-relaxed">
                Your password has been reset. You can now sign in with your new credentials.
              </p>
              <Button
                asChild
                className="mt-2 h-11 bg-[#c99743] hover:bg-[#b8862e] text-[#14110d] font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
              >
                <Link href="/auth/sign-in?reset=success">Sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {!code && (
                <div className="rounded-md border border-[#c76331]/30 bg-[#c76331]/5 p-3 text-sm text-[#c76331]">
                  Invalid or missing reset code. Please{" "}
                  <Link href="/auth/forgot-password" className="underline font-medium">
                    request a new reset link
                  </Link>
                  .
                </div>
              )}

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#151513] text-xs uppercase tracking-[0.1em]">
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="8+ characters, upper, lower, number"
                    autoComplete="new-password"
                    disabled={!code}
                    aria-invalid={!!errors.password}
                    className="h-11 border-[rgba(21,21,19,.17)] bg-transparent pr-10 placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#756e62] hover:text-[#151513] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[#c76331]">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#151513] text-xs uppercase tracking-[0.1em]">
                  Confirm password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    disabled={!code}
                    aria-invalid={!!errors.confirmPassword}
                    className="h-11 border-[rgba(21,21,19,.17)] bg-transparent pr-10 placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#756e62] hover:text-[#151513] transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-[#c76331]">{errors.confirmPassword.message}</p>
                )}
                <p className="text-[11px] text-[#b5ad9e] leading-relaxed">
                  Minimum 8 characters with uppercase, lowercase, and a number.
                </p>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading || !code}
                className="w-full h-11 bg-[#c99743] hover:bg-[#b8862e] text-[#14110d] font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting password…
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
            </form>
          )}
        </CardContent>

        {!success && (
          <CardFooter className="flex flex-col gap-3 items-center">
            <Link
              href="/auth/sign-in"
              className="text-sm text-[#c99743] hover:text-[#c76331] transition-colors"
            >
              ← Back to sign in
            </Link>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
