'use client';

import type { GrowerReadiness } from '@/lib/grower/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReadinessScoreProps {
  readiness: GrowerReadiness;
}

const DIMENSION_KEYS = ['profile', 'verification', 'documentation', 'lot', 'sample', 'export'] as const;

export function ReadinessScore({ readiness }: ReadinessScoreProps) {
  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Readiness</span>
          <span className="text-sm font-semibold text-gray-900">{Math.round(readiness.overall)}%</span>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {DIMENSION_KEYS.map((key) => {
            const dim = readiness[key];
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${dim.score}%`,
                          backgroundColor: dim.score >= 80 ? '#1a3c2e' : dim.score >= 50 ? '#c9a84c' : '#94a3b8',
                        }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p className="font-medium">{dim.label}</p>
                  <p>{dim.score}% complete</p>
                  <ul className="mt-1 text-[10px] text-gray-400">
                    {dim.items.map((item) => (
                      <li key={item.field}>
                        {item.complete ? '✓' : '○'} {item.label}
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="flex justify-between text-[9px] text-gray-400">
          {DIMENSION_KEYS.map((key) => (
            <span key={key} className="truncate w-full text-center">
              {readiness[key].label.slice(0, 3).toLowerCase()}
            </span>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
