"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/catalog", label: "Catalog" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
];

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-hero-gradient">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent/15 text-sm font-bold text-accent ring-1 ring-accent/25">
              SH
            </span>
            <div>
              <p className="font-display text-base font-semibold text-ink">
                SightHog Store
              </p>
              <p className="text-xs text-ink-muted">Premium billing demo</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  pathname === item.href
                    ? "bg-accent/15 text-accent"
                    : "text-ink-muted hover:bg-surface-raised hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Dashboard
              <ArrowUpRight className="size-3.5" />
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>

      <footer className="border-t border-line/60 py-8 text-center text-xs text-ink-faint">
        <p className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-accent" />
          UI patterns from{" "}
          <a
            href="https://billingsdk.com/docs"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            Billing SDK
          </a>
          · Built for SightHog replay testing
        </p>
      </footer>
    </div>
  );
}
