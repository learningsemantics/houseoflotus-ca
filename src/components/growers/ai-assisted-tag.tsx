'use client';

import { Sparkles } from 'lucide-react';

export function AiAssistedTag() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#c9a84c] bg-[#c9a84c]/10 px-1.5 py-0.5 rounded">
      <Sparkles className="h-2.5 w-2.5" />
      AI Assisted
    </span>
  );
}
