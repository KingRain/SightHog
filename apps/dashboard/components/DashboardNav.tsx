"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Sessions", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: Globe },
] as const;

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground text-sm tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-4" aria-hidden />
          </span>
          SightHog
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
