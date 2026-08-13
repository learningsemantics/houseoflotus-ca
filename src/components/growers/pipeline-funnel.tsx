'use client';

interface FunnelStageData {
  stage: string;
  label: string;
  count: number;
  color: string;
}

interface PipelineFunnelProps {
  stages: FunnelStageData[];
}

export function PipelineFunnel({ stages }: PipelineFunnelProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-1 min-w-[600px] h-40 px-2">
        {stages.map((stage) => {
          const pct = Math.max((stage.count / maxCount) * 100, 4);
          return (
            <div key={stage.stage} className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-xs font-semibold text-gray-900 mb-1">
                {stage.count}
              </span>
              <div
                className="w-full rounded-t-md transition-all duration-500"
                style={{
                  height: `${pct}%`,
                  backgroundColor: stage.color,
                  opacity: stage.count === 0 ? 0.25 : 0.85,
                }}
              />
              <span className="text-[10px] text-gray-500 mt-1.5 text-center leading-tight truncate w-full">
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
