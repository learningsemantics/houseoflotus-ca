'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  GrowerStatusBadge,
  VerificationBadge,
  AiAssistedTag,
  ReadinessScore,
} from '@/components/growers';
import {
  GROWER_TYPE_LABELS,
  COFFEE_SPECIES_LABELS,
  PROCESSING_METHOD_LABELS,
  GROWER_VISIBILITY_LABELS,
  BOARD_REGISTRATION_LABELS,
  DATA_SOURCE_TYPE_LABELS,
  CERTIFICATION_TYPE_LABELS,
  CLAIM_STATUS_LABELS,
  LOT_STATUS_LABELS,
  OUTREACH_TYPE_LABELS,
  OUTREACH_STATUS_LABELS,
} from '@/lib/grower/constants';
import type { GrowerDetailResponse } from '@/lib/grower/types';
import type { Grower as PrismaGrower } from '@prisma/client';
import { ArrowLeft, Plus, FileText } from 'lucide-react';

// ── Types ─────────────────────────────────────────────

type GrowerData = PrismaGrower & {
  _readiness?: GrowerReadiness;
  _estateCount?: number;
  _lotCount?: number;
  _outstandingOutreach?: number;
};

interface Estate {
  id: string;
  name: string;
  state: string | null;
  district: string | null;
  altitudeMinMeters: number | null;
  altitudeMaxMeters: number | null;
  acreageHectares: number | null;
  isActive: boolean;
}

interface CoffeeLot {
  id: string;
  lotCode: string | null;
  cropYear: number | null;
  species: string | null;
  process: string | null;
  grade: string | null;
  quantityKg: number | null;
  status: string;
  createdAt: string;
}

interface Note {
  id: string;
  content: string;
  category: string | null;
  isPinned: boolean;
  createdAt: string;
  createdBy: { firstName: string; lastName: string } | null;
}

interface ProvenanceRecord {
  id: string;
  fieldName: string;
  fieldValue: string;
  sourceType: string;
  sourceName: string | null;
  isVerified: boolean;
  isAiAssisted: boolean;
  createdAt: string;
}

interface Certification {
  id: string;
  certificationType: string;
  certifyingBody: string | null;
  certificateNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: string;
  isAiAssisted: boolean;
}

interface OutreachRecord {
  id: string;
  outreachType: string;
  status: string;
  subject: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  response: string | null;
}

// ── Page ───────────────────────────────────────────────

