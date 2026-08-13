"use client";

import Link from "next/link";
import { NavItem } from "@/components/dashboard/nav-item";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Package,
  Users,
  FileStack,
  Building2,
  User,
  Settings,
  Sprout,
} from "lucide-react";

interface SidebarProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  role?: string | null;
}

function isBuyerRole(role?: string | null): boolean {
  return role === "BUYER_ADMIN" || role === "BUYER_MEMBER";
}

export function DashboardSidebar({ user, role }: SidebarProps) {
  const showGrowerNetwork = isBuyerRole(role);

  return (
    <aside className="flex flex-col h-full bg-white border-r border-[rgba(21,21,19,.12)]">
      {/* Branding */}
      <div className="px-6 pt-6 pb-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span
            className="text-[#c99743] text-2xl leading-none rotate-45 inline-block"
            aria-hidden="true"
          >
            ♢
          </span>
          <div>
            <h1 className="font-['Georgia',serif] text-sm tracking-[0.13em] text-[#151513] leading-tight">
              HOUSE OF LOTUS
            </h1>
            <span className="font-[Arial,sans-serif] text-[6px] tracking-[0.42em] text-[#756e62]">
              CANADA
            </span>
          </div>
        </Link>
      </div>

      <Separator className="bg-[rgba(21,21,19,.08)]" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem label="Overview" href="/dashboard" icon={LayoutDashboard} />

        <div className="pt-3 pb-1 px-3">
          <span className="text-[9px] uppercase tracking-[0.18em] text-[#b5ad9e] font-medium">
            Sourcing
          </span>
        </div>
        {showGrowerNetwork && (
          <NavItem label="Grower Network" href="/dashboard/growers" icon={Sprout} />
        )}
        <NavItem label="Sourcing Projects" href="/dashboard" icon={FolderOpen} disabled />
        <NavItem label="RFQs" href="/dashboard" icon={FileText} disabled />
        <NavItem label="Samples" href="/dashboard" icon={Package} disabled />
        <NavItem label="Group Orders" href="/dashboard" icon={Users} disabled />
        <NavItem label="Documents" href="/dashboard" icon={FileStack} disabled />

        <Separator className="my-3 bg-[rgba(21,21,19,.08)]" />

        <div className="pb-1 px-3">
          <span className="text-[9px] uppercase tracking-[0.18em] text-[#b5ad9e] font-medium">
            Account
          </span>
        </div>
        <NavItem label="Organization" href="/dashboard/organization" icon={Building2} />
        <NavItem label="Team" href="/dashboard/team" icon={Users} />
        <NavItem label="Profile" href="/dashboard/profile" icon={User} />
        <NavItem label="Settings" href="/dashboard/settings" icon={Settings} />
      </nav>

      {/* User menu at bottom */}
      <Separator className="bg-[rgba(21,21,19,.08)]" />
      <div className="p-3">
        <UserMenu
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
        />
      </div>
    </aside>
  );
}
