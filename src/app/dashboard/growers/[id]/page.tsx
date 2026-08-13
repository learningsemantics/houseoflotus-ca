'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  MapPin,
  Coffee,
  Mountain,
  Award,
  Package,
  MessageSquare,
  Sprout,
  TreePine,
} from 'lucide-react';
import {
  COFFEE_SPECIES_LABELS,
  PROCESSING_METHOD_LABELS,
  CERTIFICATION_TYPE_LABELS,
  PRICE_BASIS_LABELS,
  CLAIM_STATUS_LABELS,
} from '@/lib/grower/constants';
import type { SanitizedGrower, CoffeeLotPublic } from '@/lib/grower/types';

interface Estate {
  id: string;
  name: string;
  state: string | null;
  altitudeMinMeters: number | null;
  altitudeMaxMeters: number | null;
}

interface GrowerProfileResponse {
  grower: SanitizedGrower;
  estates: Estate[];
  coffeeLots: CoffeeLotPublic[];
}

export default function GrowerProfilePage() {
  const params = useParams();
  const growerId = params.id as string;

  const [data, setData] = useState<GrowerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false);

  const fetchGrower = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/growers/discovery/${growerId}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Grower not found');
      }
      const json: GrowerProfileResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [growerId]);

  useEffect(() => {
    const timer = setTimeout(() => void fetchGrower(), 0);
    return () => clearTimeout(timer);
  }, [fetchGrower]);

  // Loading
  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  // Error
  if (error || !data) {
    return (
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
        <Link
          href="/dashboard/growers"
          className="inline-flex items-center gap-1.5 text-xs text-[#756e62] hover:text-[#151513] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Grower Network
        </Link>
        <div className="text-center py-16">
          <Sprout className="h-10 w-10 text-[#b5ad9e] mx-auto mb-3" />
          <h2 className="font-['Georgia',serif] text-lg text-[#151513] mb-1">Grower Not Found</h2>
          <p className="text-sm text-[#756e62]">{error || 'This grower profile is not available.'}</p>
        </div>
      </div>
    );
  }

  const { grower, estates, coffeeLots } = data;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/growers"
        className="inline-flex items-center gap-1.5 text-xs text-[#756e62] hover:text-[#151513] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Grower Network
      </Link>

      {/* Header Card */}
      <Card className="bg-white/70 backdrop-blur-sm border-[rgba(21,21,19,.12)]">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-['Georgia',serif] text-xl sm:text-2xl text-[#151513]">
                  {grower.displayName}
                </h1>
                <VerificationBadgeInline status={grower.verificationStatus} />
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-[#756e62]">
                <MapPin className="h-3.5 w-3.5" />
                <span>{grower.state}{grower.district ? `, ${grower.district}` : ''}, India</span>
              </div>
            </div>
            <Button
              onClick={() => setSampleDialogOpen(true)}
              className="bg-[#c9a84c] text-[#14110d] hover:bg-[#b8882e] text-xs uppercase tracking-[0.08em] shrink-0"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Request Samples
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* About */}
        {grower.buyerVisibleDescription && (
          <Card className="md:col-span-2 bg-white/70 backdrop-blur-sm border-[rgba(21,21,19,.08)]">
            <CardContent className="p-5">
              <SectionHeader icon={Sprout} label="About" />
              <p className="text-sm text-[#524c43] leading-relaxed mt-2 whitespace-pre-line">
                {grower.buyerVisibleDescription}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Coffee Profile */}
        <Card className="bg-white/70 backdrop-blur-sm border-[rgba(21,21,19,.08)]">
          <CardContent className="p-5">
            <SectionHeader icon={Coffee} label="Coffee Profile" />
            <div className="mt-3 space-y-3">
              {grower.primarySpecies && (
                <ProfileRow label="Primary Species">
                  <span className="text-sm text-[#151513] font-medium">
                    {COFFEE_SPECIES_LABELS[grower.primarySpecies]}
                  </span>
                </ProfileRow>
              )}
              {grower.processingMethods && grower.processingMethods.length > 0 && (
                <ProfileRow label="Processing">
                  <div className="flex flex-wrap gap-1">
                    {grower.processingMethods.map((p) => (
                      <Badge
                        key={p}
                        variant="outline"
                        className="text-[10px] bg-[#f5f0e8] border-[rgba(21,21,19,.1)] text-[#151513]"
                      >
                        {PROCESSING_METHOD_LABELS[p as keyof typeof PROCESSING_METHOD_LABELS] ?? p}
                      </Badge>
                    ))}
                  </div>
                </ProfileRow>
              )}
              {grower.typicalCupScore && (
                <ProfileRow label="Typical Cup Score">
                  <span className="text-sm font-semibold text-[#1a3c2e]">
                    {grower.typicalCupScore.toFixed(1)}
                  </span>
                </ProfileRow>
              )}
              {(grower.altitudeMinMeters || grower.altitudeMaxMeters) && (
                <ProfileRow label="Altitude">
                  <div className="flex items-center gap-1.5">
                    <Mountain className="h-3.5 w-3.5 text-[#b5ad9e]" />
                    <span className="text-sm text-[#151513]">
                      {grower.altitudeMinMeters ?? '?'}–{grower.altitudeMaxMeters ?? '?'}m
                    </span>
                  </div>
                </ProfileRow>
              )}
              {grower.typicalLotSizeKg && (
                <ProfileRow label="Typical Lot Size">
                  <span className="text-sm text-[#151513]">
                    {grower.typicalLotSizeKg.toLocaleString()} kg
                  </span>
                </ProfileRow>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estates */}
      {estates.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-[rgba(21,21,19,.08)]">
          <CardContent className="p-5">
            <SectionHeader icon={TreePine} label="Estates" count={estates.length} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {estates.map((estate) => (
                <div
                  key={estate.id}
                  className="p-3 rounded-lg bg-[#f5f0e8]/60 border border-[rgba(21,21,19,.06)]"
                >
                  <p className="text-sm font-medium text-[#151513]">{estate.name}</p>
                  {estate.state && (
                    <p className="text-xs text-[#756e62] mt-0.5">{estate.state}</p>
                  )}
                  {(estate.altitudeMinMeters || estate.altitudeMaxMeters) && (
                    <p className="text-xs text-[#b5ad9e] mt-1">
                      {estate.altitudeMinMeters ?? '?'}–{estate.altitudeMaxMeters ?? '?'}m altitude
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {grower.certifications.length > 0 && (
        <Card className="bg-white/70 backdrop-blur-sm border-[rgba(21,21,19,.08)]">
          <CardContent className="p-5">
            <SectionHeader icon={Award} label="Certifications" count={grower.certifications.length} />
            <div className="flex flex-wrap gap-2 mt-3">
              {grower.certifications.map((cert) => (
                <div
                  key={cert.certificationType}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(21,21,19,.08)] bg-white/60"
                >
                  <Award className="h-3.5 w-3.5 text-[#c9a84c]" />
                  <span className="text-xs font-medium text-[#151513]">
                    {CERTIFICATION_TYPE_LABELS[cert.certificationType as keyof typeof CERTIFICATION_TYPE_LABELS] ?? cert.certificationType.replace(/_/g, ' ')}
                  </span>
                  {cert.status && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] ml-1',
                        cert.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : cert.status === 'DOCUMENTED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}
                    >
                      {CLAIM_STATUS_LABELS[cert.status as keyof typeof CLAIM_STATUS_LABELS] ?? cert.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Lots */}
      <Card className="bg-white/70 backdrop-blur-sm border-[rgba(21,21,19,.08)]">
        <CardContent className="p-5">
          <SectionHeader icon={Package} label="Available Lots" count={coffeeLots.length} />
          {coffeeLots.length === 0 ? (
            <p className="text-sm text-[#b5ad9e] italic mt-3">No lots currently available.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[rgba(21,21,19,.08)]">
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] text-[#756e62]">Lot Code</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] text-[#756e62]">Species</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] text-[#756e62] hidden sm:table-cell">Process</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] text-[#756e62] hidden md:table-cell">Grade</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] text-[#756e62] text-right">Qty (kg)</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] text-[#756e62] text-right hidden sm:table-cell">Cup Score</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-[0.1em] text-[#756e62] text-right hidden lg:table-cell">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coffeeLots.map((lot) => (
                    <TableRow key={lot.id} className="border-[rgba(21,21,19,.06)]">
                      <TableCell className="text-sm font-medium text-[#151513]">
                        {lot.lotCode || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-[#524c43]">
                        {lot.species ? COFFEE_SPECIES_LABELS[lot.species] : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-[#524c43] hidden sm:table-cell">
                        {lot.process ? (PROCESSING_METHOD_LABELS[lot.process] ?? lot.process) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-[#524c43] hidden md:table-cell">
                        {lot.grade || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-[#524c43] text-right">
                        {lot.quantityKg ? lot.quantityKg.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-right hidden sm:table-cell">
                        {lot.cupScore ? (
                          <span className="font-semibold text-[#1a3c2e]">{lot.cupScore.toFixed(1)}</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-right hidden lg:table-cell">
                        {lot.indicativePriceUsdKg ? (
                          <span className="text-[#524c43]">
                            ${lot.indicativePriceUsdKg.toFixed(2)}
                            {lot.priceBasis && (
                              <span className="text-[10px] text-[#b5ad9e] ml-1">
                                {PRICE_BASIS_LABELS[lot.priceBasis as keyof typeof PRICE_BASIS_LABELS] ?? ''}
                              </span>
                            )}
                          </span>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact CTA (bottom sticky) */}
      <Card className="bg-[#1a3c2e] border-0">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Interested in {grower.displayName}&rsquo;s coffee?
              </h3>
              <p className="text-xs text-[#f2eee5]/60 mt-0.5">
                {coffeeLots.length} lot{coffeeLots.length !== 1 ? 's' : ''} available · Samples available upon request
              </p>
            </div>
            <Button
              onClick={() => setSampleDialogOpen(true)}
              className="bg-[#c9a84c] text-[#14110d] hover:bg-[#b8882e] text-xs uppercase tracking-[0.08em] shrink-0 self-start sm:self-auto"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Request Samples
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Request Samples Dialog */}
      <Dialog open={sampleDialogOpen} onOpenChange={setSampleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Georgia',serif] text-lg text-[#151513]">
              Request Samples
            </DialogTitle>
            <DialogDescription className="text-sm text-[#756e62]">
              Send a sample request to <strong>{grower.displayName}</strong>. Our team will coordinate
              the sample shipment on your behalf.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {coffeeLots.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#756e62] mb-2">
                  Available Lots
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {coffeeLots.map((lot) => (
                    <div
                      key={lot.id}
                      className="flex items-center justify-between p-2.5 rounded bg-[#f5f0e8]/60 border border-[rgba(21,21,19,.06)]"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#151513]">{lot.lotCode || 'Unnamed Lot'}</p>
                        <p className="text-xs text-[#756e62]">
                          {lot.species ? COFFEE_SPECIES_LABELS[lot.species] : ''}
                          {lot.process ? ` · ${PROCESSING_METHOD_LABELS[lot.process]}` : ''}
                        </p>
                      </div>
                      {lot.sampleAvailable && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Sample
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-[#b5ad9e] italic">
              Sample requests will be available once the messaging feature launches.
              Contact your account manager for immediate requests.
            </p>
            <Button
              onClick={() => setSampleDialogOpen(false)}
              className="w-full bg-[#1a3c2e] text-white hover:bg-[#1a3c2e]/90 text-xs uppercase tracking-[0.08em]"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function SectionHeader({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#c9a84c]" />
      <h2 className="text-xs uppercase tracking-[0.12em] text-[#756e62] font-medium">
        {label}
      </h2>
      {count !== undefined && (
        <span className="text-[10px] text-[#b5ad9e]">({count})</span>
      )}
    </div>
  );
}

function ProfileRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.1em] text-[#b5ad9e] mb-0.5">{label}</p>
      {children}
    </div>
  );
}

function VerificationBadgeInline({ status }: { status: string }) {
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
    <span className={`inline-flex items-center text-[10px] px-2.5 py-1 rounded-full border font-medium ${classes}`}>
      {label}
    </span>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
