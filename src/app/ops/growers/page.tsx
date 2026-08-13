'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { GrowerStatusBadge, VerificationBadge, PipelineFunnel, GrowerFilters } from '@/components/growers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GROWER_TYPE_LABELS, COFFEE_SPECIES_LABELS, DEFAULT_PAGE_SIZE } from '@/lib/grower/constants';
import type { GrowerListItem, GrowerFilters as FiltersType, GrowerListResponse } from '@/lib/grower/types';
import type { LucideIcon } from 'lucide-react';
import { Upload, Search, Sprout, ShieldCheck, Activity, Package } from 'lucide-react';

// ── Types ─────────────────────────────────────────────

interface Stats {
  totalGrowers: number;
  discovered: number;
  verified: number;
  active: number;
  totalLots: number;
}

interface FunnelData {
  stage: string;
  label: string;
  count: number;
  color: string;
}

// ── Sub-components ──────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: number | string | undefined; color: string }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 leading-none">{value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MobileGrowerCard({ grower, onClick }: { grower: GrowerListItem; onClick: () => void }) {
  return (
    <div onClick={onClick} className="border border-gray-200 rounded-lg p-4 cursor-pointer active:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-gray-900 truncate">{grower.displayName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {grower.state ?? 'Unknown'} · {GROWER_TYPE_LABELS[grower.growerType]}
          </p>
        </div>
        <VerificationBadge status={grower.verificationStatus} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <GrowerStatusBadge status={grower.relationshipStatus} size="sm" />
        {grower.primarySpecies && (
          <span className="text-[11px] text-gray-400">
            {COFFEE_SPECIES_LABELS[grower.primarySpecies]}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────

export default function GrowersPage() {
  const router = useRouter();
  const [growers, setGrowers] = useState<GrowerListItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [funnel, setFunnel] = useState<FunnelData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: DEFAULT_PAGE_SIZE, totalItems: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FiltersType>({});

  // Fetch growers list
  const fetchGrowers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(filters.page ?? 1));
      params.set('pageSize', String(filters.pageSize ?? DEFAULT_PAGE_SIZE));
      if (search) params.set('search', search);
      if (filters.state) params.set('state', String(filters.state));
      if (filters.primarySpecies) params.set('primarySpecies', String(filters.primarySpecies));
      if (filters.verificationStatus) params.set('verificationStatus', String(filters.verificationStatus));
      if (filters.relationshipStatus) params.set('relationshipStatus', String(filters.relationshipStatus));

      const res = await fetch(`/api/ops/growers?${params.toString()}`);
      if (!res.ok) return;
      const data: GrowerListResponse = await res.json();
      setGrowers(data.growers);
      setPagination(data.pagination);
    } catch {
      // silently fail
    }
  }, [search, filters]);

  // Fetch stats
  useEffect(() => {
    (async () => {
      try {
        const [statsRes, funnelRes] = await Promise.all([
          fetch('/api/growers/stats/summary'),
          fetch('/api/growers/stats/funnel'),
        ]);
        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats({
            totalGrowers: s.totalGrowers ?? 0,
            discovered: s.byRelationshipStatus?.DISCOVERED ?? 0,
            verified: s.byRelationshipStatus?.VERIFIED ?? 0,
            active: s.byRelationshipStatus?.ACTIVE_GROWER ?? 0,
            totalLots: s.totalLots ?? 0,
          });
        }
        if (funnelRes.ok) {
          setFunnel(await funnelRes.json());
        }
      } catch {
        // silently fail
      }
    })();
  }, []);

  // Fetch growers on search/filters change
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        await fetchGrowers();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const timer = setTimeout(load, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fetchGrowers]);

  const totalPages = pagination.totalPages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Grower Network</h2>
          <p className="text-sm text-gray-500">Manage and discover coffee growers across India</p>
        </div>
        <Button asChild className="bg-[#1a3c2e] hover:bg-[#1a3c2e]/90">
          <Link href="/ops/growers/import">
            <Upload className="h-4 w-4 mr-2" />
            Import Growers
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Sprout} label="Total Growers" value={stats?.totalGrowers ?? '-'} color="#1a3c2e" />
        <StatCard icon={Search} label="Discovered" value={stats?.discovered ?? '-'} color="#94a3b8" />
        <StatCard icon={ShieldCheck} label="Verified" value={stats?.verified ?? '-'} color="#34d399" />
        <StatCard icon={Activity} label="Active" value={stats?.active ?? '-'} color="#1a3c2e" />
        <StatCard icon={Package} label="Coffee Lots" value={stats?.totalLots ?? '-'} color="#c9a84c" />
      </div>

      {/* Pipeline Funnel */}
      {funnel.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-gray-700">Pipeline Funnel</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <PipelineFunnel stages={funnel} />
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search growers..."
            className="pl-9 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <GrowerFilters
          filters={filters}
          onChange={(f) => setFilters((prev) => ({ ...prev, ...f, page: 1 }))}
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : growers.length === 0 ? (
          <div className="p-12 text-center">
            <Sprout className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No growers found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">State</TableHead>
                  <TableHead className="text-xs font-semibold">Species</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Verification</TableHead>
                  <TableHead className="text-xs font-semibold">Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {growers.map((g) => (
                  <TableRow
                    key={g.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/ops/growers/${g.id}`)}
                  >
                    <TableCell className="font-medium text-sm text-gray-900 max-w-[200px] truncate">
                      {g.displayName}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {GROWER_TYPE_LABELS[g.growerType]}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">{g.state ?? '—'}</TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {g.primarySpecies ? COFFEE_SPECIES_LABELS[g.primarySpecies] : '—'}
                    </TableCell>
                    <TableCell>
                      <GrowerStatusBadge status={g.relationshipStatus} size="sm" />
                    </TableCell>
                    <TableCell>
                      <VerificationBadge status={g.verificationStatus} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {g.updatedAt
                        ? new Date(g.updatedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {pagination.totalItems} grower{pagination.totalItems !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={pagination.page >= totalPages}
                    onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))
        ) : growers.length === 0 ? (
          <div className="p-12 text-center">
            <Sprout className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No growers found</p>
          </div>
        ) : (
          growers.map((g) => (
            <MobileGrowerCard key={g.id} grower={g} onClick={() => router.push(`/ops/growers/${g.id}`)} />
          ))
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">{pagination.totalItems} growers</p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={pagination.page <= 1}
                onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={pagination.page >= totalPages}
                onClick={() => setFilters((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
