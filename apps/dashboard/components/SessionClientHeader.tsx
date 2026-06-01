"use client";

import { Globe, User, type LucideIcon } from "lucide-react";
import { parseUserAgent } from "@/lib/parse-user-agent";
import { cn } from "@/lib/utils";

export interface SessionMeta {
  id: string;
  user_id: string | null;
  initial_url: string;
  user_agent: string | null;
  client_ip: string | null;
  country?: string | null;
  visitor_id?: string | null;
  browser?: string | null;
  os?: string | null;
  referrer?: string | null;
  created_at: string;
}

interface SessionClientHeaderProps {
  meta: SessionMeta;
  className?: string;
}

function formatSessionTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function displayName(meta: SessionMeta): string {
  if (meta.user_id) {
    const short = meta.user_id.slice(0, 8);
    return `User ${short}`;
  }
  return "Anonymous visitor";
}

interface MetaItem {
  icon?: LucideIcon;
  label: string;
  key: string;
  className?: string;
}

export default function SessionClientHeader({
  meta,
  className,
}: SessionClientHeaderProps) {
  const parsed = parseUserAgent(meta.user_agent);
  const browser = meta.browser ?? parsed.browser;
  const os = meta.os ?? parsed.os;
  const location =
    meta.country && meta.country !== "Unknown"
      ? meta.country
      : meta.client_ip
        ? meta.client_ip
        : "Local / unknown";

  const metaItems: MetaItem[] = [
    { key: "time", label: formatSessionTime(meta.created_at) },
    { key: "location", label: location, icon: Globe },
    { key: "browser", label: browser },
    { key: "os", label: os },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2",
        className
      )}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center self-center rounded-full bg-primary/15 text-primary"
        aria-hidden
      >
        <User className="size-5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate font-semibold text-foreground text-sm leading-none">
          {displayName(meta)}
        </p>
        <ul className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-muted-foreground text-xs">
          {metaItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <li
                key={item.key}
                className="flex min-w-0 items-center gap-1"
              >
                {idx > 0 && (
                  <span
                    aria-hidden
                    className="select-none text-muted-foreground/40"
                  >
                    •
                  </span>
                )}
                {Icon && (
                  <Icon
                    className="size-3 shrink-0"
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "truncate",
                    item.className
                  )}
                  title={item.label}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
