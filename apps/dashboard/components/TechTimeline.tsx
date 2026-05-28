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
import { SLOW_NETWORK_MS } from "@/lib/timeline-feed";

export type LogLevel = "info" | "warn" | "error";

export interface LogItem {
  type: "network" | "console" | "vitals" | "action";
  subType: string;
  level?: LogLevel;
  message: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

type FilterType = "all" | "console" | "network" | "vitals" | "action";

const ACTIVE_LOG_THRESHOLD_MS = 1200;

interface TechTimelineProps {
  logs: LogItem[];
  currentVideoTimeMs: number;
  sessionStartTimeMs: number;
  onSeek?: (timeMs: number) => void;
}

export default function TechTimeline({
  logs,
  currentVideoTimeMs,
  sessionStartTimeMs,
  onSeek,
}: TechTimelineProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const counts = useMemo(
    () => ({
      all: logs.length,
      console: logs.filter((log) => log.type === "console").length,
      network: logs.filter((log) => log.type === "network").length,
      vitals: logs.filter((log) => log.type === "vitals").length,
      action: logs.filter((log) => log.type === "action").length,
    }),
    [logs]
  );

  const timeFilteredLogs = logs.filter((log) => {
    const relativeLogTime = log.timestamp - sessionStartTimeMs;
    return relativeLogTime <= currentVideoTimeMs;
  });

  const visibleLogs =
    filter === "all"
      ? timeFilteredLogs
      : timeFilteredLogs.filter((log) => log.type === filter);

  useEffect(() => {
    if (visibleLogs.length > prevCountRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    prevCountRef.current = visibleLogs.length;
  }, [visibleLogs.length]);

  return (
    <div className="flex h-[576px] w-full flex-col rounded-2xl border bg-card font-mono text-xs text-foreground">
      <div className="rounded-t-2xl border-b bg-muted/40 px-3 py-2">
        <div className="inline-flex flex-wrap gap-1 rounded-full border bg-background/80 p-1">
          <FilterTab
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="All"
            count={counts.all}
          />
          <FilterTab
            active={filter === "console"}
            onClick={() => setFilter("console")}
            label="Console"
            icon={<Terminal size={12} />}
            count={counts.console}
          />
          <FilterTab
            active={filter === "network"}
            onClick={() => setFilter("network")}
            label="Network"
            icon={<Network size={12} />}
            count={counts.network}
          />
          <FilterTab
            active={filter === "action"}
            onClick={() => setFilter("action")}
            label="Actions"
            icon={<MousePointerClick size={12} />}
            count={counts.action}
          />
          <FilterTab
            active={filter === "vitals"}
            onClick={() => setFilter("vitals")}
            label="Vitals"
            icon={<Activity size={12} />}
            count={counts.vitals}
          />
        </div>
      </div>

      <div ref={containerRef} className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleLogs.map((log, index) => {
          const rowKey = `${log.timestamp}-${log.type}-${log.subType}-${index}`;
          const relativeMs = log.timestamp - sessionStartTimeMs;
          const relativeSeconds = (relativeMs / 1000).toFixed(1);
          const expanded = expandedKey === rowKey;
          const styling = getLogRowStyle(log);
          const isActive =
            Math.abs(relativeMs - currentVideoTimeMs) <= ACTIVE_LOG_THRESHOLD_MS;

          return (
            <div
              key={rowKey}
              className={`overflow-hidden rounded-lg border transition ${styling.container} ${
                isActive
                  ? "border-primary/40 bg-primary/10 ring-1 ring-primary/25"
                  : ""
              }`}
            >
              <button
                type="button"
                className={`flex w-full items-start gap-2.5 p-2 text-left ${
                  isActive ? "border-l-2 border-l-primary pl-[calc(0.5rem-2px)]" : ""
                }`}
                onClick={() => {
                  setExpandedKey(expanded ? null : rowKey);
                  onSeek?.(log.timestamp - sessionStartTimeMs);
                }}
              >
                <span className="mt-0.5 w-3 shrink-0 text-muted-foreground">
                  {expanded ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </span>

                <span className="w-11 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                  [{relativeSeconds}s]
                </span>

                <span className="mt-0.5 shrink-0">{renderIcon(log)}</span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {log.level && (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${styling.badge}`}>
                        {log.level}
                      </span>
                    )}
                    {log.type === "network" && isSlowNetwork(log) && (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
                        Slow
                      </span>
                    )}
                    <span className={`font-semibold ${styling.text}`}>
                      {log.message}
                    </span>
                  </div>

                  {log.type === "network" && (
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {formatNetworkSummary(log)}
                    </span>
                  )}
                </div>
              </button>

              {expanded && (
                <div className="border-t bg-muted/30 px-3 py-2">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[10px] leading-relaxed text-muted-foreground">
                    {formatInspectionBlock(log)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}

        {visibleLogs.length === 0 && (
          <div className="mt-20 text-center text-muted-foreground">
            {logs.length === 0
              ? "No telemetry captured for this session yet."
              : "No execution activity captured yet at this player timestamp."}
          </div>
        )}
      </div>

      <div className="border-t px-4 py-1.5 text-[10px] text-muted-foreground">
        Synced at {(currentVideoTimeMs / 1000).toFixed(1)}s •{" "}
        {visibleLogs.length} / {logs.length} entries
      </div>
    </div>
  );
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

function getLogRowStyle(log: LogItem) {
  if (isErrorLog(log)) {
    return {
      container: "border-destructive/30 bg-destructive/5",
      badge: "bg-destructive/15 text-destructive",
      text: "text-destructive",
    };
  }
  if (log.level === "warn" || isSlowNetwork(log)) {
    return {
      container: "border-amber-500/30 bg-amber-500/5",
      badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      text: "text-foreground",
    };
  }
  if (log.type === "action") {
    return {
      container: "border-sky-500/25 bg-sky-500/5",
      badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
      text: "text-foreground",
    };
  }
  return {
    container: "border-border/60 hover:bg-muted/40",
    badge: "bg-muted text-muted-foreground",
    text: "text-foreground",
  };
}

function renderIcon(log: LogItem) {
  if (log.type === "network") {
    return isErrorLog(log) ? (
      <AlertCircle size={14} className="text-destructive" />
    ) : (
      <CheckCircle size={14} className="text-emerald-500" />
    );
  }
  if (log.type === "vitals") {
    return <Activity size={14} className="text-violet-500" />;
  }
  if (log.type === "action") {
    return <MousePointerClick size={14} className="text-sky-500" />;
  }
  return (
    <Terminal
      size={14}
      className={
        log.level === "error"
          ? "text-destructive"
          : log.level === "warn"
            ? "text-amber-500"
            : "text-sky-500"
      }
    />
  );
}

function formatNetworkSummary(log: LogItem): string {
  const status = log.metadata.status ?? "?";
  const durationMs = log.metadata.durationMs ?? "?";
  const statusText =
    Number(status) >= 500
      ? `${status} Internal Error`
      : `${status} OK`;
  return `${statusText} • ${durationMs}ms`;
}

function formatInspectionBlock(log: LogItem): string {
  const payload: Record<string, unknown> = {
    type: log.type,
    subType: log.subType,
    level: log.level,
    message: log.message,
    timestamp: log.timestamp,
    ...log.metadata,
  };

  if (log.type === "action") {
    payload.event = "user_breadcrumb";
  }

  return JSON.stringify(payload, null, 2);
}

function FilterTab({
  active,
  onClick,
  label,
  icon,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {icon}
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
          active ? "bg-primary-foreground/20" : "bg-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
