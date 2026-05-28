"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Cell } from "recharts";

export interface MetricRow {
  event_name: string;
  total_count: number;
  avg_duration: number;
}

const volumeChartConfig = {
  total_count: {
    label: "Events",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const avgChartConfig = {
  avg_duration: {
    label: "Avg Metric",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface AnalyticsChartsProps {
  metrics: MetricRow[];
}

export function EventVolumeChart({ metrics }: AnalyticsChartsProps) {
  const chartData = useMemo(
    () =>
      metrics.map((row, index) => ({
        event_name: row.event_name,
        total_count: Number(row.total_count),
        fill: `var(--chart-${(index % 5) + 1})`,
      })),
    [metrics],
  );

  return (
    <ChartContainer config={volumeChartConfig} className="min-h-[280px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="event_name"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="total_count" radius={6}>
          {chartData.map((entry) => (
            <Cell key={entry.event_name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function AverageMetricChart({ metrics }: AnalyticsChartsProps) {
  const chartData = useMemo(
    () =>
      metrics.map((row) => ({
        event_name: row.event_name,
        avg_duration: Number(row.avg_duration),
      })),
    [metrics],
  );

  return (
    <ChartContainer config={avgChartConfig} className="min-h-[280px] w-full">
      <LineChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="event_name"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) =>
                typeof value === "number" ? value.toFixed(2) : value
              }
            />
          }
        />
        <Line
          type="monotone"
          dataKey="avg_duration"
          stroke="var(--color-avg_duration)"
          strokeWidth={2}
          dot={{ fill: "var(--color-avg_duration)", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
