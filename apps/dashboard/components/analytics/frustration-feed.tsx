"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  FrustrationSeriesPoint,
  FrustrationUrlRow,
} from "@/app/api/analytics/frustration/route";

const chartConfig = {
  count: {
    label: "Frustration events",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

interface FrustrationFeedProps {
  series: FrustrationSeriesPoint[];
  topUrls: FrustrationUrlRow[];
}

export function FrustrationFeed({ series, topUrls }: FrustrationFeedProps) {
  const chartData = series.map((point) => ({
    minute: point.minute.slice(11, 16) || point.minute,
    count: point.count,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-muted-foreground text-xs">
          Frustration events per minute (rage, dead, error clicks)
        </p>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-sm">
            No frustration signals yet. Rapid-click a demo button 5+ times to test rage detection.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[220px] w-full">
            <LineChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="minute"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                fontSize={10}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--destructive)"
                strokeWidth={2}
                dot={{ r: 2, fill: "var(--destructive)" }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </div>

      <div>
        <p className="mb-2 text-muted-foreground text-xs">
          Top URLs by frustration volume
        </p>
        {topUrls.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-sm">
            URL breakdown appears after frustration events are ingested.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Rage</TableHead>
                <TableHead className="text-right">Dead</TableHead>
                <TableHead className="text-right">Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUrls.map((row) => (
                <TableRow key={row.url}>
                  <TableCell className="max-w-[200px] truncate font-mono text-xs">
                    {row.url}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.rage_clicks > 0 ? (
                      <Badge variant="destructive">{row.rage_clicks}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.dead_clicks}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.error_clicks}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
