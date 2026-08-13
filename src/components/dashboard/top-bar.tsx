"use client";

import { UserMenu } from "@/components/dashboard/user-menu";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  onMenuClick: () => void;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export function TopBar({ title, onMenuClick, user }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-white border-b border-[rgba(21,21,19,.12)]">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 text-[#524c43] hover:text-[#151513] hover:bg-[#c99743]/5"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <h1 className="font-['Georgia',serif] text-lg text-[#151513]">{title}</h1>
      </div>

      <div className="md:hidden">
        <UserMenu
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
        />
      </div>
    </header>
  );
}
