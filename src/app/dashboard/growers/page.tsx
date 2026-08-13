'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal, X, Sprout } from 'lucide-react';
import {
  INDIAN_COFFEE_STATES,
  COFFEE_SPECIES_LABELS,
  PROCESSING_METHOD_LABELS,
  VERIFICATION_LABELS,
  CERTIFICATION_TYPE_LABELS,
} from '@/lib/grower/constants';
import type { SanitizedGrower } from '@/lib/grower/types';

interface DiscoveryResponse {
  growers: SanitizedGrower[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

interface LocalFilters {
  search: string;
  state: string;
  species: string;
  processing: string;
  verification: string;
}

function buildQueryParams(filters: LocalFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.state) params.set('state', filters.state);
  if (filters.species) params.set('species', filters.species);
  if (filters.processing) params.set('processingMethod', filters.processing);
  if (filters.verification) params.set('verificationStatus', filters.verification);
  params.set('page', String(page));
  params.set('pageSize', '12');
  return params.toString();
}

function hasActiveFilters(filters: LocalFilters): boolean {
  return !!(filters.state || filters.species || filters.processing || filters.verification);
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function GrowerNetworkPage() {
  const [growers, setGrowers] = useState<SanitizedGrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LocalFilters>({
    search: '',
    state: '',
    species: '',
    processing: '',
    verification: '',
  });

  // Debounce search input (page reset inside async callback is safe)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch growers based on current filters and page
  const fetchGrowers = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const currentFilters = { ...filters, search: debouncedSearch };
      const qs = buildQueryParams(currentFilters, targetPage);
      const res = await fetch(`/api/growers/discovery?${qs}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load growers');
      }
      const data: DiscoveryResponse = await res.json();
      setGrowers(data.growers);
      setTotalPages(data.pagination.totalPages);
      setTotalItems(data.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  // Trigger fetch when filters, search, or page change
  useEffect(() => {
    const timer = setTimeout(() => void fetchGrowers(page), 0);
    return () => clearTimeout(timer);
  }, [filters, debouncedSearch, page, fetchGrowers]);

  const clearFilters = () => {
    setFilters({ search: '', state: '', species: '', processing: '', verification: '' });
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  const updateFilter = (key: keyof LocalFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#1a3c2e]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#c9a84c] rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative px-6 py-10 lg:py-14 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Sprout className="h-5 w-5 text-[#c9a84c]" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-[#c9a84c] font-medium">
              Grower Network
            </span>
          </div>
          <h1 className="font-[\'Georgia\',serif] text-2xl sm:text-3xl text-white leading-tight mb-2">
            Discover Indian Coffee GROWERS
          </h1>
          <p className="text-sm text-[#f2eee5]/70 max-w-2xl leading-relaxed">
            Explore verified coffee growers from India&rsquo;s premier growing regions. Browse profiles,
            review available lots, and connect with growers who match your sourcing needs.
          </p>
        </div>
      </section>

      {/* Search & Filters Bar */}
      <div className="px-6 lg:px-8 -mt-5">
        <Card className="bg-white/80 backdrop-blur-sm border-[rgba(21,21,19,.12)] shadow-sm">
          <CardContent className="p-4">
            {/* Search row */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b5ad9e]" />
                <Input
                  placeholder="Search growers by name, state, or species..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-10 border-[rgba(21,21,19,.17)] bg-[#f5f0e8]/50 text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'h-10 border-[rgba(21,21,19,.17)] text-xs uppercase tracking-[0.08em]',
                  showFilters && 'bg-[#c9a84c]/10 border-[#c9a84c]/30 text-[#c99743]'
                )}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                Filters
                {hasActiveFilters(filters) && (
                  <span className="ml-1.5 bg-[#c9a84c] text-white text-[10px] rounded-full w-4 h-4 inline-flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-[rgba(21,21,19,.08)]">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={filters.state} onValueChange={(v) => updateFilter('state', v)}>
                    <SelectTrigger className="w-[150px] h-8 text-xs">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_COFFEE_STATES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.species} onValueChange={(v) => updateFilter('species', v)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Species" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(COFFEE_SPECIES_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.processing} onValueChange={(v) => updateFilter('processing', v)}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue placeholder="Processing" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROCESSING_METHOD_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.verification} onValueChange={(v) => updateFilter('verification', v)}>
                    <SelectTrigger className="w-[170px] h-8 text-xs">
                      <SelectValue placeholder="Verification" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(VERIFICATION_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs">
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {hasActiveFilters(filters) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs text-[#756e62] hover:text-[#151513]"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Area */}
      <div className="px-6 lg:px-8 py-6">
        {/* Results count */}
        {!loading && !error && (
          <p className="text-xs text-[#756e62] mb-4">
            {totalItems} grower{totalItems !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-[rgba(21,21,19,.08)]">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && growers.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f5f0e8] mb-4">
              <Sprout className="h-8 w-8 text-[#b5ad9e]" />
            </div>
            <h3 className="font-[\'Georgia\',serif] text-base text-[#151513] mb-1">
              No growers found
            </h3>
            <p className="text-sm text-[#756e62] mb-4">
              Try adjusting your search or filters to discover more growers.
            </p>
            {hasActiveFilters({ ...filters, search: debouncedSearch }) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs uppercase tracking-[0.08em] border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/5"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}

        {/* Grower Grid */}
        {!loading && !error && growers.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {growers.map((grower) => (
                <GrowerCardRoaster key={grower.id} grower={grower} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-xs uppercase tracking-[0.08em] border-[rgba(21,21,19,.17)]"
                >
                  Previous
                </Button>
                <span className="text-xs text-[#756e62]">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs uppercase tracking-[0.08em] border-[rgba(21,21,19,.17)]"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Roaster-facing grower card linking to /dashboard/growers/[id].
 */
function GrowerCardRoaster({ grower }: { grower: SanitizedGrower }) {
  const species = grower.primarySpecies
    ? COFFEE_SPECIES_LABELS[grower.primarySpecies]
    : null;

  const processing = grower.processingMethods?.length
    ? grower.processingMethods
        .slice(0, 2)
        .map((p) => PROCESSING_METHOD_LABELS[p as keyof typeof PROCESSING_METHOD_LABELS] ?? p)
        .join(', ')
    : null;

  const cupScore = grower.typicalCupScore
    ? `${grower.typicalCupScore.toFixed(1)}`
    : null;

  return (
    <Link href={`/dashboard/growers/${grower.id}`} className="block group">
      <Card className="bg-white/70 backdrop-blur-sm border-[rgba(21,21,19,.08)] transition-all hover:shadow-md hover:border-[#c9a84c]/30">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-[#151513] truncate group-hover:text-[#1a3c2e] transition-colors">
                {grower.displayName}
              </h3>
              <p className="text-xs text-[#756e62] mt-0.5">
                {grower.state ?? 'India'}
                {species ? ` · ${species}` : ''}
              </p>
            </div>
            <VerificationBadgeRoaster status={grower.verificationStatus} />
          </div>

          {cupScore && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-[#b5ad9e]">Cup Score</span>
              <span className="text-sm font-semibold text-[#1a3c2e]">{cupScore}</span>
            </div>
          )}

          {processing && (
            <p className="text-xs text-[#b5ad9e] mt-1.5">{processing}</p>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(21,21,19,.06)]">
            {grower.lotCount > 0 ? (
              <span className="text-[10px] text-[#756e62]">
                {grower.lotCount} lot{grower.lotCount !== 1 ? 's' : ''} available
              </span>
            ) : (
              <span />
            )}
            {grower.certifications.length > 0 && (
              <div className="flex items-center gap-1">
                {grower.certifications.slice(0, 2).map((cert) => (
                  <span
                    key={cert.certificationType}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a3c2e]/5 text-[#1a3c2e] border border-[#1a3c2e]/10"
                  >
                    {CERTIFICATION_TYPE_LABELS[cert.certificationType as keyof typeof CERTIFICATION_TYPE_LABELS] ?? cert.certificationType.replace(/_/g, ' ')}
                  </span>
                ))}
                {grower.certifications.length > 2 && (
                  <span className="text-[9px] text-[#b5ad9e]">
                    +{grower.certifications.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * Lightweight verification badge for roaster-facing cards.
 */
function VerificationBadgeRoaster({ status }: { status: string }) {
  let classes = 'bg-slate-50 text-slate-500 border-slate-200';
  let label = 'Unverified';

  switch (status) {
    case 'VERIFIED':
      classes = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Verified';
      break;
    case 'PARTIALLY_VERIFIED':
      classes = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Partially Verified';
      break;
    case 'SUSPENDED':
      classes = 'bg-red-50 text-red-700 border-red-200';
      label = 'Suspended';
      break;
    case 'VERIFICATION_EXPIRED':
      classes = 'bg-orange-50 text-orange-600 border-orange-200';
      label = 'Expired';
      break;
  }

  return (
    <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border font-medium ${classes}`}>
      {label}
    </span>
  );
}
