"use client";

import { Globe, List, MessageSquare, Share2, User } from "lucide-react";
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

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary shadow-sm">
          <User className="size-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">
            {displayName(meta)}
          </p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {formatSessionTime(meta.created_at)}
            <span className="mx-1.5 text-border">•</span>
            <span className="inline-flex items-center gap-0.5">
              <Globe className="size-3" aria-hidden />
              {location}
            </span>
            <span className="mx-1.5 text-border">•</span>
            {browser}
            <span className="mx-1.5 text-border">•</span>
            {os}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <HeaderAction icon={<List className="size-4" />} label="Session list" />
        <HeaderAction icon={<Share2 className="size-4" />} label="Share" />
        <HeaderAction icon={<MessageSquare className="size-4" />} label="Notes" />
      </div>
    </div>
  );
}

function HeaderAction({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-md border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {icon}
    </button>
  );
}
