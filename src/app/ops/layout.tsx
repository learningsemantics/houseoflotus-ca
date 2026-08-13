'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft, Sprout } from 'lucide-react';

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: string;
  isInternal: boolean;
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        const sessionUser = data?.user;
        if (!sessionUser || !sessionUser.isInternal ||
            (sessionUser.globalRole !== 'OPS_ADMIN' && sessionUser.globalRole !== 'SUPER_ADMIN')) {
          router.push('/');
          return;
        }
        setUser(sessionUser);
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="h-14 flex items-center px-5 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-900 tracking-wide">HOL Ops</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link
            href="/ops/growers"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname.startsWith('/ops/growers')
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Sprout className="h-4 w-4" />
            Grower Network
          </Link>
          <Link
            href="/ops/buyers"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/ops/buyers'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Buyer Management
          </Link>
        </nav>
        <div className="p-3 border-t border-gray-200">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center px-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-gray-900">Operations</h1>
          <span className="ml-3 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {user.firstName} {user.lastName}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
