import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

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
import { signInSchema, type SignInInput } from "@/lib/validations/auth";
import { AuthBranding } from "@/components/auth/branding";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Invalid email or password.");
        return;
      }

      // Determine redirect based on org status
      const { organization } = result;

      if (!organization) {
        router.push("/onboarding");
      } else if (organization.status !== "APPROVED") {
        router.push("/pending-approval");
      } else if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push("/dashboard");
      }
    } catch {
      toast.error("Network error. Please check your connection and try again.");
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
            Welcome back
          </CardTitle>
          <CardDescription className="text-[#756e62] text-center text-sm">
            Sign in to your House of Lotus buyer portal
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
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

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#151513] text-xs uppercase tracking-[0.1em]">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-[#c99743] hover:text-[#c76331] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#c99743] hover:bg-[#b8862e] text-[#14110d] font-semibold text-xs uppercase tracking-[0.14em] transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 items-center">
          <p className="text-sm text-[#756e62]">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="text-[#c99743] font-medium hover:text-[#c76331] transition-colors underline underline-offset-2"
            >
              Create one
            </Link>
          </p>
          <Link
            href="/"
            className="text-xs text-[#b5ad9e] hover:text-[#756e62] transition-colors"
          >
            ← Back to House of Lotus
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
