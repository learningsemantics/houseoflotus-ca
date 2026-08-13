'use client';

import { Badge } from '@/components/ui/badge';
import { VERIFICATION_LABELS } from '@/lib/grower/constants';
import type { OverallVerificationStatus } from '@prisma/client';
import { cn } from '@/components/ui';

interface VerificationBadgeProps {
  status: OverallVerificationStatus;
}

function getVerificationClasses(status: OverallVerificationStatus): string {
  switch (status) {
    case 'VERIFIED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'PARTIALLY_VERIFIED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'UNVERIFIED':
      return 'bg-slate-50 text-slate-500 border-slate-200';
    case 'SUSPENDED':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'VERIFICATION_EXPIRED':
      return 'bg-orange-50 text-orange-600 border-orange-200';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200';
  }
}

export function VerificationBadge({ status }: VerificationBadgeProps) {
  return (
    <Badge variant="outline" className={cn('text-xs', getVerificationClasses(status))}>
      {VERIFICATION_LABELS[status]}
    </Badge>
  );
}
