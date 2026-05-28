"use client";

import { Badge } from "@/components/ui/badge";
import type { FunnelStepResult } from "@/app/api/analytics/funnel/route";
import { cn } from "@/lib/utils";

interface FunnelChartProps {
  steps: FunnelStepResult[];
}

export function FunnelChart({ steps }: FunnelChartProps) {
  if (steps.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground text-sm">
        No funnel data yet. Use the demo checkout funnel buttons to generate events.
      </p>
    );
  }

  const maxUsers = Math.max(...steps.map((s) => s.users), 1);

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const widthPercent = Math.max(8, (step.users / maxUsers) * 100);
        return (
          <div key={step.step} className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{step.label}</span>
                {step.isLargestDropOff && (
                  <Badge variant="destructive" className="text-[10px]">
                    Largest drop-off
                  </Badge>
                )}
              </div>
              <span className="tabular-nums text-muted-foreground text-xs">
                {step.users.toLocaleString()} users · {step.conversionPercent}% retained
                {index > 0 && ` · −${step.dropOffPercent}%`}
              </span>
            </div>
            <div className="relative h-9 overflow-hidden rounded-md bg-muted/50">
              <div
                className={cn(
                  "flex h-full items-center rounded-md px-3 text-xs font-medium text-primary-foreground transition-all",
                  step.isLargestDropOff
                    ? "bg-gradient-to-r from-destructive/90 to-destructive"
                    : "bg-gradient-to-r from-primary/80 to-primary"
                )}
                style={{ width: `${widthPercent}%` }}
              >
                {step.conversionPercent}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
