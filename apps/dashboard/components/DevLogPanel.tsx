"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Gauge,
  MousePointerClick,
  Network,
  Terminal,
  Wrench,
} from "lucide-react";
import type { LogItem } from "@/components/TechTimeline";
import { SLOW_NETWORK_MS } from "@/lib/timeline-feed";
import { cn } from "@/lib/utils";

type DevToolsTab =
  | "all"
  | "console"
  | "network"
  | "performance"
  | "errors"
  | "actions";

const SLOW_LCP_MS = 2500;

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
  const [tab, setTab] = useState<DevToolsTab>("all");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement | null>(null);
  const userScrolledRef = useRef(false);

  const timeFilteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const relative = log.timestamp - sessionStartTimeMs;
        return relative <= currentVideoTimeMs;
      }),
    [logs, sessionStartTimeMs, currentVideoTimeMs]
  );

  const vitalsSummary = useMemo(() => {
    const vitals = logs.filter((l) => l.type === "vitals");
    const latest: Record<string, { value: number; rating?: string }> = {};
    for (const v of vitals) {
      const key = v.subType;
      const value = Number(v.metadata.value ?? 0);
      latest[key] = { value, rating: String(v.metadata.rating ?? "") };
    }
    return latest;
  }, [logs]);

  const tabCounts = useMemo(
    () => ({
      all: timeFilteredLogs.length,
      console: timeFilteredLogs.filter((l) => l.type === "console").length,
      network: timeFilteredLogs.filter((l) => l.type === "network").length,
      performance: timeFilteredLogs.filter((l) => l.type === "vitals").length,
      errors: timeFilteredLogs.filter(isErrorEntry).length,
      actions: timeFilteredLogs.filter((l) => l.type === "action").length,
    }),
    [timeFilteredLogs]
  );

  const visibleLogs = useMemo(() => {
    switch (tab) {
      case "console":
        return timeFilteredLogs.filter((l) => l.type === "console");
      case "network":
        return timeFilteredLogs.filter((l) => l.type === "network");
      case "performance":
        return timeFilteredLogs.filter((l) => l.type === "vitals");
      case "errors":
        return timeFilteredLogs.filter(isErrorEntry);
      case "actions":
        return timeFilteredLogs.filter((l) => l.type === "action");
      default:
        return timeFilteredLogs;
    }
  }, [tab, timeFilteredLogs]);

  const activeLogIndex = useMemo(() => {
    if (visibleLogs.length === 0) return -1;
    let best = 0;
    let bestDelta = Infinity;
    for (let i = 0; i < visibleLogs.length; i++) {
      const relative = visibleLogs[i].timestamp - sessionStartTimeMs;
      const delta = currentVideoTimeMs - relative;
      if (delta >= 0 && delta < bestDelta) {
        bestDelta = delta;
        best = i;
      }
    }
    return best;
  }, [visibleLogs, sessionStartTimeMs, currentVideoTimeMs]);

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
  }, [currentVideoTimeMs, autoScroll, visibleLogs.length, activeLogIndex]);

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

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // ignore
    }
  };

  const tabs: {
    key: DevToolsTab;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: "all", label: "All" },
    { key: "errors", label: "Errors", icon: AlertTriangle },
    { key: "console", label: "Console", icon: Terminal },
    { key: "network", label: "Network", icon: Network },
    { key: "performance", label: "Perf", icon: Gauge },
    { key: "actions", label: "Actions", icon: MousePointerClick },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border bg-card font-sans text-xs shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-muted/30 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Wrench className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="font-semibold text-foreground text-sm">
            DevTools
          </span>
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            @ {(currentVideoTimeMs / 1000).toFixed(1)}s
          </span>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[10px] text-muted-foreground">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => {
              setAutoScroll(e.target.checked);
              if (e.target.checked) userScrolledRef.current = false;
            }}
            className="size-3 rounded border-input"
          />
          Follow
        </label>
      </div>

      {/* Web Vitals summary */}
      {(tab === "performance" || tab === "all") &&
        Object.keys(vitalsSummary).length > 0 && (
          <div className="grid shrink-0 grid-cols-2 gap-1.5 border-b border-border/60 bg-muted/10 p-2 sm:grid-cols-4">
            {Object.entries(vitalsSummary).map(([name, data]) => {
              const slow = name === "LCP" && data.value > SLOW_LCP_MS;
              return (
                <div
                  key={name}
                  className={cn(
                    "rounded-md border px-2 py-1.5",
                    slow
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-border/60 bg-background"
                  )}
                >
                  <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
                    {name}
                  </p>
                  <p className="font-semibold tabular-nums text-foreground">
                    {name === "CLS"
                      ? data.value.toFixed(3)
                      : `${Math.round(data.value)}ms`}
                  </p>
                  {data.rating && (
                    <p className="text-[9px] capitalize text-muted-foreground">
                      {data.rating}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* Tabs */}
      <div className="shrink-0 border-b border-border/60 px-2 py-2">
        <div className="flex flex-wrap gap-1">
          {tabs.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {Icon && <Icon className="size-3" />}
                <span>{label}</span>
                <span
                  className={cn(
                    "ml-0.5 rounded px-1 text-[10px] tabular-nums",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tabCounts[key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Log entries */}
      <div
        ref={containerRef}
        onScroll={handleContainerScroll}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2"
      >
        {visibleLogs.map((log, index) => {
          const rowKey = `${log.timestamp}-${log.type}-${index}`;
          const relativeMs = log.timestamp - sessionStartTimeMs;
          const isActive = index === activeLogIndex;
          const expanded = expandedKey === rowKey;
          const styling = getLogRowStyle(log);
          const technicalLine = formatTechnicalSummary(log);
          const copyPayload =
            log.type === "network"
              ? String(log.metadata.url ?? log.message)
              : log.message;
          const canCopy = log.type === "network" && Boolean(copyPayload);

          return (
            <div
              key={rowKey}
              ref={isActive ? activeRowRef : undefined}
              className={cn(
                "overflow-hidden rounded-md border transition",
                styling.container,
                isActive &&
                  "border-primary/50 bg-primary/[0.06] ring-1 ring-primary/30"
              )}
            >
              <div className="flex items-stretch">
                <button
                  type="button"
                  className="grid min-w-0 flex-1 grid-cols-[1rem_3.25rem_2.25rem_1rem_1fr] items-start gap-1.5 px-2 py-1.5 text-left"
                  onClick={() => {
                    setExpandedKey(expanded ? null : rowKey);
                    onSeek?.(relativeMs);
                  }}
                >
                  <span className="mt-0.5 text-muted-foreground">
                    {expanded ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                  </span>
                  <span className="mt-0.5 text-right text-[10px] tabular-nums text-muted-foreground">
                    +{(relativeMs / 1000).toFixed(2)}s
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {channelLabel(log)}
                  </span>
                  <span className="mt-0.5">{renderIcon(log)}</span>
                  <div className="min-w-0 space-y-0.5">
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
                    <p
                      className={cn(
                        "truncate font-mono leading-snug",
                        styling.text
                      )}
                      title={log.message}
                    >
                      {log.message}
                    </p>
                    {technicalLine && (
                      <p
                        className="truncate font-mono text-[10px] leading-relaxed text-muted-foreground"
                        title={technicalLine}
                      >
                        {technicalLine}
                      </p>
                    )}
                  </div>
                </button>
                {canCopy && (
                  <button
                    type="button"
                    title="Copy URL"
                    className="flex w-8 shrink-0 items-center justify-center border-l border-border/40 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    onClick={() => void copyText(copyPayload, rowKey)}
                  >
                    <Copy className="size-3" />
                  </button>
                )}
              </div>
              {copiedKey === rowKey && (
                <p className="border-t border-border/40 bg-emerald-500/10 px-3 py-1 text-[9px] text-emerald-600 dark:text-emerald-400">
                  Copied to clipboard
                </p>
              )}
              {expanded && (
                <div className="border-t border-border/40 bg-muted/20 px-3 py-2">
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] leading-relaxed text-muted-foreground">
                    {formatInspectionBlock(log)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}

        {visibleLogs.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {logs.length === 0
              ? "No telemetry for this session."
              : `No ${tab === "all" ? "" : tab} events before playhead.`}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-3 py-1.5 text-[10px] tabular-nums text-muted-foreground">
        <span>{visibleLogs.length} of {logs.length} entries</span>
        {activeLogIndex >= 0 && visibleLogs.length > 0 && (
          <span className="opacity-70">
            row {activeLogIndex + 1} / {visibleLogs.length}
          </span>
        )}
      </div>
    </div>
  );
}

function isErrorEntry(log: LogItem): boolean {
  if (isErrorLog(log)) return true;
  if (log.type === "action") {
    return (
      log.subType === "error_click" ||
      log.subType === "rage_click" ||
      log.subType === "dead_click"
    );
  }
  return false;
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
    const method = log.metadata.method ?? "GET";
    const status = log.metadata.status ?? "?";
    const ms = log.metadata.durationMs ?? "?";
    return `${method} • HTTP ${status} • ${ms}ms`;
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
  if (
    isErrorLog(log) ||
    log.subType === "rage_click" ||
    log.subType === "error_click"
  ) {
    return {
      container: "border-destructive/35 bg-destructive/5",
      badge: "bg-destructive/20 text-destructive",
      text: "text-destructive",
    };
  }
  if (
    log.level === "warn" ||
    isSlowNetwork(log) ||
    log.subType === "dead_click"
  ) {
    return {
      container: "border-amber-500/40 bg-amber-500/5",
      badge: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
      text: "text-foreground",
    };
  }
  if (log.type === "action") {
    return {
      container: "border-sky-500/35 bg-sky-500/5",
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
      ...log.metadata,
    },
    null,
    2
  );
}
