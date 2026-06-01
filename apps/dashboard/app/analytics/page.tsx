"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  Globe,
  Link2,
  MousePointer2,
  Radio,
  RefreshCw,
  TrendingDown,
  Users,
} from "lucide-react";
import type { AnalyticsOverview } from "@/app/api/analytics/overview/route";
import type { HeatmapResponse } from "@/app/api/analytics/heatmap/route";
import ClickHeatmap from "@/components/analytics/click-heatmap";
import { DonutBreakdown } from "@/components/analytics/donut-breakdown";
import WorldMap from "@/components/analytics/world-map";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  live,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  live?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        {live ? (
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
          </span>
        ) : (
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        )}
      </CardHeader>
      <CardContent>
        <p className="font-bold text-2xl tabular-nums tracking-tight">{value}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [overviewRes, heatmapRes] = await Promise.all([
        fetch("/api/analytics/overview", { cache: "no-store" }),
        fetch("/api/analytics/heatmap", { cache: "no-store" }),
      ]);
      if (!overviewRes.ok) {
        throw new Error("Failed to load analytics");
      }
      const json = (await overviewRes.json()) as AnalyticsOverview;
      setData(json);
      if (heatmapRes.ok) {
        setHeatmap((await heatmapRes.json()) as HeatmapResponse);
      } else {
        setHeatmap({ cells: [], maxClicks: 0, topUrl: null });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(true), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const bouncePct = data
    ? `${(data.bounceRate * 100).toFixed(1)}%`
    : "—";

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Web Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Visitors, geography, and environment — powered by ClickHouse
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))
        ) : (
          <>
            <MetricCard
              title="Total pageviews"
              value={data?.totalPageviews.toLocaleString() ?? "0"}
              description="All recorded pageview events"
              icon={Eye}
            />
            <MetricCard
              title="Unique visitors"
              value={data?.uniqueVisitors.toLocaleString() ?? "0"}
              description="HyperLogLog uniq(visitor_id)"
              icon={Users}
            />
            <MetricCard
              title="Bounce rate"
              value={bouncePct}
              description="Sessions with a single pageview"
              icon={TrendingDown}
            />
            <MetricCard
              title="Live active users"
              value={data?.liveActiveUsers.toLocaleString() ?? "0"}
              description="Active in the last 5 minutes"
              icon={Radio}
              live
            />
          </>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Card className="min-w-0 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              <CardTitle>Geographic distribution</CardTitle>
            </div>
            <CardDescription>
              Traffic intensity by ISO country code
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="aspect-[2/1] min-h-[480px] w-full" />
            ) : (
              <WorldMap data={data?.topCountries ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top countries</CardTitle>
            <CardDescription>By pageview count</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (data?.topCountries.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">
                No country data yet. Run the demo or add a GeoLite2 database.
              </p>
            ) : (
              <ul className="space-y-2">
                {data?.topCountries.map((row) => (
                  <li
                    key={row.country}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="font-medium">{row.country}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {row.visits.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MousePointer2 className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Click heatmap</CardTitle>
          </div>
          <CardDescription>
            Aggregated pointer positions from session interactions (40px bins)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="aspect-[3/2] w-full" />
          ) : (
            <ClickHeatmap
              cells={heatmap?.cells ?? []}
              maxClicks={heatmap?.maxClicks ?? 0}
            />
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top browsers</CardTitle>
            <CardDescription>From parsed User-Agent at ingest</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <DonutBreakdown
                title=""
                rows={data?.topBrowsers ?? []}
                emptyLabel="No browser breakdown yet"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top operating systems</CardTitle>
            <CardDescription>Environment mix across sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <DonutBreakdown
                title=""
                rows={data?.topOs ?? []}
                emptyLabel="No OS breakdown yet"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Top referring domains</CardTitle>
          </div>
          <CardDescription>
            document.referrer captured on SDK init
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[160px] w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.topReferrers.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No referrer data yet
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.topReferrers.map((row) => (
                    <TableRow key={row.source}>
                      <TableCell className="font-medium">{row.source}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.visits.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
