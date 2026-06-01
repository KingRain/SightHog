"use client";

import * as React from "react";
import { motion, LayoutGroup } from "motion/react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface HoverFeatureCard {
  name: string;
  description: string;
  href?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  accent?: string;
  visual?: "replay" | "rage" | "vitals" | "privacy" | "network" | "identity" | "beacon" | "dropin";
}

export interface HoverFeatureCardsProps {
  items: HoverFeatureCard[];
  className?: string;
}

function HoverFeatureCard({
  item,
  isAnyHovered,
  isThisHovered,
  onHoverStart,
  onHoverEnd,
}: {
  item: HoverFeatureCard;
  isAnyHovered: boolean;
  isThisHovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}) {
  return (
    <motion.div
      layout
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      animate={{
        scale: isThisHovered ? 1.015 : 1,
        opacity: isAnyHovered && !isThisHovered ? 0.6 : 1,
      }}
      className="group flex flex-col w-full relative cursor-pointer"
    >
      <div
        className={cn(
          "flex flex-col rounded-3xl border border-border bg-card h-80 z-[5] transition-colors w-full overflow-hidden relative",
          isThisHovered ? "border-border/80" : "",
          item.containerClassName,
        )}
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: isThisHovered ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            background: `radial-gradient(600px circle at 50% 0%, ${item.accent ?? "rgba(255, 90, 31, 0.12)"}, transparent 60%)`,
          }}
        />

        <div className="relative z-10 flex flex-col gap-4 p-6 h-full">
          <div className="flex items-start justify-between">
            {item.icon && (
              <motion.div
                animate={{
                  scale: isThisHovered ? 1.1 : 1,
                  rotate: isThisHovered ? -3 : 0,
                }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
                className="size-12 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary"
              >
                {item.icon}
              </motion.div>
            )}
            <ArrowUpRight
              className={cn(
                "size-5 text-muted transition-all duration-300",
                isThisHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-2",
              )}
              strokeWidth={1.5}
            />
          </div>

          {item.visual && (
            <div className="flex-1 -mx-2 -mb-2 flex items-center justify-center min-h-0">
              <CardVisual
                kind={item.visual}
                active={isThisHovered}
                accent={item.accent ?? "rgba(255, 90, 31, 0.6)"}
              />
            </div>
          )}

          <span className="font-medium text-2xl tracking-tight text-foreground">
            {item.name}
          </span>
        </div>
      </div>

      <motion.div
        animate={{
          opacity: isThisHovered ? 1 : 0,
          y: isThisHovered ? 0 : -30,
        }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="overflow-hidden z-[1] w-11/12 self-center"
      >
        <div className="py-3 px-6 relative border border-t-0 rounded-b-3xl border-border bg-card">
          <div className="pointer-events-none w-[103%] bg-gradient-to-b from-card to-transparent h-10 absolute -top-1 -left-1 rounded-b-3xl" />
          <p className="text-sm text-muted leading-relaxed">
            {item.description}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CardVisual({
  kind,
  active,
  accent,
}: {
  kind: NonNullable<HoverFeatureCard["visual"]>;
  active: boolean;
  accent: string;
}) {
  const speed = active ? 0.9 : 1.6;

  return (
    <div className="relative w-full h-full flex items-center justify-center text-foreground/80">
      {kind === "replay" && <ReplayVisual speed={speed} />}
      {kind === "rage" && <RageVisual speed={speed} accent={accent} />}
      {kind === "vitals" && <VitalsVisual speed={speed} accent={accent} />}
      {kind === "privacy" && <PrivacyVisual speed={speed} />}
      {kind === "network" && <NetworkVisual speed={speed} />}
      {kind === "identity" && <IdentityVisual speed={speed} accent={accent} />}
      {kind === "beacon" && <BeaconVisual speed={speed} accent={accent} />}
      {kind === "dropin" && <DropInVisual speed={speed} />}
    </div>
  );
}

function ReplayVisual({ speed }: { speed: number }) {
  return (
    <svg viewBox="0 0 220 80" className="w-full h-20">
      <defs>
        <linearGradient id="replay-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#ff8a4c" stopOpacity="0" />
          <stop offset="50%" stopColor="#ff8a4c" stopOpacity="1" />
          <stop offset="100%" stopColor="#ff8a4c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 50 C 20 50, 30 20, 50 20 S 80 70, 100 50 130 30, 150 30 180 60, 220 50"
        fill="none"
        stroke="url(#replay-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: [0, 1, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: speed * 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M0 50 C 20 50, 30 20, 50 20 S 80 70, 100 50 130 30, 150 30 180 60, 220 50"
        fill="none"
        stroke="#ff8a4c"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.25"
      />
      <motion.circle
        r="3.5"
        fill="#ff8a4c"
        animate={{ cx: [0, 220], cy: [50, 50, 20, 50, 70, 50, 30, 50, 60, 50] }}
        transition={{ duration: speed * 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

function RageVisual({ speed, accent }: { speed: number; accent: string }) {
  return (
    <div className="relative w-32 h-24 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute size-6 rounded-full border"
          style={{ borderColor: accent, borderWidth: 1.5 }}
          initial={{ scale: 0.3, opacity: 0.9 }}
          animate={{ scale: [0.3, 2.2], opacity: [0.9, 0] }}
          transition={{
            duration: speed,
            repeat: Infinity,
            delay: i * (speed / 3),
            ease: "easeOut",
          }}
        />
      ))}
      <motion.div
        className="size-3 rounded-full bg-primary"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: speed * 0.3, repeat: Infinity }}
      />
    </div>
  );
}

function VitalsVisual({ speed, accent }: { speed: number; accent: string }) {
  const bars = [0.5, 0.85, 0.65, 0.95, 0.4, 0.7];
  return (
    <div className="flex items-end gap-2 h-20">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-3 rounded-sm"
          style={{ backgroundColor: accent }}
          animate={{ height: [`${h * 60}px`, `${(1 - h) * 60 + 12}px`, `${h * 60}px`] }}
          transition={{
            duration: speed + i * 0.1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function PrivacyVisual({ speed }: { speed: number }) {
  return (
    <div className="relative w-40 h-20 rounded-xl border border-border bg-background/60 overflow-hidden">
      <div className="absolute inset-x-3 top-3 space-y-1.5">
        <div className="h-1.5 w-2/3 rounded-full bg-foreground/15" />
        <div className="h-1.5 w-1/2 rounded-full bg-foreground/15" />
        <div className="h-1.5 w-3/4 rounded-full bg-foreground/15" />
      </div>
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 bg-primary/30 backdrop-blur-sm"
        animate={{ x: ["-30%", "70%", "70%"] }}
        transition={{
          duration: speed * 2.2,
          repeat: Infinity,
          times: [0, 0.5, 1],
          ease: "easeInOut",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-primary-foreground/90">
          ●●●
        </div>
      </motion.div>
    </div>
  );
}

function NetworkVisual({ speed }: { speed: number }) {
  return (
    <div className="w-44 rounded-lg border border-border bg-background/60 p-2.5 space-y-1.5 font-mono text-[10px]">
      {[
        { method: "GET", path: "/v1/sessions", status: "200" },
        { method: "POST", path: "/v1/events", status: "200" },
        { method: "GET", path: "/v1/users/me", status: "401" },
      ].map((row, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: speed * 1.5,
            repeat: Infinity,
            delay: i * 0.25,
          }}
        >
          <span
            className="px-1.5 py-0.5 rounded text-[8px] font-bold"
            style={{
              backgroundColor:
                row.status === "200" ? "rgba(34, 197, 94, 0.18)" : "rgba(239, 68, 68, 0.18)",
              color: row.status === "200" ? "#4ade80" : "#fca5a5",
            }}
          >
            {row.method}
          </span>
          <span className="flex-1 text-foreground/70 truncate">{row.path}</span>
          <span className="text-muted/60">{row.status}</span>
        </motion.div>
      ))}
    </div>
  );
}

function IdentityVisual({ speed, accent }: { speed: number; accent: string }) {
  return (
    <div className="flex gap-2">
      {[
        { label: "visitorId", color: "#a78bfa" },
        { label: "sessionId", color: "#34d399" },
      ].map((t, i) => (
        <motion.div
          key={t.label}
          className="px-3 py-1.5 rounded-full border text-[10px] font-mono"
          style={{ borderColor: `${t.color}55`, color: t.color, boxShadow: `0 0 18px ${accent}33` }}
          animate={{ y: [0, -2, 0] }}
          transition={{
            duration: speed,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        >
          {t.label}
        </motion.div>
      ))}
    </div>
  );
}

function BeaconVisual({ speed, accent }: { speed: number; accent: string }) {
  return (
    <div className="relative w-28 h-20 flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{ borderColor: accent }}
          animate={{ width: ["0%", "100%"], height: ["0%", "100%"], opacity: [1, 0] }}
          transition={{
            duration: speed * 1.4,
            repeat: Infinity,
            delay: i * (speed * 0.45),
            ease: "easeOut",
          }}
        />
      ))}
      <motion.div
        className="size-2 rounded-full bg-primary"
        animate={{ scale: [1, 1.4, 1] }}
        transition={{ duration: speed * 0.5, repeat: Infinity }}
      />
    </div>
  );
}

function DropInVisual({ speed }: { speed: number }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-1.5 font-mono text-[11px] flex items-center gap-1.5">
      <span className="text-[#a78bfa]">init</span>
      <span className="text-foreground/80">SightHog</span>
      <span className="text-muted/60">(</span>
      <motion.span
        className="inline-block w-1.5 h-3.5 bg-primary"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: speed * 0.6, repeat: Infinity }}
      />
    </div>
  );
}

export function HoverFeatureCards({ items, className }: HoverFeatureCardsProps) {
  const [hovered, setHovered] = React.useState<string | null>(null);

  return (
    <LayoutGroup>
      <motion.div
        layout
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 w-full",
          className,
        )}
        animate={{ gap: hovered ? 56 : 32 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
      >
        {items.map((item) => (
          <HoverFeatureCard
            key={item.name}
            item={item}
            isAnyHovered={hovered !== null}
            isThisHovered={hovered === item.name}
            onHoverStart={() => setHovered(item.name)}
            onHoverEnd={() => setHovered(null)}
          />
        ))}
      </motion.div>
    </LayoutGroup>
  );
}
