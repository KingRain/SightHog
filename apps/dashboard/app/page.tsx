"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Layers,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { FunnelChart } from "@/components/analytics/funnel-chart";
import { FrustrationFeed } from "@/components/analytics/frustration-feed";
import { EventVolumeChart } from "@/components/analytics/metrics-charts";
import type { FunnelStepResult } from "@/app/api/analytics/funnel/route";
import type {
  FrustrationSeriesPoint,
  FrustrationUrlRow,
} from "@/app/api/analytics/frustration/route";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SessionFilters, {
  type SessionFilterState,
} from "@/components/SessionFilters";
import { CountUp } from "@/components/unlumen/count-up";
import { GlowingBadge } from "@/components/unlumen/glowing-badge";
import { Kbd } from "@/components/unlumen/kbd";
import { ShimmerSkeleton } from "@/components/unlumen/shimmer-skeleton";
import SessionReplayWorkspace from "@/components/SessionReplayWorkspace";
import SessionTriageBadges from "@/components/SessionTriageBadges";
import type { SessionListRow } from "@/app/api/sessions/route";
import { fetchReplayEvents, waitForReplayReady } from "@/lib/fetch-replay";
import { type LogItem } from "@/components/TechTimeline";
import { buildTimelineMarkersFromLogs } from "@/lib/session-markers";
import { buildUnifiedTimelineLogs } from "@/lib/timeline-feed";
import { cloneReplayEvents, getSessionStartTimeMs } from "@/lib/replay";
import type { SessionInteraction } from "@/app/api/session/[id]/interactions/route";
import { useAppDispatch, useAppSelector } from "@/store";
import { resetReplay, setSessionStartTimeMs } from "@/store/replaySlice";
import {
  clearSessionView,
  setLoadingReplay,
  setReplayProcessing,
  setReplayWaitAttempt,
  setSelectedSessionId,
  setSessionEvents,
  setSessionMeta,
  setTelemetryLogs,
  setTimelineMarkers,
} from "@/store/sessionSlice";

interface MetricRow {
  event_name: string;
  total_count: number;
  avg_duration: number;
}

