"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

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

function buildDistributionConfig(metrics: MetricRow[]): ChartConfig {
  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];

  return metrics.reduce<ChartConfig>((config, row, index) => {
    config[row.event_name] = {
      label: row.event_name,
      color: palette[index % palette.length],
    };
    return config;
  }, {});
}

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

export function EventDistributionChart({ metrics }: AnalyticsChartsProps) {
  const chartConfig = useMemo(
    () => buildDistributionConfig(metrics),
    [metrics],
  );

  const chartData = useMemo(
    () =>
      metrics.map((row) => ({
        event_name: row.event_name,
        total_count: Number(row.total_count),
        fill: `var(--color-${row.event_name})`,
      })),
    [metrics],
  );

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[200px] w-full max-w-[220px]">
      <PieChart accessibilityLayer>
        <ChartTooltip content={<ChartTooltipContent nameKey="event_name" />} />
        <Pie
          data={chartData}
          dataKey="total_count"
          nameKey="event_name"
          innerRadius={42}
          outerRadius={68}
          paddingAngle={3}
          strokeWidth={2}
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="event_name" />}
          className="flex-wrap gap-2 text-[11px]"
        />
      </PieChart>
    </ChartContainer>
  );
}
