"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LayoutDashboard, FolderOpen, FileText, Package, Users, FileStack,
  Building2, User, Settings, Menu, LogOut, ChevronRight,
} from "lucide-react"

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, disabled: false },
  { label: "Sourcing Projects", href: "/dashboard", icon: FolderOpen, disabled: true },
  { label: "RFQs", href: "/dashboard", icon: FileText, disabled: true },
  { label: "Samples", href: "/dashboard", icon: Package, disabled: true },
  { label: "Group Orders", href: "/dashboard", icon: Users, disabled: true },
  { label: "Documents", href: "/dashboard", icon: FileStack, disabled: true },
]

const accountItems = [
  { label: "Organization", href: "/dashboard/organization", icon: Building2, disabled: false },
  { label: "Team", href: "/dashboard/team", icon: Users, disabled: false },
  { label: "Profile", href: "/dashboard/profile", icon: User, disabled: false },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, disabled: false },
]

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6">
        <span className="text-[#c99743] text-2xl leading-none inline-block rotate-45" aria-hidden="true">♢</span>
        <p className="font-[Georgia,serif] text-sm tracking-[0.13em] text-[#151513] mt-2">HOUSE OF LOTUS</p>
        <p className="text-[7px] tracking-[0.42em] text-[#756e62] uppercase">Canada</p>
      </div>
      <Separator />
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[8px] tracking-[0.15em] text-[#8e8579] uppercase px-3 mb-2">Sourcing</p>
        {navItems.map((item) => {
          const active = !item.disabled && pathname === item.href
          return (
            <div key={item.label} title={item.disabled ? "Coming soon" : undefined}>
              {item.disabled ? (
                <div className="flex items-center gap-3 px-3 py-2 text-gray-400 cursor-not-allowed">
                  <item.icon className="w-4 h-4" /><span className="text-sm">{item.label}</span>
                </div>
              ) : (
                <Link href={item.href} onClick={onNavigate} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active ? "bg-[#f2eee5] text-[#c99743] font-medium border-l-2 border-[#c99743]" : "text-[#686157] hover:bg-gray-50"}`}>
                  <item.icon className="w-4 h-4" /><span>{item.label}</span>
                </Link>
              )}
            </div>
          )
        })}
        <Separator className="my-3" />
        <p className="text-[8px] tracking-[0.15em] text-[#8e8579] uppercase px-3 mb-2">Account</p>
        {accountItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link key={item.label} href={item.href} onClick={onNavigate} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active ? "bg-[#f2eee5] text-[#c99743] font-medium border-l-2 border-[#c99743]" : "text-[#686157] hover:bg-gray-50"}`}>
              <item.icon className="w-4 h-4" /><span>{item.label}</span>
              <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(data => {
      if (!data.user) { router.push("/sign-in"); return }
      if (data.organization?.status !== "APPROVED") { router.push("/pending-approval"); return }
      setSession(data)
    }).catch(() => router.push("/sign-in"))
  }, [router])

  const signOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" })
    router.push("/sign-in")
  }

  if (!session) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f2eee5" }}><p className="text-[#8e8579]">Loading…</p></div>

  const initials = (session.user.firstName?.[0] ?? "") + (session.user.lastName?.[0] ?? "")

  return (
    <div className="min-h-screen flex" style={{ background: "#f2eee5" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed inset-y-0 left-0 z-20">
        <NavContent />
        <Separator />
        <div className="px-4 py-3 flex items-center gap-3">
          <Avatar className="w-8 h-8"><AvatarFallback className="bg-[#f2eee5] text-[#c99743] text-xs">{initials || "U"}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{session.user.firstName} {session.user.lastName}</p><p className="text-[10px] text-[#8e8579] truncate">{session.user.email}</p></div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8e8579]" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </aside>

      {/* Mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="md:hidden fixed top-3 left-3 z-30">
          <Button variant="ghost" size="icon" className="bg-white shadow-sm"><Menu className="w-5 h-5" /></Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0"><NavContent onNavigate={() => setMobileOpen(false)} /></SheetContent>
      </Sheet>

      {/* Main */}
      <main className="flex-1 md:ml-64">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6"><div className="md:hidden w-10" /><h2 className="font-[Georgia,serif] text-lg text-[#151513]">Dashboard</h2></header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}