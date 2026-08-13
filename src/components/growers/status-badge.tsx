'use client';

import { Badge } from '@/components/ui/badge';
import { GROWER_RELATIONSHIP_STATUS_LABELS } from '@/lib/grower/constants';
import type { GrowerRelationshipStatus } from '@prisma/client';
import { cn } from '@/components/ui';

type Size = 'sm' | 'md' | 'lg';

interface GrowerStatusBadgeProps {
  status: GrowerRelationshipStatus;
  size?: Size;
}

function getStatusClasses(status: GrowerRelationshipStatus, size: Size): string {
  const sizeClasses: Record<Size, string> = {
    sm: 'text-[10px] px-1.5 py-0',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  const base = sizeClasses[size];

  switch (status) {
    case 'ACTIVE_GROWER':
      return `${base} bg-[#1a3c2e] text-white border-[#1a3c2e]`;
    case 'QUALIFIED':
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    case 'VERIFIED':
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    case 'UNDER_VERIFICATION':
      return `${base} bg-sky-50 text-sky-700 border-sky-200`;
    case 'CUPPING':
      return `${base} bg-violet-50 text-violet-700 border-violet-200`;
    case 'SAMPLE_REQUESTED':
    case 'SAMPLE_RECEIVED':
      return `${base} bg-violet-50 text-violet-700 border-violet-200`;
    case 'APPLICATION_STARTED':
    case 'APPLICATION_RECEIVED':
    case 'INFORMATION_REQUESTED':
      return `${base} bg-amber-50 text-amber-700 border-amber-200`;
    case 'DISCOVERED':
    case 'IDENTIFIED':
    case 'CONTACTED':
    case 'RESPONDED':
    case 'INTERESTED':
      return `${base} bg-amber-50 text-[#92780c] border-amber-200`;
    case 'REJECTED':
      return `${base} bg-red-50 text-red-700 border-red-200`;
    case 'DORMANT':
      return `${base} bg-slate-50 text-slate-500 border-slate-200`;
    default:
      return `${base} bg-slate-50 text-slate-600 border-slate-200`;
  }
}

export function GrowerStatusBadge({ status, size = 'md' }: GrowerStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(getStatusClasses(status, size))}>
      {GROWER_RELATIONSHIP_STATUS_LABELS[status]}
    </Badge>
  );
}
