'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { VerificationBadge } from './verification-badge';
import { COFFEE_SPECIES_LABELS, PROCESSING_METHOD_LABELS } from '@/lib/grower/constants';
import type { SanitizedGrower } from '@/lib/grower/types';

interface GrowerCardProps {
  grower: SanitizedGrower;
}

export function GrowerCard({ grower }: GrowerCardProps) {
  const species = grower.primarySpecies
    ? COFFEE_SPECIES_LABELS[grower.primarySpecies]
    : null;

  const processing = grower.processingMethods?.length
    ? grower.processingMethods
        .slice(0, 2)
        .map((p) => PROCESSING_METHOD_LABELS[p as keyof typeof PROCESSING_METHOD_LABELS] ?? p)
        .join(', ')
    : null;

  return (
    <Link href={`/ops/growers/${grower.id}`} className="block group">
      <Card className="transition-all hover:shadow-md hover:border-gray-300 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#1a3c2e]">
                {grower.displayName}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {grower.state ?? 'Unknown'}
                {species ? ` · ${species}` : ''}
              </p>
            </div>
            <VerificationBadge status={grower.verificationStatus} />
          </div>

          {processing && (
            <p className="text-xs text-gray-400 mt-2">{processing}</p>
          )}

          {grower.lotCount > 0 && (
            <p className="text-[10px] text-gray-400 mt-1.5">
              {grower.lotCount} lot{grower.lotCount !== 1 ? 's' : ''} available
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
