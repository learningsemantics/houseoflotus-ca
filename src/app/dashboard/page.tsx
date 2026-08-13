"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, FileText, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organization: {
    id: string;
    status: string;
    name: string;
    role: string;
  } | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      });
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#c76331] font-semibold mb-2">
          Welcome back
        </p>
        <h2 className="font-['Georgia',serif] text-2xl lg:text-3xl text-[#151513] leading-tight">
          {user ? `Good to see you, ${user.firstName}` : "Dashboard"}
        </h2>
      </div>

      {/* Org status */}
      {user?.organization && (
        <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-[#756e62] mb-1">
                  Organization
                </p>
                <p className="font-['Georgia',serif] text-lg text-[#151513]">
                  {user.organization.name}
                </p>
              </div>
              <Badge className="bg-[#c99743]/10 text-[#c99743] border-[#c99743]/20 hover:bg-[#c99743]/15">
                {user.organization.role.replace("_", " ")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-[#c99743]/10 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-[#c99743]" />
              </div>
              <p className="text-sm text-[#756e62]">Sourcing Projects</p>
            </div>
            <p className="font-['Georgia',serif] text-3xl text-[#151513]">0</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-[#c99743]/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#c99743]" />
              </div>
              <p className="text-sm text-[#756e62]">Active RFQs</p>
            </div>
            <p className="font-['Georgia',serif] text-3xl text-[#151513]">0</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-[#c99743]/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-[#c99743]" />
              </div>
              <p className="text-sm text-[#756e62]">Samples</p>
            </div>
            <p className="font-['Georgia',serif] text-3xl text-[#151513]">0</p>
          </CardContent>
        </Card>
      </div>

      {/* Get Started */}
      <Card className="bg-[#c99743]/5 border-[#c99743]/15">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-['Georgia',serif] text-lg text-[#151513] mb-2">
                Get Started with the Pilot
              </h3>
              <p className="text-sm text-[#524c43] leading-relaxed max-w-xl">
                Welcome to the House of Lotus Canada sourcing platform. As a pilot participant,
                you have early access to our tools for discovering, evaluating, and sourcing
                exceptional Indian grower coffees. Explore the platform and complete your
                organization profile to unlock all features.
              </p>
              <div className="flex gap-3 mt-5">
                <Link
                  href="/dashboard/organization"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c99743] text-[#14110d] text-[10px] uppercase tracking-[0.14em] font-bold rounded-md hover:bg-[#b8882e] transition-colors"
                >
                  Complete Your Profile
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <span
              className="text-[#c99743] text-3xl leading-none rotate-45 inline-block flex-shrink-0 mt-1"
              aria-hidden="true"
            >
              ♢
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