const defaultFilters: SessionFilterState = {
  q: "",
  country: "",
  hasError: false,
  hasRage: false,
};

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const selectedSession = useAppSelector((s) => s.session.selectedSessionId);
  const sessionMeta = useAppSelector((s) => s.session.sessionMeta);
  const loadingReplay = useAppSelector((s) => s.session.loadingReplay);
  const replayProcessing = useAppSelector((s) => s.session.replayProcessing);
  const replayWaitAttempt = useAppSelector((s) => s.session.replayWaitAttempt);

  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [sessions, setSessions] = useState<SessionListRow[]>([]);
  const [sessionFilters, setSessionFilters] =
    useState<SessionFilterState>(defaultFilters);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funnelSteps, setFunnelSteps] = useState<FunnelStepResult[]>([]);
  const [frustrationSeries, setFrustrationSeries] = useState<
    FrustrationSeriesPoint[]
  >([]);
  const [frustrationUrls, setFrustrationUrls] = useState<FrustrationUrlRow[]>(
    []
  );
  const demoUrl = process.env.NEXT_PUBLIC_DEMO_URL ?? "http://localhost:3001";

  const buildSessionsUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (sessionFilters.q) params.set("q", sessionFilters.q);
    if (sessionFilters.country) params.set("country", sessionFilters.country);
    if (sessionFilters.hasError) params.set("hasError", "true");
    if (sessionFilters.hasRage) params.set("hasRage", "true");
    const qs = params.toString();
    return qs ? `/api/sessions?${qs}` : "/api/sessions";
  }, [sessionFilters]);

  const loadSessions = useCallback(async () => {
    const res = await fetch(buildSessionsUrl());
    if (res.ok) {
      setSessions(await res.json());
    }
  }, [buildSessionsUrl]);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingData(true);
    }
    setError(null);

    try {
      const [metricsRes, funnelRes, frustrationRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/analytics/funnel"),
        fetch("/api/analytics/frustration"),
      ]);

      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      } else {
        throw new Error("Failed to load metrics");
      }

      await loadSessions();

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
  }, [loadSessions]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSessions();
    }, 350);
    return () => clearTimeout(timer);
  }, [sessionFilters, loadSessions]);

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
      dispatch(clearSessionView());
      dispatch(resetReplay());
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
    dispatch(setLoadingReplay(true));
    dispatch(setReplayProcessing(true));
    dispatch(setReplayWaitAttempt(0));
    setError(null);
    dispatch(setSelectedSessionId(sessionId));
    dispatch(resetReplay());
    dispatch(setTelemetryLogs([]));
    dispatch(setTimelineMarkers([]));
    dispatch(setSessionMeta(null));

    try {
      await waitForReplayReady(sessionId, (attempt) =>
        dispatch(setReplayWaitAttempt(attempt))
      );
      dispatch(setReplayProcessing(false));

      const [data, telemetryRes, interactionsRes, metaRes] = await Promise.all([
        fetchReplayEvents(sessionId),
        fetch(`/api/session/${sessionId}/telemetry`),
        fetch(`/api/session/${sessionId}/interactions`),
        fetch(`/api/session/${sessionId}/meta`),
      ]);

      const events = data.events ?? [];
      if (events.length === 0) {
        throw new Error("Session replay not found");
      }
      if (data.hasFullSnapshot === false) {
        setError(
          "Replay is incomplete (missing DOM snapshot). Interact with the demo checkout again, wait ~30s for the blob worker to flush, then refresh and retry.",
        );
      }
      dispatch(setSessionEvents(cloneReplayEvents(events)));
      dispatch(setSessionStartTimeMs(getSessionStartTimeMs(events)));

      const rawLogs: LogItem[] = telemetryRes.ok
        ? ((await telemetryRes.json()).logs ?? [])
        : [];

      const interactions: SessionInteraction[] = interactionsRes.ok
        ? ((await interactionsRes.json()).interactions ?? [])
        : [];

      const unifiedLogs = buildUnifiedTimelineLogs(interactions, rawLogs);
      dispatch(setTelemetryLogs(unifiedLogs));
      dispatch(
        setTimelineMarkers(buildTimelineMarkersFromLogs(unifiedLogs))
      );

      if (metaRes.ok) {
        dispatch(setSessionMeta(await metaRes.json()));
      } else {
        const fallback = sessions.find((s) => s.id === sessionId);
        if (fallback) {
          dispatch(setSessionMeta({
            id: fallback.id,
            user_id: fallback.user_id,
            initial_url: fallback.initial_url,
            user_agent: null,
            client_ip: null,
            country: fallback.country,
            browser: fallback.browser,
            os: fallback.os,
            created_at: fallback.created_at,
          }));
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load session replay. Try again shortly.",
      );
      dispatch(setSessionEvents([]));
      dispatch(setTelemetryLogs([]));
      dispatch(setTimelineMarkers([]));
      dispatch(setSessionMeta(null));
    } finally {
      dispatch(setLoadingReplay(false));
      dispatch(setReplayProcessing(false));
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
              <GlowingBadge variant="success" pulse>
                Live
              </GlowingBadge>
              <GlowingBadge variant="neutral" pulse={false}>
                ClickHouse OLAP
              </GlowingBadge>
              <GlowingBadge variant="neutral" pulse={false}>
                SeaweedFS Replays
              </GlowingBadge>
              <span className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:inline-flex">
                <Kbd size="sm">R</Kbd>
                <span>refresh</span>
                <span aria-hidden className="mx-0.5 text-muted-foreground/40">·</span>
                <Kbd size="sm">/</Kbd>
                <span>search</span>
              </span>
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
          {statCards.map((stat) => {
            const numericValue = Number(
              stat.value.replace(/[^0-9.\-]/g, ""),
            );
            const hasNumeric = !Number.isNaN(numericValue) && numericValue > 0;
            return (
              <Card key={stat.title}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardDescription>{stat.title}</CardDescription>
                      {loadingData ? (
                        <ShimmerSkeleton className="mt-3 h-9 w-24" />
                      ) : (
                        <CardTitle className="mt-2 text-3xl tabular-nums">
                          {hasNumeric ? (
                            <CountUp
                              to={numericValue}
                              from={0}
                              duration={1.2}
                              separator=","
                              decimals={0}
                            />
                          ) : (
                            stat.value
                          )}
                        </CardTitle>
                      )}
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-2.5 text-muted-foreground">
                      <stat.icon className="size-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                <ShimmerSkeleton className="min-h-[280px] w-full" />
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
                <Filter className="size-5 text-muted-foreground" />
                <CardTitle>Conversion Funnel</CardTitle>
              </div>
              <CardDescription>
                windowFunnel() across product → cart → checkout → payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <ShimmerSkeleton className="min-h-[240px] w-full" />
              ) : (
                <FunnelChart steps={funnelSteps} />
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
                <ShimmerSkeleton className="min-h-[280px] w-full" />
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
                      dispatch(clearSessionView());
                      dispatch(resetReplay());
                    }}
                  >
                    <ArrowLeft />
                    Back to List
                  </Button>
                )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="min-h-0 overflow-hidden">
              {selectedSession ? (
                <div className="min-h-0 space-y-4 overflow-hidden">
                  {replayProcessing && (
                    <Alert>
                      <AlertTitle>Processing replay</AlertTitle>
                      <AlertDescription>
                        Waiting for blob worker to flush recording to storage
                        {replayWaitAttempt > 0
                          ? ` (attempt ${replayWaitAttempt})…`
                          : "…"}
                      </AlertDescription>
                    </Alert>
                  )}
                  {loadingReplay ? (
                    <div className="space-y-3">
                      <ShimmerSkeleton className="h-16 w-full rounded-xl" />
                      <ShimmerSkeleton className="h-10 w-full rounded-lg" />
                      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
                        <ShimmerSkeleton className="h-[420px] w-full rounded-xl" />
                        <ShimmerSkeleton className="h-[520px] w-full rounded-xl" />
                      </div>
                    </div>
                  ) : sessionMeta ? (
                    <SessionReplayWorkspace />
                  ) : null}
                </div>
              ) : loadingData ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <ShimmerSkeleton key={index} className="h-12 w-full" />
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
                <div className="space-y-4">
                  <SessionFilters
                    value={sessionFilters}
                    onChange={setSessionFilters}
                  />
                  <Table variant="card">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Session</TableHead>
                        <TableHead className="min-w-[160px]">URL</TableHead>
                        <TableHead className="min-w-[120px]">Signals</TableHead>
                        <TableHead className="hidden min-w-[140px] md:table-cell">
                          Updated
                        </TableHead>
                        <TableHead className="w-[120px] text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <code className="block max-w-[200px] truncate font-mono text-xs text-foreground">
                              {session.id.slice(0, 8)}…
                            </code>
                            {session.country && (
                              <span className="mt-1 block text-muted-foreground text-xs">
                                {session.country}
                                {session.browser ? ` · ${session.browser}` : ""}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="block max-w-[180px] truncate text-foreground sm:max-w-[260px]">
                              {session.initial_url}
                            </span>
                          </TableCell>
                          <TableCell>
                            <SessionTriageBadges triage={session.triage} />
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground text-xs md:table-cell">
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
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
