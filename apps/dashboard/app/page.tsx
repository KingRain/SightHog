"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Layers,
  PieChart,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { FunnelChart } from "@/components/analytics/funnel-chart";
import { FrustrationFeed } from "@/components/analytics/frustration-feed";
import {
  AverageMetricChart,
  EventDistributionChart,
  EventVolumeChart,
} from "@/components/analytics/metrics-charts";
import type { FunnelStepResult } from "@/app/api/analytics/funnel/route";
import type {
  FrustrationSeriesPoint,
  FrustrationUrlRow,
} from "@/app/api/analytics/frustration/route";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SessionReplayWorkspace from "@/components/SessionReplayWorkspace";
import type { SessionMeta } from "@/components/SessionClientHeader";
import { type LogItem } from "@/components/TechTimeline";
import {
  buildTimelineMarkersFromLogs,
  type TimelineMarker,
} from "@/lib/session-markers";
import { buildUnifiedTimelineLogs } from "@/lib/timeline-feed";
import { getSessionStartTimeMs } from "@/lib/replay";
import type { SessionInteraction } from "@/app/api/session/[id]/interactions/route";

interface MetricRow {
  event_name: string;
  total_count: number;
  avg_duration: number;
}

interface SessionRow {
  id: string;
  user_id: string | null;
  initial_url: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionEvents, setSessionEvents] = useState<unknown[]>([]);
  const [telemetryLogs, setTelemetryLogs] = useState<LogItem[]>([]);
  const [timelineMarkers, setTimelineMarkers] = useState<TimelineMarker[]>([]);
  const [sessionMeta, setSessionMeta] = useState<SessionMeta | null>(null);
  const [currentVideoTimeMs, setCurrentVideoTimeMs] = useState(0);
  const [sessionStartTimeMs, setSessionStartTimeMs] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [loadingReplay, setLoadingReplay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funnelSteps, setFunnelSteps] = useState<FunnelStepResult[]>([]);
  const [frustrationSeries, setFrustrationSeries] = useState<
    FrustrationSeriesPoint[]
  >([]);
  const [frustrationUrls, setFrustrationUrls] = useState<FrustrationUrlRow[]>(
    []
  );
  const seekToTimeRef = useRef<(timeMs: number) => void>(() => {});

  const demoUrl = process.env.NEXT_PUBLIC_DEMO_URL ?? "http://localhost:3001";

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingData(true);
    }
    setError(null);

    try {
      const [metricsRes, sessionsRes, funnelRes, frustrationRes] =
        await Promise.all([
          fetch("/api/metrics"),
          fetch("/api/sessions"),
          fetch("/api/analytics/funnel"),
          fetch("/api/analytics/frustration"),
        ]);

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      } else {
        throw new Error("Failed to load metrics");
      }

      if (sessionsRes.ok) {
        setSessions(await sessionsRes.json());
      } else {
        throw new Error("Failed to load sessions");
      }

      if (funnelRes.ok) {
        const funnelData = await funnelRes.json();
        setFunnelSteps(funnelData.steps ?? []);
      } else {
        setFunnelSteps([]);
      }

      if (frustrationRes.ok) {
        const frustrationData = await frustrationRes.json();
        setFrustrationSeries(frustrationData.series ?? []);
        setFrustrationUrls(frustrationData.topUrls ?? []);
      } else {
        setFrustrationSeries([]);
        setFrustrationUrls([]);
      }
    } catch {
      setError("Failed to load dashboard data. Check that Postgres and ClickHouse are running.");
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const registerSeek = useCallback((seek: (timeMs: number) => void) => {
    seekToTimeRef.current = seek;
  }, []);

  const clearAllSessions = async () => {
    if (
      !window.confirm(
        "Delete all sessions, metrics, telemetry, and replay files? This cannot be undone."
      )
    ) {
      return;
    }
    setClearing(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions/clear", { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Clear failed");
      }
      setSelectedSession(null);
      setSessionEvents([]);
      setTelemetryLogs([]);
      setTimelineMarkers([]);
      setSessionMeta(null);
      setFunnelSteps([]);
      setFrustrationSeries([]);
      setFrustrationUrls([]);
      await loadDashboardData(true);
    } catch {
      setError("Failed to clear session data.");
    } finally {
      setClearing(false);
    }
  };

  const loadSessionReplay = async (sessionId: string) => {
    setLoadingReplay(true);
    setError(null);
    setSelectedSession(sessionId);
    setCurrentVideoTimeMs(0);
    setTelemetryLogs([]);
    setTimelineMarkers([]);
    setSessionMeta(null);

    try {
      const [replayRes, telemetryRes, interactionsRes, metaRes] =
        await Promise.all([
          fetch(`/api/session/${sessionId}`),
          fetch(`/api/session/${sessionId}/telemetry`),
          fetch(`/api/session/${sessionId}/interactions`),
          fetch(`/api/session/${sessionId}/meta`),
        ]);

      if (!replayRes.ok) {
        throw new Error("Session replay not found");
      }

      const data = await replayRes.json();
      const events = data.events ?? [];
      if (events.length === 0) {
        throw new Error("Session replay not found");
      }
      if (data.hasFullSnapshot === false) {
        setError(
          "Replay is incomplete (missing DOM snapshot). Use the demo checkout, wait ~30s for flush, then retry.",
        );
      }
      setSessionEvents(events);
      setSessionStartTimeMs(getSessionStartTimeMs(events));

      const rawLogs: LogItem[] = telemetryRes.ok
        ? ((await telemetryRes.json()).logs ?? [])
        : [];

      const interactions: SessionInteraction[] = interactionsRes.ok
        ? ((await interactionsRes.json()).interactions ?? [])
        : [];

      const unifiedLogs = buildUnifiedTimelineLogs(interactions, rawLogs);
      setTelemetryLogs(unifiedLogs);
      setTimelineMarkers(buildTimelineMarkersFromLogs(unifiedLogs));

      if (metaRes.ok) {
        setSessionMeta(await metaRes.json());
      } else {
        const fallback = sessions.find((s) => s.id === sessionId);
        if (fallback) {
          setSessionMeta({
            id: fallback.id,
            user_id: fallback.user_id,
            initial_url: fallback.initial_url,
            user_agent: null,
            client_ip: null,
            created_at: fallback.created_at,
          });
        }
      }
    } catch {
      setError(
        "Could not load session replay. Try again after the blob worker flushes (~30s).",
      );
      setSessionEvents([]);
      setTelemetryLogs([]);
      setTimelineMarkers([]);
      setSessionMeta(null);
    } finally {
      setLoadingReplay(false);
    }
  };

  const totalEvents = metrics.reduce(
    (sum, row) => sum + Number(row.total_count),
    0,
  );

  const statCards = [
    {
      title: "Total Events",
      value: totalEvents.toLocaleString(),
      description: "Tracked across all event types",
      icon: Activity,
    },
    {
      title: "Stored Sessions",
      value: sessions.length.toLocaleString(),
      description: "Recorded in Postgres metadata",
      icon: Users,
    },
    {
      title: "Event Types",
      value: metrics.length.toLocaleString(),
      description: "Distinct metrics in ClickHouse",
      icon: Layers,
    },
  ];

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">Live</Badge>
              <Badge variant="outline">ClickHouse OLAP</Badge>
              <Badge variant="outline">SeaweedFS Replays</Badge>
            </div>
            <div>
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                SightHog Control Center
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground text-sm sm:text-base">
                Real-time telemetry analytics and spatial session replays from
                your distributed ingestion pipeline.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              size="default"
              loading={refreshing}
              onClick={() => void loadDashboardData(true)}
            >
              <RefreshCw />
              Refresh Data
            </Button>
            <Button
              render={
                <a href={demoUrl} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  Open Demo Checkout
                </a>
              }
            />
          </div>
        </header>

        {error && (
          <Alert variant="error" className="mb-6">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardDescription>{stat.title}</CardDescription>
                    {loadingData ? (
                      <Skeleton className="mt-3 h-9 w-24" />
                    ) : (
                      <CardTitle className="mt-2 text-3xl tabular-nums">
                        {stat.value}
                      </CardTitle>
                    )}
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-2.5 text-muted-foreground">
                    <stat.icon className="size-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-muted-foreground" />
                <CardTitle>Event Volume</CardTitle>
              </div>
              <CardDescription>
                Event counts grouped by name from ClickHouse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="min-h-[280px] w-full" />
              ) : metrics.length === 0 ? (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <BarChart3 />
                    </EmptyMedia>
                    <EmptyTitle>No metrics yet</EmptyTitle>
                    <EmptyDescription>
                      Interact with the demo checkout to generate telemetry.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <EventVolumeChart metrics={metrics} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="size-5 text-muted-foreground" />
                <CardTitle>Average Metric Value</CardTitle>
              </div>
              <CardDescription>
                Mean metric_value per event type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="min-h-[280px] w-full" />
              ) : metrics.length === 0 ? (
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Activity />
                    </EmptyMedia>
                    <EmptyTitle>No averages yet</EmptyTitle>
                    <EmptyDescription>
                      Metrics appear after events are processed by workers.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <AverageMetricChart metrics={metrics} />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="size-5 text-muted-foreground" />
                <CardTitle>Conversion Funnel</CardTitle>
              </div>
              <CardDescription>
                windowFunnel() across product → cart → checkout → payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="min-h-[240px] w-full" />
              ) : (
                <FunnelChart steps={funnelSteps} />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 xl:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <PieChart className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Event Distribution</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Share of total events by type
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pt-0">
              {loadingData ? (
                <Skeleton className="size-[200px] rounded-full" />
              ) : metrics.length === 0 ? (
                <Empty className="py-6">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <PieChart />
                    </EmptyMedia>
                    <EmptyTitle>No distribution data</EmptyTitle>
                    <EmptyDescription>
                      Generate events from the demo to see the breakdown.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <EventDistributionChart metrics={metrics} />
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Flame className="size-5 text-destructive" />
                <CardTitle>Frustration Feed</CardTitle>
              </div>
              <CardDescription>
                Rage, dead, and error clicks detected by the SDK — ingested via
                Kafka into ClickHouse
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="min-h-[280px] w-full" />
              ) : (
                <FrustrationFeed
                  series={frustrationSeries}
                  topUrls={frustrationUrls}
                />
              )}
            </CardContent>
          </Card>
        </section>

        <Separator className="mb-8" />

        <section>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Recent Sessions</CardTitle>
                  <CardDescription>
                    One row per browser tab. Navigating the demo store does not
                    create a new session when the SDK session id is reused.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!selectedSession && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={refreshing}
                        onClick={() => void loadDashboardData(true)}
                      >
                        <RefreshCw />
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={clearing}
                        onClick={() => void clearAllSessions()}
                      >
                        <Trash2 />
                        Clear all sessions
                      </Button>
                    </>
                  )}
                {selectedSession && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSession(null);
                      setSessionEvents([]);
                      setTelemetryLogs([]);
                      setTimelineMarkers([]);
                      setSessionMeta(null);
                      setCurrentVideoTimeMs(0);
                      setSessionStartTimeMs(0);
                    }}
                  >
                    <ArrowLeft />
                    Back to List
                  </Button>
                )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {selectedSession ? (
                <div className="space-y-4">
                  {loadingReplay ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full rounded-xl" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                        <Skeleton className="h-[420px] w-full rounded-xl" />
                        <Skeleton className="h-[520px] w-full rounded-xl" />
                      </div>
                    </div>
                  ) : sessionMeta ? (
                    <SessionReplayWorkspace
                      sessionMeta={sessionMeta}
                      events={sessionEvents}
                      logs={telemetryLogs}
                      timelineMarkers={timelineMarkers}
                      currentVideoTimeMs={currentVideoTimeMs}
                      sessionStartTimeMs={sessionStartTimeMs}
                      onTimeUpdate={setCurrentVideoTimeMs}
                      onSessionStartTime={setSessionStartTimeMs}
                      registerSeek={registerSeek}
                    />
                  ) : null}
                </div>
              ) : loadingData ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Eye />
                    </EmptyMedia>
                    <EmptyTitle>No sessions recorded</EmptyTitle>
                    <EmptyDescription>
                      Open the{" "}
                      <a href={demoUrl} target="_blank" rel="noreferrer">
                        demo checkout
                      </a>{" "}
                      and interact with the form. Sessions appear after the
                      metadata worker processes events.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table variant="card">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[220px]">Session ID</TableHead>
                      <TableHead className="min-w-[180px]">URL</TableHead>
                      <TableHead className="hidden min-w-[160px] md:table-cell">
                        Updated
                      </TableHead>
                      <TableHead className="w-[140px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <code className="block max-w-[220px] truncate font-mono text-xs text-foreground sm:max-w-none">
                            {session.id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="block max-w-[180px] truncate text-foreground sm:max-w-[280px]">
                            {session.initial_url}
                          </span>
                          <span className="mt-1 text-muted-foreground text-xs md:hidden">
                            {new Date(session.updated_at).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {new Date(session.updated_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void loadSessionReplay(session.id)}
                          >
                            <Eye />
                            Watch
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
