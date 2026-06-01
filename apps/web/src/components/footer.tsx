import { BookOpen, Heart } from "lucide-react";
import { Link } from "react-router-dom";

import { GithubIcon } from "@/components/icons";

const PRODUCT = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "Install", href: "/docs/installation" },
  { label: "Use cases", href: "/#use-cases" },
  { label: "FAQ", href: "/#faq" },
];

const RESOURCES = [
  { label: "Documentation", href: "/docs", icon: BookOpen },
  { label: "API reference", href: "/docs/api-reference" },
  { label: "GitHub repository", href: "https://github.com/kingrain/sighthog" },
  { label: "Roadmap", href: "https://github.com/kingrain/sighthog/issues" },
];

const COMMUNITY = [
  { label: "GitHub", href: "https://github.com/kingrain/sighthog", icon: GithubIcon },
  { label: "Author on GitHub", href: "https://github.com/KingRain" },
  { label: "Author on LinkedIn", href: "https://linkedin.com/in/samjoe404" },
  { label: "Report an issue", href: "https://github.com/kingrain/sighthog/issues/new" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background/50">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
          <div className="col-span-2 sm:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <Logomark />
            <span className="font-semibold tracking-tight text-foreground">
              SightHog
            </span>
          </Link>
            <p className="mt-4 text-sm text-muted leading-relaxed max-w-xs">
              An open-source browser telemetry SDK with rrweb session replay,
              frustration detection, and web vitals.
            </p>
          </div>

          <FooterColumn title="Product" links={PRODUCT} />
          <FooterColumn title="Resources" links={RESOURCES} />
          <FooterColumn title="Community" links={COMMUNITY} />
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} SightHog.</span>
            <span aria-hidden>·</span>
            <span>Apache 2.0 License</span>
          </div>
          <div className="flex items-center gap-1.5">
            Built with
            <Heart
              className="size-3 text-primary fill-primary"
              strokeWidth={1.5}
            />
            by{" "}
            <a
              href="https://samjoe.me"
              target="_blank"
              rel="noreferrer"
              className="text-foreground hover:text-primary transition-colors underline decoration-dotted underline-offset-4"
            >
              HttpError
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; icon?: React.ComponentType<{ className?: string; strokeWidth?: number }> | React.FC<{ className?: string }> }[];
}) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-[0.18em] text-muted/70 font-medium">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isExternal =
            link.href.startsWith("http") || link.href.startsWith("#");
          const inner = (
            <span className="inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors">
              {Icon && <Icon className="size-3.5" strokeWidth={1.5} />}
              {link.label}
            </span>
          );
          return (
            <li key={link.label}>
              {isExternal ? (
                <a href={link.href}>{inner}</a>
              ) : (
                <Link to={link.href}>{inner}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Logomark() {
  return (
    <span className="relative inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
      <span className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary to-accent blur-md opacity-60" />
      <svg
        viewBox="0 0 24 24"
        className="relative size-4 text-primary-fg"
        fill="none"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <path
          d="M12 1v3M12 20v3M1 12h3M20 12h3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
