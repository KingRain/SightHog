"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface DonutBreakdownProps {
  title: string;
  rows: { name: string; count: number }[];
  emptyLabel?: string;
}

export function DonutBreakdown({
  title,
  rows,
  emptyLabel = "No data yet",
}: DonutBreakdownProps) {
  const chartConfig = useMemo(() => {
    return rows.reduce<ChartConfig>((config, row, index) => {
      const key = `slice_${index}`;
      config[key] = {
        label: row.name,
        color: PALETTE[index % PALETTE.length],
      };
      return config;
    }, {});
  }, [rows]);

  const chartData = useMemo(
    () =>
      rows.map((row, index) => ({
        sliceKey: `slice_${index}`,
        name: row.name,
        count: row.count,
        fill: PALETTE[index % PALETTE.length],
      })),
    [rows]
  );

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center text-muted-foreground text-sm">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div>
      {title ? (
        <p className="mb-2 font-medium text-foreground text-sm">{title}</p>
      ) : null}
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[220px] w-full"
      >
        <PieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.sliceKey} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            className="flex-wrap gap-1 text-[10px]"
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
}