export default function GrowerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const growerId = params.id;

  const [grower, setGrower] = useState<GrowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Tab data
  const [estates, setEstates] = useState<Estate[]>([]);
  const [lots, setLots] = useState<CoffeeLot[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [provenance, setProvenance] = useState<ProvenanceRecord[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [outreach, setOutreach] = useState<OutreachRecord[]>([]);

  useEffect(() => {
    if (!growerId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/ops/growers/${growerId}`);
        const data: GrowerDetailResponse | null = res.ok ? await res.json() : null;
        if (cancelled) return;
        if (data) setGrower(data);
        else router.push('/ops/growers');
      } catch {
        if (!cancelled) router.push('/ops/growers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [growerId, router]);

  async function loadTabData(tab: string) {
    if (!growerId) return;
    const endpoints: Record<string, string> = {
      estates: `/api/ops/growers/${growerId}/estates`,
      lots: `/api/ops/growers/${growerId}/lots`,
      notes: `/api/ops/growers/${growerId}/notes`,
      provenance: `/api/ops/growers/${growerId}/provenance`,
      certifications: `/api/ops/growers/${growerId}/certifications`,
      outreach: `/api/ops/growers/${growerId}/outreach`,
    };
    const url = endpoints[tab];
    if (!url) return;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.data ?? [];
        switch (tab) {
          case 'estates': setEstates(arr); break;
          case 'lots': setLots(arr); break;
          case 'notes': setNotes(arr); break;
          case 'provenance': setProvenance(arr); break;
          case 'certifications': setCertifications(arr); break;
          case 'outreach': setOutreach(arr); break;
        }
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadTabData(activeTab);
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, growerId]);

  // Add note handler
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('GENERAL');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  async function handleAddNote() {
    if (!noteContent.trim() || !growerId) return;
    try {
      const res = await fetch(`/api/ops/growers/${growerId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent.trim(), category: noteCategory }),
      });
      if (res.ok) {
        setNoteContent('');
        setNoteDialogOpen(false);
        loadTabData('notes');
      }
    } catch { /* ignore */ }
  }

  // ── Loading state ─────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!grower) return null;

  const aiFields: string[] = grower.aiAssistedFields ? JSON.parse(grower.aiAssistedFields) : [];
  const processingMethods: string[] = grower.processingMethods ? JSON.parse(grower.processingMethods) : [];
  const allSpecies: string[] = grower.allSpecies ? JSON.parse(grower.allSpecies) : [];
  const varietals: string[] = grower.varietals ? JSON.parse(grower.varietals) : [];
  const harvestMonths: string[] = grower.harvestMonths ? JSON.parse(grower.harvestMonths) : [];
  const existingExportMarkets: string[] = grower.existingExportMarkets ? JSON.parse(grower.existingExportMarkets) : [];
  const opsFlags: string[] = grower.opsFlags ? JSON.parse(grower.opsFlags) : [];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/ops/growers')} className="text-gray-500 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Growers
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Sidebar Info */}
        <div className="lg:w-72 space-y-4 shrink-0">
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold text-gray-900">{grower.displayName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{GROWER_TYPE_LABELS[grower.growerType]}{grower.state ? ` · ${grower.state}` : ''}</p>
              <div className="flex items-center gap-2 mt-3">
                <GrowerStatusBadge status={grower.relationshipStatus} />
              </div>
              <div className="mt-2">
                <VerificationBadge status={grower.verificationStatus} />
              </div>
              {grower._readiness && <ReadinessScore readiness={grower._readiness} />}
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Visibility</span><span className="font-medium text-gray-700">{GROWER_VISIBILITY_LABELS[grower.visibility]}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Board Reg.</span><span className="font-medium text-gray-700">{BOARD_REGISTRATION_LABELS[grower.coffeeBoardRegistration]}</span></div>
              {grower._estateCount !== undefined && (
                <div className="flex justify-between"><span className="text-gray-500">Estates</span><span className="font-medium text-gray-700">{grower._estateCount}</span></div>
              )}
              {grower._lotCount !== undefined && (
                <div className="flex justify-between"><span className="text-gray-500">Coffee Lots</span><span className="font-medium text-gray-700">{grower._lotCount}</span></div>
              )}
              {grower.relationshipOwner && (
                <div className="flex justify-between"><span className="text-gray-500">Owner</span><span className="font-medium text-gray-700">{grower.relationshipOwner.firstName} {grower.relationshipOwner.lastName}</span></div>
              )}
              {grower.lastContactDate && (
                <div className="flex justify-between"><span className="text-gray-500">Last Contact</span><span className="font-medium text-gray-700">{new Date(grower.lastContactDate).toLocaleDateString()}</span></div>
              )}
              {grower.establishedYear && (
                <div className="flex justify-between"><span className="text-gray-500">Est.</span><span className="font-medium text-gray-700">{grower.establishedYear}</span></div>
              )}
            </CardContent>
          </Card>

          {opsFlags.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold mb-2">Ops Flags</p>
                <div className="flex flex-wrap gap-1">
                  {opsFlags.map((f) => (
                    <Badge key={f} variant="outline" className="text-[10px] border-amber-300 text-amber-700">{f}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Tabs */}
        <div className="flex-1 min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full flex overflow-x-auto bg-gray-100 h-9 p-0.5">
              {['overview', 'estates', 'lots', 'provenance', 'evidence', 'certifications', 'outreach', 'notes', 'audit'].map((t) => (
                <TabsTrigger key={t} value={t} className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm capitalize">
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Overview Tab ──────────────────────────── */}
            <TabsContent value="overview" className="mt-4 space-y-4">
              <OverviewSection title="Identity" fields={[
                { label: 'Display Name', value: grower.displayName, ai: aiFields.includes('displayName') },
                { label: 'Legal Name', value: grower.legalName, ai: aiFields.includes('legalName') },
                { label: 'Grower Type', value: GROWER_TYPE_LABELS[grower.growerType] },
                { label: 'Established Year', value: grower.establishedYear?.toString() },
                { label: 'Website', value: grower.website, isLink: true },
                { label: 'Board Registration', value: BOARD_REGISTRATION_LABELS[grower.coffeeBoardRegistration] },
                { label: 'Coffee Board ID', value: grower.coffeeBoardId, pii: true },
                { label: 'Registration #', value: grower.registrationNumber, pii: true },
              ]} />

              <OverviewSection title="Contact" fields={[
                { label: 'Contact Name', value: grower.contactName, pii: true },
                { label: 'Email', value: grower.contactEmail, pii: true },
                { label: 'Phone', value: grower.contactPhone, pii: true },
                { label: 'Preferred Method', value: grower.contactMethod, pii: true },
                { label: 'Languages', value: grower.languages ? JSON.parse(grower.languages).join(', ') : null, pii: true },
              ]} />

              <OverviewSection title="Location" fields={[
                { label: 'Country', value: grower.country, ai: aiFields.includes('country') },
                { label: 'State', value: grower.state, ai: aiFields.includes('state') },
                { label: 'District', value: grower.district, ai: aiFields.includes('district') },
                { label: 'Taluk', value: grower.taluk },
                { label: 'Village', value: grower.village },
                { label: 'Address', value: grower.address, pii: true },
                { label: 'Postal Code', value: grower.postalCode, pii: true },
                { label: 'Coordinates', value: (grower.latitude && grower.longitude) ? `${grower.latitude}, ${grower.longitude}` : null },
              ]} />

              <OverviewSection title="Production" fields={[
                { label: 'Total Acreage', value: grower.totalAcreage ? `${grower.totalAcreage} ha` : null, ai: aiFields.includes('totalAcreage') },
                { label: 'Coffee Acreage', value: grower.coffeeAcreage ? `${grower.coffeeAcreage} ha` : null },
                { label: 'Annual Production', value: grower.annualProductionKg ? `${Number(grower.annualProductionKg).toLocaleString()} kg` : null, ai: aiFields.includes('annualProductionKg') },
                { label: 'Annual Export Volume', value: grower.annualExportVolumeKg ? `${Number(grower.annualExportVolumeKg).toLocaleString()} kg` : null },
              ]} />

              <OverviewSection title="Coffee" fields={[
                { label: 'Primary Species', value: grower.primarySpecies ? COFFEE_SPECIES_LABELS[grower.primarySpecies] : null },
                { label: 'All Species', value: allSpecies.length ? allSpecies.join(', ') : null },
                { label: 'Varietals', value: varietals.length ? varietals.join(', ') : null },
                { label: 'Processing Methods', value: processingMethods.length ? processingMethods.map(p => PROCESSING_METHOD_LABELS[p as keyof typeof PROCESSING_METHOD_LABELS] ?? p).join(', ') : null },
                { label: 'Harvest Months', value: harvestMonths.length ? harvestMonths.join(', ') : null },
                { label: 'Altitude Range', value: grower.altitudeMinMeters || grower.altitudeMaxMeters ? `${grower.altitudeMinMeters ?? '?'}–${grower.altitudeMaxMeters ?? '?'}m` : null },
              ]} />

              <OverviewSection title="Quality" fields={[
                { label: 'Typical Cup Score', value: grower.typicalCupScore?.toString() },
                { label: 'Cupping Experience', value: grower.cuppingExperience },
                { label: 'Laboratory Testing', value: grower.laboratoryTesting ? 'Yes' : 'No' },
                { label: 'Sample Available', value: grower.sampleAvailability ? 'Yes' : 'No' },
                { label: 'Traceability', value: grower.traceabilityCapability ? 'Yes' : 'No' },
              ]} />

              <OverviewSection title="Commercial" fields={[
                { label: 'Typical Lot Size', value: grower.typicalLotSizeKg ? `${grower.typicalLotSizeKg} kg` : null },
                { label: 'Min Lot Size', value: grower.minLotSizeKg ? `${grower.minLotSizeKg} kg` : null },
                { label: 'Export Experience', value: grower.exportExperience ? 'Yes' : 'No' },
                { label: 'Export Markets', value: existingExportMarkets.length ? existingExportMarkets.join(', ') : null },
                { label: 'Price Expectation', value: grower.priceExpectationUsdKg ? `$${grower.priceExpectationUsdKg}/kg` : null },
                { label: 'Preferred Model', value: grower.preferredCommercialModel },
                { label: 'Packaging', value: grower.packagingCapability },
              ]} />

              <OverviewSection title="Infrastructure" fields={[
                { label: 'Warehouse', value: grower.warehouseCapability ? 'Yes' : 'No' },
                { label: 'Processing', value: grower.processingCapability ? 'Yes' : 'No' },
                { label: 'Drying', value: grower.dryingCapability ? 'Yes' : 'No' },
              ]} />

              {grower.growerStory && (
                <Card className="border-gray-200">
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm font-semibold text-gray-700">Grower Story</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4"><p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{grower.growerStory}</p></CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Estates Tab ───────────────────────────── */}
            <TabsContent value="estates" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Estates</h3>
                <CreateEstateDialog growerId={growerId} onCreated={() => loadTabData('estates')} />
              </div>
              {estates.length === 0 ? (
                <EmptyState message="No estates recorded" />
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="text-xs font-semibold">Name</TableHead>
                        <TableHead className="text-xs font-semibold">State</TableHead>
                        <TableHead className="text-xs font-semibold">District</TableHead>
                        <TableHead className="text-xs font-semibold">Altitude</TableHead>
                        <TableHead className="text-xs font-semibold">Acreage</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estates.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-sm font-medium">{e.name}</TableCell>
                          <TableCell className="text-xs text-gray-600">{e.state ?? '—'}</TableCell>
                          <TableCell className="text-xs text-gray-600">{e.district ?? '—'}</TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {e.altitudeMinMeters || e.altitudeMaxMeters ? `${e.altitudeMinMeters ?? '?'}–${e.altitudeMaxMeters ?? '?'}m` : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">{e.acreageHectares ? `${e.acreageHectares} ha` : '—'}</TableCell>
                          <TableCell>
                            <Badge variant={e.isActive ? 'default' : 'secondary'} className="text-[10px]">{e.isActive ? 'Active' : 'Inactive'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ── Coffee Lots Tab ──────────────────────── */}
            <TabsContent value="lots" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Coffee Lots</h3>
                <CreateLotDialog growerId={growerId} onCreated={() => loadTabData('lots')} />
              </div>
              {lots.length === 0 ? (
                <EmptyState message="No coffee lots recorded" />
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="text-xs font-semibold">Lot Code</TableHead>
                        <TableHead className="text-xs font-semibold">Species</TableHead>
                        <TableHead className="text-xs font-semibold">Process</TableHead>
                        <TableHead className="text-xs font-semibold">Grade</TableHead>
                        <TableHead className="text-xs font-semibold">Qty (kg)</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lots.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="text-sm font-medium">{l.lotCode ?? '—'}</TableCell>
                          <TableCell className="text-xs text-gray-600">{l.species ? COFFEE_SPECIES_LABELS[l.species as keyof typeof COFFEE_SPECIES_LABELS] ?? l.species : '—'}</TableCell>
                          <TableCell className="text-xs text-gray-600">{l.process ? PROCESSING_METHOD_LABELS[l.process as keyof typeof PROCESSING_METHOD_LABELS] ?? l.process : '—'}</TableCell>
                          <TableCell className="text-xs text-gray-600">{l.grade ?? '—'}</TableCell>
                          <TableCell className="text-xs text-gray-600">{l.quantityKg ? Number(l.quantityKg).toLocaleString() : '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {LOT_STATUS_LABELS[l.status as keyof typeof LOT_STATUS_LABELS] ?? l.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ── Provenance Tab ───────────────────────── */}
            <TabsContent value="provenance" className="mt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Provenance Timeline</h3>
              {provenance.length === 0 ? (
                <EmptyState message="No provenance records" />
              ) : (
                <div className="relative space-y-0">
                  {provenance.map((p, i) => (
                    <div key={p.id} className="flex gap-3 pb-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.isVerified ? 'bg-[#1a3c2e]' : 'bg-gray-300'}`} />
                        {i < provenance.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700">{p.fieldName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{p.fieldValue}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">{DATA_SOURCE_TYPE_LABELS[p.sourceType as keyof typeof DATA_SOURCE_TYPE_LABELS] ?? p.sourceType}</span>
                          {p.sourceName && <span className="text-[10px] text-gray-400">· {p.sourceName}</span>}
                          {p.isAiAssisted && <AiAssistedTag />}
                          {p.isVerified && <span className="text-[10px] text-emerald-600 font-medium">Verified</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(p.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Evidence Tab ─────────────────────────── */}
            <TabsContent value="evidence" className="mt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Evidence Records</h3>
              <EmptyState message="Evidence management coming soon" />
            </TabsContent>

            {/* ── Certifications Tab ───────────────────── */}
            <TabsContent value="certifications" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Certifications</h3>
                <AddCertDialog growerId={growerId} onAdded={() => loadTabData('certifications')} />
              </div>
              {certifications.length === 0 ? (
                <EmptyState message="No certifications recorded" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {certifications.map((c) => (
                    <Card key={c.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{CERTIFICATION_TYPE_LABELS[c.certificationType as keyof typeof CERTIFICATION_TYPE_LABELS] ?? c.certificationType}</p>
                            {c.certifyingBody && <p className="text-xs text-gray-500 mt-0.5">{c.certifyingBody}</p>}
                            {c.certificateNumber && <p className="text-xs text-gray-400">#{c.certificateNumber}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-[10px]">
                              {CLAIM_STATUS_LABELS[c.status as keyof typeof CLAIM_STATUS_LABELS] ?? c.status}
                            </Badge>
                            {c.isAiAssisted && <AiAssistedTag />}
                          </div>
                        </div>
                        <div className="flex gap-4 mt-2 text-[11px] text-gray-400">
                          {c.issueDate && <span>Issued: {new Date(c.issueDate).toLocaleDateString()}</span>}
                          {c.expiryDate && <span>Expires: {new Date(c.expiryDate).toLocaleDateString()}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Outreach Tab ─────────────────────────── */}
            <TabsContent value="outreach" className="mt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Outreach History</h3>
              {outreach.length === 0 ? (
                <EmptyState message="No outreach recorded" />
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="text-xs font-semibold">Type</TableHead>
                        <TableHead className="text-xs font-semibold">Status</TableHead>
                        <TableHead className="text-xs font-semibold">Subject</TableHead>
                        <TableHead className="text-xs font-semibold">Scheduled</TableHead>
                        <TableHead className="text-xs font-semibold">Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outreach.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="text-xs text-gray-600">{OUTREACH_TYPE_LABELS[o.outreachType as keyof typeof OUTREACH_TYPE_LABELS] ?? o.outreachType}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{OUTREACH_STATUS_LABELS[o.status as keyof typeof OUTREACH_STATUS_LABELS] ?? o.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 max-w-[200px] truncate">{o.subject ?? '—'}</TableCell>
                          <TableCell className="text-xs text-gray-400">{o.scheduledDate ? new Date(o.scheduledDate).toLocaleDateString() : '—'}</TableCell>
                          <TableCell className="text-xs text-gray-400">{o.completedDate ? new Date(o.completedDate).toLocaleDateString() : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ── Notes Tab ────────────────────────────── */}
            <TabsContent value="notes" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Notes</h3>
                <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs bg-[#1a3c2e] hover:bg-[#1a3c2e]/90">
                      <Plus className="h-3 w-3 mr-1" /> Add Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-sm">Add Note</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Category</Label>
                        <select
                          className="w-full mt-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                          value={noteCategory}
                          onChange={(e) => setNoteCategory(e.target.value)}
                        >
                          <option value="GENERAL">General</option>
                          <option value="VERIFICATION">Verification</option>
                          <option value="QUALITY">Quality</option>
                          <option value="COMPLIANCE">Compliance</option>
                          <option value="RELATIONSHIP">Relationship</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Content</Label>
                        <Textarea
                          className="mt-1 text-sm"
                          rows={4}
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Write a note..."
                        />
                      </div>
                      <Button size="sm" onClick={handleAddNote} className="bg-[#1a3c2e] hover:bg-[#1a3c2e]/90" disabled={!noteContent.trim()}>
                        Save Note
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {notes.length === 0 ? (
                <EmptyState message="No notes yet" />
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notes.map((n) => (
                    <Card key={n.id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.content}</p>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {n.isPinned && <Badge variant="secondary" className="text-[10px]">Pinned</Badge>}
                            {n.category && <Badge variant="outline" className="text-[10px]">{n.category}</Badge>}
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {n.createdBy ? `${n.createdBy.firstName} ${n.createdBy.lastName}` : 'Unknown'} · {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── Audit Tab ────────────────────────────── */}
            <TabsContent value="audit" className="mt-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Audit Trail</h3>
              <EmptyState message="Audit trail coming soon" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ── Shared Components ──────────────────────────────────

function OverviewSection({ title, fields }: { title: string; fields: { label: string; value: string | null | undefined; ai?: boolean; pii?: boolean; isLink?: boolean }[] }) {
  const filtered = fields.filter((f) => f.value);
  if (filtered.length === 0) return null;

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-gray-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
          {filtered.map((f) => (
            <div key={f.label} className="flex items-baseline gap-2 py-1">
              <span className="text-xs text-gray-500 shrink-0">{f.label}</span>
              {f.isLink && f.value ? (
                <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1a3c2e] underline truncate">{f.value}</a>
              ) : (
                <span className={`text-xs font-medium truncate ${f.pii ? 'text-gray-600' : 'text-gray-900'}`}>{f.value}</span>
              )}
              {f.ai && <AiAssistedTag />}
              {f.pii && <span className="text-[9px] text-amber-500 font-medium uppercase tracking-wider">PII</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <FileText className="h-8 w-8 mx-auto text-gray-300 mb-2" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ── Dialog Components ──────────────────────────────────

function CreateEstateDialog({ growerId, onCreated }: { growerId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ops/growers/${growerId}/estates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        setName('');
        setOpen(false);
        onCreated();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs bg-[#1a3c2e] hover:bg-[#1a3c2e]/90">
          <Plus className="h-3 w-3 mr-1" /> Add Estate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-sm">Add Estate</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Estate Name</Label>
            <Input className="mt-1 h-9 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chikmagalur Main Estate" />
          </div>
          <Button size="sm" onClick={handleSave} disabled={!name.trim() || saving} className="bg-[#1a3c2e] hover:bg-[#1a3c2e]/90">
            {saving ? 'Saving...' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateLotDialog({ growerId, onCreated }: { growerId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [lotCode, setLotCode] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!lotCode.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ops/growers/${growerId}/lots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotCode: lotCode.trim() }),
      });
      if (res.ok) {
        setLotCode('');
        setOpen(false);
        onCreated();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs bg-[#1a3c2e] hover:bg-[#1a3c2e]/90">
          <Plus className="h-3 w-3 mr-1" /> Add Lot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-sm">Add Coffee Lot</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Lot Code</Label>
            <Input className="mt-1 h-9 text-sm" value={lotCode} onChange={(e) => setLotCode(e.target.value)} placeholder="e.g. HL-2024-CRG-001" />
          </div>
          <Button size="sm" onClick={handleSave} disabled={!lotCode.trim() || saving} className="bg-[#1a3c2e] hover:bg-[#1a3c2e]/90">
            {saving ? 'Saving...' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddCertDialog({ growerId, onAdded }: { growerId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [certType, setCertType] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!certType) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ops/growers/${growerId}/certifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificationType: certType }),
      });
      if (res.ok) {
        setCertType('');
        setOpen(false);
        onAdded();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 text-xs bg-[#1a3c2e] hover:bg-[#1a3c2e]/90">
          <Plus className="h-3 w-3 mr-1" /> Add Cert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="text-sm">Add Certification</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Certification Type</Label>
            <select
              className="w-full mt-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={certType}
              onChange={(e) => setCertType(e.target.value)}
            >
              <option value="">Select type...</option>
              {Object.entries(CERTIFICATION_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={handleSave} disabled={!certType || saving} className="bg-[#1a3c2e] hover:bg-[#1a3c2e]/90">
            {saving ? 'Saving...' : 'Add'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
