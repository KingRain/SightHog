"use client";

import { AlertTriangle, Flame, Gauge, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SessionTriageFlags } from "@/lib/session-triage";

interface SessionTriageBadgesProps {
  triage: SessionTriageFlags;
}

export default function SessionTriageBadges({ triage }: SessionTriageBadgesProps) {
  const badges: { key: string; label: string; icon: React.ReactNode; variant: "destructive" | "secondary" | "outline" }[] = [];

  if (triage.has_console_error || triage.has_error_click || triage.has_network_error) {
    badges.push({
      key: "error",
      label: "Error",
      icon: <AlertTriangle className="size-3" />,
      variant: "destructive",
    });
  }
  if (triage.has_rage_click) {
    badges.push({
      key: "rage",
      label: "Rage",
      icon: <Flame className="size-3" />,
      variant: "destructive",
    });
  }
  if (triage.has_dead_click) {
    badges.push({
      key: "dead",
      label: "Dead click",
      icon: <AlertTriangle className="size-3" />,
      variant: "secondary",
    });
  }
  if (triage.has_slow_lcp) {
    badges.push({
      key: "slow",
      label: "Slow LCP",
      icon: <Gauge className="size-3" />,
      variant: "outline",
    });
  }
  if (triage.has_slow_network) {
    badges.push({
      key: "net",
      label: "Slow net",
      icon: <Wifi className="size-3" />,
      variant: "outline",
    });
  }

  if (badges.length === 0) {
    return (
      <span className="text-muted-foreground text-xs">—</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <Badge key={b.key} variant={b.variant} className="gap-0.5 text-[10px]">
          {b.icon}
          {b.label}
        </Badge>
      ))}
    </div>
  );
}
