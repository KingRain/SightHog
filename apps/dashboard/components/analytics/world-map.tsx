"use client";

import { memo, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

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
    <div className="h-full min-h-[320px] w-full">
      <ComposableMap
        projection="geoEqualEarth"
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup center={[0, 20]} zoom={1}>
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
                      visits > 0
                        ? colorForIntensity(ratio)
                        : "var(--muted)"
                    }
                    stroke="var(--border)"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: visits > 0 ? "rgba(79, 70, 229, 0.9)" : "var(--accent)",
                        outline: "none",
                        cursor: visits > 0 ? "pointer" : "default",
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}

export default memo(WorldMap);
