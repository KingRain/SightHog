"use client";

import type { SessionPage } from "@/lib/session-pages";
import { cn } from "@/lib/utils";

interface SessionPageTabsProps {
  pages: SessionPage[];
  activeIndex: number;
  onSelect: (page: SessionPage) => void;
}

export default function SessionPageTabs({
  pages,
  activeIndex,
  onSelect,
}: SessionPageTabsProps) {
  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-end gap-0 border-b border-border/80">
      {pages.map((page, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={page.id}
            type="button"
            onClick={() => onSelect(page)}
            className={cn(
              "relative -mb-px rounded-t-lg border border-b-0 px-4 py-2.5 text-sm transition",
              active
                ? "z-10 border-border bg-card font-medium text-foreground shadow-sm"
                : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="mr-1.5 text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            {page.title}
          </button>
        );
      })}
    </div>
  );
}
