"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organization: {
    id: string;
    status: string;
    name: string;
    operatingName?: string | null;
    role: string;
  } | null;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/organization": "Organization",
  "/dashboard/team": "Team",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
  "/dashboard/growers": "Grower Network",
  "/dashboard/growers/[id]": "Grower Profile",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] || "Dashboard";

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/auth/sign-in");
          return;
        }
        if (data.user.organization && data.user.organization.status !== "APPROVED") {
          router.push("/pending-approval");
          return;
        }
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        router.push("/auth/sign-in");
      });
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-64 border-r border-[rgba(21,21,19,.12)] bg-white p-6">
          <Skeleton className="h-8 w-40 mb-6" />
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        {/* Main skeleton */}
        <div className="flex-1">
          <Skeleton className="h-16 w-full border-b border-[rgba(21,21,19,.12)]" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <DashboardSidebar user={user} role={user.organization?.role} />
      </div>

      {/* Mobile sidebar (Sheet) — key resets closed state on route change */}
      <Sheet
        key={pathname}
        open={mobileOpen}
        onOpenChange={setMobileOpen}
      >
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <DashboardSidebar user={user} role={user.organization?.role} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={pageTitle} onMenuClick={() => setMobileOpen(true)} user={user} />
        <main className="flex-1 overflow-y-auto bg-[#f2eee5]">
          {children}
        </main>
      </div>
    </div>
  );
}
