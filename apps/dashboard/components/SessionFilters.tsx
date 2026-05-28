"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SessionFilterState {
  q: string;
  country: string;
  hasError: boolean;
  hasRage: boolean;
}

interface SessionFiltersProps {
  value: SessionFilterState;
  onChange: (next: SessionFilterState) => void;
}

export default function SessionFilters({ value, onChange }: SessionFiltersProps) {
  const hasActive =
    value.q || value.country || value.hasError || value.hasRage;

  return (
    <div className="flex flex-col gap-3 border-b pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search URL or session ID…"
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
            className="pl-8"
          />
        </div>
        <Input
          placeholder="Country (e.g. US)"
          value={value.country}
          onChange={(e) =>
            onChange({ ...value, country: e.target.value.toUpperCase() })
          }
          className="w-28 font-mono text-xs uppercase"
        />
        <Button
          type="button"
          variant={value.hasError ? "default" : "outline"}
          size="sm"
          onClick={() =>
            onChange({ ...value, hasError: !value.hasError })
          }
        >
          Errors
        </Button>
        <Button
          type="button"
          variant={value.hasRage ? "default" : "outline"}
          size="sm"
          onClick={() => onChange({ ...value, hasRage: !value.hasRage })}
        >
          Rage clicks
        </Button>
        {hasActive && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({ q: "", country: "", hasError: false, hasRage: false })
            }
          >
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
