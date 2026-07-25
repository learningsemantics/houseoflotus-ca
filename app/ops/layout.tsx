"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Building2, ArrowLeft, LogOut } from "lucide-react"

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(data => {
      if (!data.user || !data.user.isInternal) { router.push("/"); return }
      setSession(data)
    }).catch(() => router.push("/"))
  }, [router])

  const signOut = async () => { await fetch("/api/auth/sign-out", { method: "POST" }); router.push("/sign-in") }

  if (!session) return <div className="min-h-screen flex items-center justify-center bg-white"><p>Loading…</p></div>

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0">
        <div className="px-5 py-6">
          <span className="text-[#c99743] text-xl inline-block rotate-45" aria-hidden="true">♢</span>
          <p className="font-[Georgia,serif] text-sm tracking-[0.13em] text-[#151513] mt-2">HOUSE OF LOTUS</p>
          <p className="text-[7px] tracking-[0.42em] text-[#756e62] uppercase">Operations</p>
        </div>
        <nav className="flex-1 px-3 py-2">
          <Link href="/ops/buyers" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${pathname === "/ops/buyers" ? "bg-gray-100 text-[#c99743] font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
            <Building2 className="w-4 h-4" />Buyer Management
          </Link>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 mt-4">
            <ArrowLeft className="w-4 h-4" />Back to Site
          </Link>
        </nav>
        <div className="px-4 py-3 border-t"><Button variant="ghost" size="sm" className="w-full justify-start text-gray-500" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button></div>
      </aside>
      <main className="flex-1 ml-56"><header className="h-14 bg-white border-b border-gray-200 flex items-center px-6"><h2 className="font-[Georgia,serif] text-lg text-[#151513]">Operations</h2></header><div className="p-6">{children}</div></main>
    </div>
  )
}