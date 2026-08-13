"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthBranding } from "@/components/auth/branding";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OrgStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "NEEDS_INFORMATION"
  | "REJECTED"
  | "SUSPENDED";

interface OrgData {
  id: string;
  legalName: string;
  status: OrgStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  infoRequestNotes: string | null;
}

const STATUS_CONFIG: Record<
  OrgStatus,
  { icon: typeof Clock; label: string; description: string; color: string }
> = {
  SUBMITTED: {
    icon: Clock,
    label: "Application Submitted",
    description:
      "Your buyer application has been received. Our team will review it within 2-3 business days.",
    color: "#c99743",
  },
  UNDER_REVIEW: {
    icon: RefreshCw,
    label: "Under Review",
    description:
      "Your application is currently being reviewed by our team. We'll update you soon.",
    color: "#c99743",
  },
  APPROVED: {
    icon: CheckCircle2,
    label: "Application Approved",
    description:
      "Congratulations! Your buyer account has been approved. You now have access to the wholesale portal.",
    color: "#68715e",
  },
  NEEDS_INFORMATION: {
    icon: AlertCircle,
    label: "Additional Information Required",
    description:
      "We need a bit more information to process your application. Please check your email for details.",
    color: "#c76331",
  },
  REJECTED: {
    icon: XCircle,
    label: "Application Not Approved",
    description:
      "Unfortunately, your application was not approved at this time.",
    color: "#c76331",
  },
  SUSPENDED: {
    icon: XCircle,
    label: "Account Suspended",
    description:
      "Your buyer account has been suspended. Please contact support for more information.",
    color: "#c76331",
  },
  DRAFT: {
    icon: Clock,
    label: "Application Draft",
    description: "Your application is still in draft. Please complete and submit it.",
    color: "#b5ad9e",
  },
};

export default function PendingApprovalPage() {
  const router = useRouter();
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noApplication, setNoApplication] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabase = createBrowserSupabaseClient();

  const fetchStatus = useCallback(async () => {
    try {
      // Verify session is still valid
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth/sign-in");
        return;
      }

      const res = await fetch("/api/onboarding/status");
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to fetch status");
        return;
      }

      if (!result.hasApplication) {
        setNoApplication(true);
        setLoading(false);
        return;
      }

      setOrgData(result.organization);

      // If approved, stop polling and redirect
      if (result.status === "APPROVED") {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        // Small delay so user sees the approved status briefly
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }

      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }, [router, supabase.auth]);

  // Initial fetch and poll for status changes
  useEffect(() => {
    // Fire initial fetch via timeout so it's async (not synchronous setState in effect)
    const initialTimeout = setTimeout(() => { void fetchStatus(); }, 0);

    // Poll every 30 seconds
    pollRef.current = setInterval(fetchStatus, 30000);

    return () => {
      clearTimeout(initialTimeout);
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchStatus]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchStatus();
  };

  // If no application, redirect to onboarding
  if (noApplication) {
    router.push("/onboarding");
    return null;
  }

  const statusConfig = orgData ? STATUS_CONFIG[orgData.status] : null;
  const StatusIcon = statusConfig?.icon ?? Clock;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#f2eee5]">
      <Card className="w-full max-w-lg border-[rgba(21,21,19,.12)] shadow-sm bg-white/60 backdrop-blur-sm">
        <CardHeader className="items-center pb-2">
          <AuthBranding />
        </CardHeader>

        <CardContent className="space-y-6">
          {loading && !orgData ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#c99743]" />
              <p className="text-sm text-[#756e62]">
                Checking your application status…
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-8 w-8 text-[#c76331]" />
              <p className="text-sm text-[#c76331]">{error}</p>
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="border-[rgba(21,21,19,.17)] text-xs uppercase tracking-[0.1em]"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Try again
              </Button>
            </div>
          ) : statusConfig && orgData ? (
            <div className="text-center space-y-4">
              {/* Status Icon */}
              <div
                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${statusConfig.color}15` }}
              >
                <StatusIcon
                  className="h-8 w-8"
                  style={{ color: statusConfig.color }}
                />
              </div>

              {/* Status Label */}
              <CardTitle
                className="font-['Georgia',serif] text-xl"
                style={{ color: statusConfig.color }}
              >
                {statusConfig.label}
              </CardTitle>

              <CardDescription className="text-sm text-[#756e62] text-center leading-relaxed max-w-sm mx-auto">
                {statusConfig.description}
              </CardDescription>

              {/* Additional context for specific statuses */}
              {orgData.status === "REJECTED" && orgData.rejectionReason && (
                <div className="bg-[#c76331]/5 border border-[#c76331]/20 rounded-lg p-4 text-left">
                  <p className="text-xs uppercase tracking-wider text-[#c76331] font-semibold mb-1">
                    Reason
                  </p>
                  <p className="text-sm text-[#151513]">
                    {orgData.rejectionReason}
                  </p>
                </div>
              )}

              {orgData.status === "NEEDS_INFORMATION" &&
                orgData.infoRequestNotes && (
                  <div className="bg-[#c76331]/5 border border-[#c76331]/20 rounded-lg p-4 text-left">
                    <p className="text-xs uppercase tracking-wider text-[#c76331] font-semibold mb-1">
                      Information Requested
                    </p>
                    <p className="text-sm text-[#151513]">
                      {orgData.infoRequestNotes}
                    </p>
                  </div>
                )}

              <Separator className="bg-[rgba(21,21,19,.08)]" />

              {/* Organization Details */}
              <div className="text-left space-y-2">
                <p className="text-xs uppercase tracking-wider text-[#756e62]">
                  Organization
                </p>
                <p className="text-[#151513] font-medium">{orgData.legalName}</p>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#756e62]">
                      Submitted
                    </p>
                    <p className="text-xs text-[#151513]">
                      {formatDate(orgData.submittedAt)}
                    </p>
                  </div>
                  {orgData.reviewedAt && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#756e62]">
                        Reviewed
                      </p>
                      <p className="text-xs text-[#151513]">
                        {formatDate(orgData.reviewedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="border-[rgba(21,21,19,.17)] text-xs uppercase tracking-[0.1em]"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh status
              </Button>

              <p className="text-xs text-[#b5ad9e]">
                This page refreshes automatically every 30 seconds
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
