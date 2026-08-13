'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ImportPreview, ImportResult } from '@/lib/grower/types';
import { DATA_SOURCE_TYPE_LABELS } from '@/lib/grower/constants';

// ── Types ─────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'complete';

interface ImportBatch {
  id: string;
  sourceType: string;
  sourceName: string | null;
  fileName: string | null;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  errorRows: number;
  status: string;
  createdAt: string;
}

// ── Page ───────────────────────────────────────────────

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [rowDecisions, setRowDecisions] = useState<Record<number, 'create' | 'update' | 'skip'>>({});

  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Load import history on mount
  useEffect(() => {
    loadBatches();
  }, []);

  async function loadBatches() {
    setLoadingBatches(true);
    try {
      const res = await fetch('/api/ops/growers/import/batches?page=1&pageSize=10');
      if (res.ok) {
        const data = await res.json();
        setBatches(Array.isArray(data) ? data : data.data ?? []);
      }
    } catch { /* ignore */ }
    setLoadingBatches(false);
  }

  // ── File upload handler ─────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      setUploadError('Please upload a CSV or XLSX file');
      return;
    }
    setFile(f);
    setUploadError('');
  }

  // ── Preview step ─────────────────────────────────────

  const handlePreview = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ops/growers/import/preview', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setUploadError(err.error ?? 'Failed to parse file');
        return;
      }

      const data: ImportPreview = await res.json();
      setPreview(data);

      // Auto-decide: new → create, duplicate → skip, error → skip
      const decisions: Record<number, 'create' | 'update' | 'skip'> = {};
      data.rows.forEach((r) => {
        if (r.matchType === 'new') decisions[r.rowNumber] = 'create';
        else if (r.matchType === 'possible_match') decisions[r.rowNumber] = 'create';
        else if (r.matchType === 'duplicate') decisions[r.rowNumber] = 'skip';
        else decisions[r.rowNumber] = 'skip';
      });
      setRowDecisions(decisions);
      setStep('preview');
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [file]);

  // ── Execute import ───────────────────────────────────

  const handleExecute = useCallback(async () => {
    if (!preview || !file) return;
    setExecuting(true);

    try {
      const rowsToImport = preview.rows
        .filter((r) => rowDecisions[r.rowNumber] !== 'skip' && r.errors.length === 0)
        .map((r) => ({
          rowNumber: r.rowNumber,
          action: rowDecisions[r.rowNumber] === 'update' && r.matchedGrowerId ? 'update' : 'create',
          matchedGrowerId: r.matchedGrowerId,
        }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('rows', JSON.stringify(rowsToImport));
      formData.append('sourceType', 'COFFEE_BOARD_INDIA');
      formData.append('sourceName', file.name);

      const res = await fetch('/api/ops/growers/import/execute', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? 'Import failed');
        return;
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setStep('complete');
      loadBatches();
    } catch {
      alert('Import failed. Please try again.');
    } finally {
      setExecuting(false);
    }
  }, [preview, file, rowDecisions]);

  function reset() {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setRowDecisions({});
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/ops/growers')} className="text-gray-500 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Import Growers</h2>
          <p className="text-sm text-gray-500">Upload CSV/XLSX from Coffee Board or other sources</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['upload', 'preview', 'complete'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step === s ? 'bg-[#1a3c2e] text-white' :
              ['upload', 'preview', 'complete'].indexOf(step) > i ? 'bg-emerald-100 text-emerald-700' :
              'bg-gray-100 text-gray-400'
            }`}>
              {['upload', 'preview', 'complete'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className={`text-xs ${step === s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{
              s === 'upload' ? 'Upload' : s === 'preview' ? 'Review' : 'Done'
            }</span>
            {i < 2 && <div className={`w-8 h-px ${['upload', 'preview', 'complete'].indexOf(step) > i ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Upload ────────────────────────────── */}
      {step === 'upload' && (
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#1a3c2e]/40 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) {
                  setFile(f);
                  setUploadError('');
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-700">
                {file ? file.name : 'Drop a file here or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-1">CSV or XLSX, max 5MB</p>
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 mt-3 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {uploadError}
              </div>
            )}

            {file && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileSpreadsheet className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
                <Button
                  onClick={handlePreview}
                  disabled={uploading}
                  className="bg-[#1a3c2e] hover:bg-[#1a3c2e]/90"
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    'Preview Import'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Preview ───────────────────────────── */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">{preview.totalRows}</p>
                  <p className="text-[11px] text-gray-500">Total Rows</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-[#1a3c2e]">{preview.newGrowers}</p>
                  <p className="text-[11px] text-gray-500">New</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-amber-600">{preview.possibleMatches}</p>
                  <p className="text-[11px] text-gray-500">Possible Matches</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-red-600">{preview.errors}</p>
                  <p className="text-[11px] text-gray-500">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Duplicate warning */}
          {preview.duplicates > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{preview.duplicates} duplicate(s) detected. Review carefully before importing.</span>
            </div>
          )}

          {/* Preview table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 sticky top-0 z-10">
                  <TableHead className="text-xs font-semibold w-8">#</TableHead>
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">State</TableHead>
                  <TableHead className="text-xs font-semibold">Match</TableHead>
                  <TableHead className="text-xs font-semibold">Action</TableHead>
                  <TableHead className="text-xs font-semibold">Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row) => {
                  const decision = rowDecisions[row.rowNumber] ?? 'skip';
                  return (
                    <TableRow key={row.rowNumber} className={row.errors.length > 0 ? 'bg-red-50/30' : decision === 'skip' ? 'opacity-60' : ''}>
                      <TableCell className="text-xs text-gray-400">{row.rowNumber}</TableCell>
                      <TableCell className="text-xs font-medium text-gray-900">{row.displayName}</TableCell>
                      <TableCell className="text-xs text-gray-600">{row.state ?? '—'}</TableCell>
                      <TableCell>
                        <MatchBadge matchType={row.matchType} />
                      </TableCell>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <Badge variant="outline" className="text-[10px] text-red-600 border-red-200">Error</Badge>
                        ) : (
                          <select
                            className="h-7 text-xs rounded border border-gray-200 bg-white px-2"
                            value={decision}
                            onChange={(e) => setRowDecisions((d) => ({ ...d, [row.rowNumber]: e.target.value as 'create' | 'update' | 'skip' }))}
                          >
                            <option value="create">Create New</option>
                            {row.matchedGrowerId && <option value="update">Update Match</option>}
                            <option value="skip">Skip</option>
                          </select>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-red-500 max-w-[200px] truncate">
                        {row.errors.length > 0 ? row.errors.join('; ') : ''}
                        {row.matchType === 'duplicate' && row.matchedGrowerName && !row.errors.length ? (
                          <span className="text-amber-600">Match: {row.matchedGrowerName}</span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={reset}>Back</Button>
            <Button
              onClick={handleExecute}
              disabled={executing}
              className="bg-[#1a3c2e] hover:bg-[#1a3c2e]/90"
            >
              {executing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
              ) : (
                `Import ${preview.rows.filter((r) => rowDecisions[r.rowNumber] !== 'skip' && r.errors.length === 0).length} Growers`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Complete ──────────────────────────── */}
      {step === 'complete' && result && (
        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Import Complete</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-900">{result.totalRows}</p>
                <p className="text-[11px] text-gray-500">Total</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-[#1a3c2e]">{result.created}</p>
                <p className="text-[11px] text-gray-500">Created</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-amber-600">{result.duplicatesFlagged}</p>
                <p className="text-[11px] text-gray-500">Duplicates</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-red-600">{result.errors}</p>
                <p className="text-[11px] text-gray-500">Errors</p>
              </div>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" onClick={reset}>Import Another</Button>
              <Button onClick={() => router.push('/ops/growers')}>View Growers</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Import History ────────────────────────────── */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Import History</h3>
        {loadingBatches ? (
          <Skeleton className="h-24 w-full" />
        ) : batches.length === 0 ? (
          <p className="text-sm text-gray-400">No import history yet</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold">Source</TableHead>
                  <TableHead className="text-xs font-semibold">File</TableHead>
                  <TableHead className="text-xs font-semibold">Rows</TableHead>
                  <TableHead className="text-xs font-semibold">Imported</TableHead>
                  <TableHead className="text-xs font-semibold">Duplicates</TableHead>
                  <TableHead className="text-xs font-semibold">Errors</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-xs text-gray-600">{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs text-gray-600">{DATA_SOURCE_TYPE_LABELS[b.sourceType as keyof typeof DATA_SOURCE_TYPE_LABELS] ?? b.sourceType}</TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-[150px] truncate">{b.fileName ?? '—'}</TableCell>
                    <TableCell className="text-xs text-gray-900 font-medium">{b.totalRows}</TableCell>
                    <TableCell className="text-xs text-[#1a3c2e] font-medium">{b.importedRows}</TableCell>
                    <TableCell className="text-xs text-amber-600">{b.duplicateRows}</TableCell>
                    <TableCell className="text-xs text-red-600">{b.errorRows}</TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'COMPLETED' ? 'default' : b.status === 'FAILED' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────

function MatchBadge({ matchType }: { matchType: string }) {
  switch (matchType) {
    case 'new':
      return <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">New</Badge>;
    case 'possible_match':
      return <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">Possible Match</Badge>;
    case 'duplicate':
      return <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 bg-red-50">Duplicate</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{matchType}</Badge>;
  }
}
