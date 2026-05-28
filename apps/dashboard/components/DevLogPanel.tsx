"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  MousePointerClick,
  Network,
  Terminal,
} from "lucide-react";
import type { LogItem } from "@/components/TechTimeline";
import { SLOW_NETWORK_MS } from "@/lib/timeline-feed";
import { cn } from "@/lib/utils";

type FilterType = "all" | "console" | "network" | "vitals" | "action";

const ACTIVE_LOG_THRESHOLD_MS = 1200;

interface DevLogPanelProps {
  logs: LogItem[];
  currentVideoTimeMs: number;
  sessionStartTimeMs: number;
  onSeek?: (timeMs: number) => void;
}

export default function DevLogPanel({
  logs,
  currentVideoTimeMs,
  sessionStartTimeMs,
  onSeek,
}: DevLogPanelProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement | null>(null);
  const userScrolledRef = useRef(false);

  const counts = useMemo(
    () => ({
      all: logs.length,
      console: logs.filter((l) => l.type === "console").length,
      network: logs.filter((l) => l.type === "network").length,
      vitals: logs.filter((l) => l.type === "vitals").length,
      action: logs.filter((l) => l.type === "action").length,
    }),
    [logs]
  );

  const timeFilteredLogs = logs.filter((log) => {
    const relative = log.timestamp - sessionStartTimeMs;
    return relative <= currentVideoTimeMs;
  });

  const visibleLogs =
    filter === "all"
      ? timeFilteredLogs
      : timeFilteredLogs.filter((log) => log.type === filter);

  useEffect(() => {
    if (!autoScroll || userScrolledRef.current) return;
    if (!activeRowRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const row = activeRowRef.current;
    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;

    if (rowTop < viewTop) {
      container.scrollTop = rowTop;
    } else if (rowBottom > viewBottom) {
      container.scrollTop = rowBottom - container.clientHeight;
    }
  }, [currentVideoTimeMs, autoScroll, visibleLogs.length]);

  const handleContainerScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      24;
    if (!atBottom) {
      userScrolledRef.current = true;
      setAutoScroll(false);
    }
  };

  const handleFollowChange = (checked: boolean) => {
    setAutoScroll(checked);
    if (checked) {
      userScrolledRef.current = false;
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border bg-card font-mono text-xs">
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-sans font-semibold text-foreground text-sm">
            Live logs
          </span>
          <span className="font-sans text-muted-foreground text-[10px]">
            synced {(currentVideoTimeMs / 1000).toFixed(1)}s
          </span>
        </div>
        <label className="flex items-center gap-1.5 font-sans text-[10px] text-muted-foreground">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => handleFollowChange(e.target.checked)}
            className="size-3 rounded border-input"
          />
          Follow playhead
        </label>
      </div>

      <div className="border-b px-2 py-2">
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", "All", undefined],
              ["console", "Console", Terminal],
              ["network", "Network", Network],
              ["action", "Actions", MousePointerClick],
              ["vitals", "Vitals", Activity],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] transition",
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {Icon && <Icon className="size-3" />}
              {label}
              <span className="opacity-70">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleContainerScroll}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2"
      >
        {visibleLogs.map((log, index) => {
          const rowKey = `${log.timestamp}-${log.type}-${index}`;
          const relativeMs = log.timestamp - sessionStartTimeMs;
          const isActive =
            Math.abs(relativeMs - currentVideoTimeMs) <= ACTIVE_LOG_THRESHOLD_MS;
          const expanded = expandedKey === rowKey;
          const channel = channelLabel(log);
          const styling = getLogRowStyle(log);
          const technicalLine = formatTechnicalSummary(log);

          return (
            <div
              key={rowKey}
              ref={isActive ? activeRowRef : undefined}
              className={cn(
                "overflow-hidden rounded-md border transition",
                styling.container,
                isActive && "border-primary/50 bg-primary/8 ring-1 ring-primary/30"
              )}
            >
              <button
                type="button"
                className="flex w-full items-start gap-2 p-2 text-left"
                onClick={() => {
                  setExpandedKey(expanded ? null : rowKey);
                  onSeek?.(relativeMs);
                }}
              >
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                  {expanded ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                </span>
                <span className="w-[3.25rem] shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                  +{(relativeMs / 1000).toFixed(2)}s
                </span>
                <span className="w-9 shrink-0 font-bold text-[10px] uppercase tracking-wide text-muted-foreground">
                  {channel}
                </span>
                <span className="mt-0.5 shrink-0">{renderIcon(log)}</span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1">
                    {log.level && (
                      <span
                        className={cn(
                          "rounded px-1 py-0.5 text-[9px] font-bold uppercase",
                          styling.badge
                        )}
                      >
                        {log.level}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {log.subType}
                    </span>
                  </div>
                  <p className={cn("break-all leading-snug", styling.text)}>
                    {log.message}
                  </p>
                  {technicalLine && (
                    <p className="break-all text-[10px] text-muted-foreground leading-relaxed">
                      {technicalLine}
                    </p>
                  )}
                </div>
              </button>
              {expanded && (
                <div className="border-t bg-muted/20 px-3 py-2">
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all text-[10px] leading-relaxed text-muted-foreground">
                    {formatInspectionBlock(log)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}

        {visibleLogs.length === 0 && (
          <div className="py-16 text-center font-sans text-muted-foreground text-sm">
            {logs.length === 0
              ? "No telemetry for this session."
              : "No events before current playhead."}
          </div>
        )}
      </div>

      <div className="border-t px-3 py-1.5 font-sans text-[10px] text-muted-foreground">
        {visibleLogs.length} / {logs.length} entries • filter: {filter}
      </div>
    </div>
  );
}

function channelLabel(log: LogItem): string {
  if (log.type === "network") return "NET";
  if (log.type === "console") return "CON";
  if (log.type === "vitals") return "VIT";
  if (log.type === "action") return "ACT";
  return "LOG";
}

function isSlowNetwork(log: LogItem): boolean {
  const durationMs = Number(log.metadata.durationMs ?? 0);
  return durationMs >= SLOW_NETWORK_MS || log.metadata.slow === true;
}

function isErrorLog(log: LogItem): boolean {
  return (
    log.level === "error" ||
    log.subType === "error" ||
    log.subType === "fetch_error" ||
    Number(log.metadata.status ?? 0) >= 500
  );
}

function formatTechnicalSummary(log: LogItem): string | null {
  if (log.type === "network") {
    const status = log.metadata.status ?? "?";
    const ms = log.metadata.durationMs ?? "?";
    const ok = log.metadata.ok === true ? "ok=true" : "ok=false";
    return `HTTP ${status} • ${ms}ms • ${ok}`;
  }
  if (log.type === "action") {
    const target = log.metadata.target ?? log.message;
    const coords =
      log.metadata.x != null
        ? ` @ (${log.metadata.x}, ${log.metadata.y})`
        : "";
    return `selector=${target}${coords}`;
  }
  if (log.type === "console" && log.metadata.stack) {
    const stack = String(log.metadata.stack).split("\n")[0];
    return stack.slice(0, 120);
  }
  if (log.type === "vitals") {
    return `rating=${log.metadata.rating ?? "n/a"} value=${log.metadata.value ?? "?"}`;
  }
  return null;
}

function getLogRowStyle(log: LogItem) {
  if (isErrorLog(log)) {
    return {
      container: "border-destructive/35 bg-destructive/5",
      badge: "bg-destructive/20 text-destructive",
      text: "text-destructive",
    };
  }
  if (log.level === "warn" || isSlowNetwork(log)) {
    return {
      container: "border-amber-500/35 bg-amber-500/5",
      badge: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
      text: "text-foreground",
    };
  }
  if (log.type === "action") {
    return {
      container: "border-sky-500/30 bg-sky-500/5",
      badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      text: "text-foreground",
    };
  }
  return {
    container: "border-border/50 hover:bg-muted/30",
    badge: "bg-muted text-muted-foreground",
    text: "text-foreground",
  };
}

function renderIcon(log: LogItem) {
  if (log.type === "network") {
    return isErrorLog(log) ? (
      <AlertCircle className="size-3.5 text-destructive" />
    ) : (
      <CheckCircle className="size-3.5 text-emerald-500" />
    );
  }
  if (log.type === "vitals") {
    return <Activity className="size-3.5 text-violet-500" />;
  }
  if (log.type === "action") {
    return <MousePointerClick className="size-3.5 text-sky-500" />;
  }
  return (
    <Terminal
      className={cn(
        "size-3.5",
        log.level === "error"
          ? "text-destructive"
          : log.level === "warn"
            ? "text-amber-500"
            : "text-sky-500"
      )}
    />
  );
}

function formatInspectionBlock(log: LogItem): string {
  return JSON.stringify(
    {
      channel: log.type,
      subType: log.subType,
      level: log.level,
      message: log.message,
      timestamp: log.timestamp,
      relativeMs: log.timestamp,
      ...log.metadata,
    },
    null,
    2
  );
}
