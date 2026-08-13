'use client';

import { INDIAN_COFFEE_STATES, COFFEE_SPECIES_LABELS, VERIFICATION_LABELS } from '@/lib/grower/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { GrowerFilters } from '@/lib/grower/types';

interface GrowerFiltersBarProps {
  filters: GrowerFilters;
  onChange: (filters: GrowerFilters) => void;
}

export function GrowerFilters({ filters, onChange }: GrowerFiltersBarProps) {
  const hasFilters = !!(
    filters.state ||
    filters.primarySpecies ||
    filters.verificationStatus ||
    filters.relationshipStatus
  );

  function clearFilters() {
    onChange({ ...filters, state: undefined, primarySpecies: undefined, verificationStatus: undefined, relationshipStatus: undefined });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.state as string ?? ''}
        onValueChange={(v) => onChange({ ...filters, state: v || undefined })}
      >
        <SelectTrigger className="w-[150px] h-8 text-xs">
          <SelectValue placeholder="State" />
        </SelectTrigger>
        <SelectContent>
          {INDIAN_COFFEE_STATES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.primarySpecies as string ?? ''}
        onValueChange={(v) => onChange({ ...filters, primarySpecies: (v || undefined) as GrowerFilters['primarySpecies'] })}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Species" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(COFFEE_SPECIES_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={(Array.isArray(filters.verificationStatus) ? filters.verificationStatus[0] : filters.verificationStatus) as string ?? ''}
        onValueChange={(v) => onChange({ ...filters, verificationStatus: (v || undefined) as GrowerFilters['verificationStatus'] })}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Verification" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(VERIFICATION_LABELS).map(([k, v]) => (
            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-gray-500">
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
