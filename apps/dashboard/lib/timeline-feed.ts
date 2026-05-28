import type { LogItem, LogLevel } from "@/components/TechTimeline";
import type { SessionInteraction } from "@/lib/session-markers";

const SLOW_NETWORK_MS = 800;

function formatActionMessage(interaction: SessionInteraction): string {
  if (interaction.type === "rage_click") {
    return `Rage click on ${interaction.target || "element"}`;
  }
  if (interaction.type === "dead_click") {
    return `Dead click on ${interaction.target || "element"}`;
  }
  if (interaction.type === "error_click") {
    return `Error click on ${interaction.target || "element"}`;
  }
  if (interaction.type === "click") {
    const target = interaction.target || "element";
    return `Clicked ${target}`;
  }
  if (interaction.type === "scroll") {
    return `Scrolled to (${interaction.x}, ${interaction.y})`;
  }
  return `${interaction.type} on ${interaction.target || "page"}`;
}

function interactionToLog(interaction: SessionInteraction): LogItem {
  const frustration =
    interaction.type === "rage_click" ||
    interaction.type === "dead_click" ||
    interaction.type === "error_click";
  const level: LogLevel =
    interaction.type === "rage_click" || interaction.type === "error_click"
      ? "error"
      : interaction.type === "dead_click"
        ? "warn"
        : "info";

  return {
    type: "action",
    subType: interaction.type,
    level: frustration ? level : "info",
    message: formatActionMessage(interaction),
    timestamp: interaction.timestamp,
    metadata: {
      x: interaction.x,
      y: interaction.y,
      target: interaction.target,
    },
  };
}

function telemetryToLog(entry: LogItem): LogItem {
  if (entry.type !== "network") {
    return entry;
  }

  const durationMs = Number(entry.metadata.durationMs ?? 0);
  const status = Number(entry.metadata.status ?? 0);
  const slow = durationMs >= SLOW_NETWORK_MS;
  const serverError = status >= 500 || entry.subType === "fetch_error";
  const level: LogLevel = serverError ? "error" : slow ? "warn" : "info";

  return {
    ...entry,
    level,
    metadata: {
      ...entry.metadata,
      slow,
      bottleneck: slow,
    },
  };
}

export function buildUnifiedTimelineLogs(
  interactions: SessionInteraction[],
  telemetry: LogItem[]
): LogItem[] {
  const actionLogs = interactions
    .filter((item) => item.type !== "pageview")
    .map(interactionToLog);

  const enrichedTelemetry = telemetry.map((entry): LogItem => {
    if (entry.type === "console") {
      const level: LogLevel =
        entry.subType === "error"
          ? "error"
          : entry.subType === "warn"
            ? "warn"
            : "info";
      return { ...entry, level };
    }
    return telemetryToLog(entry);
  });

  return [...actionLogs, ...enrichedTelemetry].sort(
    (a, b) => a.timestamp - b.timestamp
  );
}

export { SLOW_NETWORK_MS };
