"use client";

import { memo, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  data: { country: string; visits: number }[];
}

function maxVisits(data: WorldMapProps["data"]): number {
  return Math.max(1, ...data.map((d) => d.visits));
}

function colorForIntensity(ratio: number): string {
  const alpha = 0.15 + ratio * 0.75;
  return `rgba(79, 70, 229, ${alpha})`;
}

function WorldMap({ data }: WorldMapProps) {
  const byCode = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of data) {
      map.set(row.country.toUpperCase(), row.visits);
    }
    return map;
  }, [data]);

  const peak = maxVisits(data);

  return (
    <div className="pointer-events-none aspect-[2/1] min-h-[480px] w-full overflow-hidden">
      <ComposableMap
        projection="geoEqualEarth"
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const props = geo.properties as {
                iso_a2?: string;
                ISO_A2?: string;
              };
              const iso = (props.iso_a2 ?? props.ISO_A2 ?? "").toUpperCase();
              const visits = byCode.get(iso) ?? 0;
              const ratio = visits / peak;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={
                    visits > 0 ? colorForIntensity(ratio) : "var(--muted)"
                  }
                  stroke="var(--border)"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "var(--muted)" },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}

export default memo(WorldMap);
