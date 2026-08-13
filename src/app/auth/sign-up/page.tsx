import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { AuthBranding, AuthFooter } from "@/components/auth/branding";

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  async function onSubmit(data: SignUpInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Something went wrong. Please try again.");
        return;
      }

      toast.success("Account created! Check your email to verify your address.");
      router.push("/auth/sign-in?verified=check-email");
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
            Create your account
          </CardTitle>
          <CardDescription className="text-[#756e62] text-center text-sm">
            Join House of Lotus Canada as a wholesale buyer
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name fields side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[#151513] text-xs uppercase tracking-[0.1em]">
                  First name
                </Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-xs text-[#c76331]">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[#151513] text-xs uppercase tracking-[0.1em]">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  className="h-11 border-[rgba(21,21,19,.17)] bg-transparent placeholder:text-[#b5ad9e] focus-visible:ring-[#c99743]"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-xs text-[#c76331]">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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
              <Label htmlFor="password" className="text-[#151513] text-xs uppercase tracking-[0.1em]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8+ characters, upper, lower, number"
                  autoComplete="new-password"
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
              <p className="text-[11px] text-[#b5ad9e] leading-relaxed">
                Minimum 8 characters with uppercase, lowercase, and a number.
              </p>
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
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 items-center">
          <AuthFooter />
          <p className="text-sm text-[#756e62]">
            Already have an account?{" "}
            <Link
              href="/auth/sign-in"
              className="text-[#c99743] font-medium hover:text-[#c76331] transition-colors underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
