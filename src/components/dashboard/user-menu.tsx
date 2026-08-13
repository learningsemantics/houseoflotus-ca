"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Settings, Building2 } from "lucide-react";

interface UserMenuProps {
  firstName: string;
  lastName: string;
  email: string;
}

function getInitials(first: string, last: string) {
  return `${(first || "?")[0]}${(last || "?")[0]}`.toUpperCase();
}

export function UserMenu({ firstName, lastName, email }: UserMenuProps) {
  const router = useRouter();
  const initials = getInitials(firstName, lastName);

  const handleSignOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/auth/sign-in");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[#c99743]/5 transition-colors w-full outline-none">
        <Avatar className="h-8 w-8 border border-[#c99743]/30">
          <AvatarFallback className="bg-[#c99743]/10 text-[#c99743] text-xs font-medium font-['Georgia',serif]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 text-left hidden sm:block">
          <p className="text-sm font-medium text-[#151513] truncate">
            {firstName} {lastName}
          </p>
          <p className="text-xs text-[#756e62] truncate">{email}</p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="gap-2 cursor-pointer">
          <User className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/organization")} className="gap-2 cursor-pointer">
          <Building2 className="h-4 w-4" />
          Organization
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="gap-2 cursor-pointer">
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-[#c76331]">
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
