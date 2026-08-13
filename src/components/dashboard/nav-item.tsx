"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";
import { type LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export function NavItem({ label, href, icon: Icon, disabled = false }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (disabled) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-md text-[#b5ad9e] cursor-not-allowed select-none"
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="text-sm">{label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-[#151513] text-[#f2eee5] border-0 text-xs">
            Coming soon
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        isActive
          ? "bg-[#c99743]/10 text-[#151513] font-medium border-l-2 border-[#c99743] -ml-[2px] pl-[13px]"
          : "text-[#524c43] hover:bg-[#c99743]/5 hover:text-[#151513]"
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span>{label}</span>
    </Link>
  );
}
