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
    <div
      role="tablist"
      className="flex flex-wrap items-center gap-1 border-b border-border/80 pb-0"
    >
      {pages.map((page, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={page.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(page)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-t-md px-3 py-1.5 text-sm transition",
              "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition",
              active
                ? "bg-muted/60 font-medium text-foreground after:bg-primary"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground after:bg-transparent"
            )}
          >
            <span
              className={cn(
                "inline-flex size-5 items-center justify-center rounded-full text-[10px] tabular-nums",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </span>
            <span className="max-w-[180px] truncate" title={page.title}>
              {page.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
