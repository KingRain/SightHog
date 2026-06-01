import * as React from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";

import { GithubIcon } from "@/components/icons";

type NavItem = { label: string; href: string; external?: boolean };

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs" },
      { label: "Installation", href: "/docs/installation" },
      { label: "Quick start", href: "/docs/quick-start" },
      { label: "Configuration", href: "/docs/configuration" },
    ],
  },
  {
    title: "SDK Reference",
    items: [
      { label: "API reference", href: "/docs/api-reference" },
      { label: "Event types", href: "/docs/event-types" },
      { label: "Frustration detection", href: "/docs/frustration" },
      { label: "Privacy & PII", href: "/docs/privacy" },
    ],
  },
  {
    title: "Backend",
    items: [
      { label: "Self-hosting", href: "/docs/self-hosting" },
      { label: "Architecture", href: "/docs/architecture" },
      { label: "Ingest API", href: "/docs/ingest-api" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "GitHub repository", href: "https://github.com/kingrain/sighthog", external: true },
      { label: "Changelog", href: "https://github.com/kingrain/sighthog/releases", external: true },
      { label: "Roadmap", href: "https://github.com/kingrain/sighthog/issues", external: true },
    ],
  },
];

type NextLink = { href: string; title: string; body: string };

const DOCS_GRAPH: Record<string, { next: NextLink[]; prev?: NextLink }> = {
  "/docs": {
    next: [
      { href: "/docs/installation", title: "Installation", body: "Install the SDK and start a local Docker stack in under five minutes." },
      { href: "/docs/quick-start", title: "Quick start", body: "Drop the SDK into a real app and watch your first session land." },
      { href: "/docs/api-reference", title: "API reference", body: "Every function, every option, every event payload." },
      { href: "/docs/self-hosting", title: "Self-hosting", body: "The full docker-compose reference and how to swap pieces out." },
    ],
  },
  "/docs/installation": {
    prev: { href: "/docs", title: "Introduction", body: "What SightHog is, the philosophy, and the reference stack." },
    next: [
      { href: "/docs/quick-start", title: "Quick start", body: "Drop the SDK into a real app and watch your first session land." },
      { href: "/docs/configuration", title: "Configuration", body: "All the knobs: endpoints, batching, masking, sampling." },
      { href: "/docs/architecture", title: "Architecture", body: "How the SDK, ingest API, Kafka, and workers fit together." },
      { href: "/docs/self-hosting", title: "Self-hosting", body: "Spin up the full reference stack with one command." },
    ],
  },
  "/docs/quick-start": {
    prev: { href: "/docs/installation", title: "Installation", body: "Install the SDK and start a local Docker stack in under five minutes." },
    next: [
      { href: "/docs/configuration", title: "Configuration", body: "Tune batching, masking, and endpoints for your app." },
      { href: "/docs/event-types", title: "Event types", body: "Every event the SDK ships and its payload shape." },
      { href: "/docs/api-reference", title: "API reference", body: "Functions, options, and return values, end to end." },
      { href: "/docs/frustration", title: "Frustration detection", body: "How rage-clicks, dead-clicks, and error-clicks are detected." },
    ],
  },
  "/docs/configuration": {
    prev: { href: "/docs/quick-start", title: "Quick start", body: "Drop the SDK into a real app and watch your first session land." },
    next: [
      { href: "/docs/api-reference", title: "API reference", body: "Functions, options, and return values, end to end." },
      { href: "/docs/privacy", title: "Privacy & PII", body: "Selectors to mask, block, and redact before they leave the browser." },
      { href: "/docs/event-types", title: "Event types", body: "Every event the SDK ships and its payload shape." },
      { href: "/docs/self-hosting", title: "Self-hosting", body: "Spin up the full reference stack with one command." },
    ],
  },
  "/docs/api-reference": {
    prev: { href: "/docs/configuration", title: "Configuration", body: "All the knobs: endpoints, batching, masking, sampling." },
    next: [
      { href: "/docs/event-types", title: "Event types", body: "Every event the SDK ships and its payload shape." },
      { href: "/docs/frustration", title: "Frustration detection", body: "How rage-clicks, dead-clicks, and error-clicks are detected." },
      { href: "/docs/privacy", title: "Privacy & PII", body: "Selectors to mask, block, and redact before they leave the browser." },
      { href: "/docs/ingest-api", title: "Ingest API", body: "The HTTP contract the SDK posts to and the backend validates." },
    ],
  },
  "/docs/event-types": {
    prev: { href: "/docs/api-reference", title: "API reference", body: "Functions, options, and return values, end to end." },
    next: [
      { href: "/docs/frustration", title: "Frustration detection", body: "How rage-clicks, dead-clicks, and error-clicks are detected." },
      { href: "/docs/privacy", title: "Privacy & PII", body: "Selectors to mask, block, and redact before they leave the browser." },
      { href: "/docs/ingest-api", title: "Ingest API", body: "The HTTP contract the SDK posts to and the backend validates." },
      { href: "/docs/architecture", title: "Architecture", body: "How the SDK, ingest API, Kafka, and workers fit together." },
    ],
  },
  "/docs/frustration": {
    prev: { href: "/docs/event-types", title: "Event types", body: "Every event the SDK ships and its payload shape." },
    next: [
      { href: "/docs/privacy", title: "Privacy & PII", body: "Selectors to mask, block, and redact before they leave the browser." },
      { href: "/docs/ingest-api", title: "Ingest API", body: "The HTTP contract the SDK posts to and the backend validates." },
      { href: "/docs/api-reference", title: "API reference", body: "Functions, options, and return values, end to end." },
      { href: "/docs/architecture", title: "Architecture", body: "How the SDK, ingest API, Kafka, and workers fit together." },
    ],
  },
  "/docs/privacy": {
    prev: { href: "/docs/frustration", title: "Frustration detection", body: "How rage-clicks, dead-clicks, and error-clicks are detected." },
    next: [
      { href: "/docs/self-hosting", title: "Self-hosting", body: "Spin up the full reference stack with one command." },
      { href: "/docs/ingest-api", title: "Ingest API", body: "The HTTP contract the SDK posts to and the backend validates." },
      { href: "/docs/configuration", title: "Configuration", body: "Tune batching, masking, and endpoints for your app." },
      { href: "/docs/architecture", title: "Architecture", body: "How the SDK, ingest API, Kafka, and workers fit together." },
    ],
  },
  "/docs/self-hosting": {
    prev: { href: "/docs/installation", title: "Installation", body: "Install the SDK and start a local Docker stack in under five minutes." },
    next: [
      { href: "/docs/architecture", title: "Architecture", body: "How the SDK, ingest API, Kafka, and workers fit together." },
      { href: "/docs/ingest-api", title: "Ingest API", body: "The HTTP contract the SDK posts to and the backend validates." },
      { href: "/docs/privacy", title: "Privacy & PII", body: "Selectors to mask, block, and redact before they leave the browser." },
      { href: "/docs/installation", title: "Installation", body: "Install the SDK and start a local Docker stack in under five minutes." },
    ],
  },
  "/docs/architecture": {
    prev: { href: "/docs/self-hosting", title: "Self-hosting", body: "Spin up the full reference stack with one command." },
    next: [
      { href: "/docs/ingest-api", title: "Ingest API", body: "The HTTP contract the SDK posts to and the backend validates." },
      { href: "/docs/self-hosting", title: "Self-hosting", body: "Spin up the full reference stack with one command." },
      { href: "/docs/privacy", title: "Privacy & PII", body: "Selectors to mask, block, and redact before they leave the browser." },
      { href: "/docs/api-reference", title: "API reference", body: "Functions, options, and return values, end to end." },
    ],
  },
  "/docs/ingest-api": {
    prev: { href: "/docs/architecture", title: "Architecture", body: "How the SDK, ingest API, Kafka, and workers fit together." },
    next: [
      { href: "https://github.com/kingrain/sighthog", title: "GitHub repository", body: "The full source: SDK, ingest API, workers, and dashboard." },
      { href: "/docs/self-hosting", title: "Self-hosting", body: "Spin up the full reference stack with one command." },
      { href: "/docs/privacy", title: "Privacy & PII", body: "Selectors to mask, block, and redact before they leave the browser." },
      { href: "/docs/architecture", title: "Architecture", body: "How the SDK, ingest API, Kafka, and workers fit together." },
    ],
  },
};

interface DocsLayoutProps {
  children: React.ReactNode;
  toc?: { id: string; label: string; level?: 1 | 2 | 3 }[];
  active?: string;
}

export function DocsLayout({ children, toc = [], active }: DocsLayoutProps) {
  return (
    <div className="relative pt-24 sm:pt-28 pb-24 sm:pb-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_220px] gap-8 lg:gap-12">
          <Sidebar active={active} />
          <main className="min-w-0">
            {children}
            <WhereToNext active={active} />
          </main>
          <TableOfContents items={toc} />
        </div>
      </div>
    </div>
  );
}

function Sidebar({ active }: { active?: string }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28">
        <nav className="space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-[10px] uppercase tracking-[0.18em] text-muted/60 font-medium mb-2">
                {section.title}
              </h4>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    active === item.href ||
                    (item.href === "/docs" && active === "/docs");
                  if (item.external) {
                    return (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
                        >
                          {item.label}
                          <span aria-hidden className="text-[10px]">↗</span>
                        </a>
                      </li>
                    );
                  }
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className={
                          "block px-2.5 py-1.5 text-sm rounded-lg transition-colors " +
                          (isActive
                            ? "bg-card text-foreground border border-border"
                            : "text-foreground/70 hover:text-foreground hover:bg-card/50")
                        }
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <a
            href="https://github.com/kingrain/sighthog"
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-secondary transition-colors"
          >
            <GithubIcon className="size-4" />
            <span>View on GitHub</span>
          </a>
        </nav>
      </div>
    </aside>
  );
}

function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = React.useState<string | null>(ids[0] ?? null);

  React.useEffect(() => {
    if (ids.length === 0) return;

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const scrollY = window.scrollY;
      const offset = 120;
      const viewportTop = scrollY + offset;

      let current: string | null = null;
      for (const el of elements) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= viewportTop) {
          current = el.id;
        } else {
          break;
        }
      }

      if (current === null) {
        const first = elements[0];
        if (first && first.getBoundingClientRect().top > viewportTop + 200) {
          current = null;
        } else {
          current = first.id;
        }
      }

      setActive((prev) => (prev === current ? prev : current));
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return active;
}

function TableOfContents({ items }: { items: { id: string; label: string; level?: 1 | 2 | 3 }[] }) {
  const ids = React.useMemo(() => items.map((i) => i.id), [items]);
  const active = useActiveSection(ids);

  if (items.length === 0) return <aside className="hidden lg:block" aria-hidden />;
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-28">
        <h4 className="text-[10px] uppercase tracking-[0.18em] text-muted/60 font-medium mb-3">
          On this page
        </h4>
        <ul className="space-y-1.5 border-l border-border">
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id} className={item.level === 3 ? "ml-4" : ""}>
                <a
                  href={`#${item.id}`}
                  className={
                    "relative block -ml-px pl-3 py-0.5 text-sm transition-colors " +
                    (isActive
                      ? "text-foreground font-medium border-l border-primary -ml-px"
                      : "text-muted hover:text-foreground border-l border-transparent")
                  }
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function WhereToNext({ active }: { active?: string }) {
  const graph = active ? DOCS_GRAPH[active] : null;
  if (!graph) return null;

  return (
    <section className="mt-20 pt-12 border-t border-border">
      {graph.prev && (
        <a
          href={graph.prev.href}
          className="group mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>
            <span className="text-muted/60">Previous ·</span>{" "}
            <span className="font-medium">{graph.prev.title}</span>
          </span>
        </a>
      )}

      <h2 className="font-serif text-3xl sm:text-4xl tracking-[-0.025em] leading-[1.05] text-foreground">
        Where to next
      </h2>
      <p className="mt-3 text-base text-muted max-w-2xl">
        Pick the next thing you want to wire up — or jump to the reference if
        you just need the shape of a payload.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-3">
        {graph.next.map((link) => (
          <NextLink key={link.href} {...link} />
        ))}
      </div>
    </section>
  );
}

function NextLink({ href, title, body }: NextLink) {
  const isExternal = href.startsWith("http");
  const className =
    "group block rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40 transition-colors";
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <ArrowRight className="size-4 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="mt-1.5 text-sm text-muted leading-relaxed">{body}</p>
    </>
  );
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return <a href={href} className={className}>{inner}</a>;
}

export function DocsHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-12">
      {eyebrow && (
        <div className="text-[11px] uppercase tracking-[0.18em] text-primary/80 font-medium">
          {eyebrow}
        </div>
      )}
      <h1 className="mt-3 font-serif font-normal tracking-[-0.025em] leading-[1.05] text-balance text-4xl sm:text-5xl text-foreground">
        {title}
      </h1>
      {description && (
        <p className="mt-4 max-w-2xl text-pretty text-lg leading-7 text-muted">
          {description}
        </p>
      )}
    </header>
  );
}

export function DocsH2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-16 mb-4 font-serif font-normal text-2xl sm:text-3xl tracking-[-0.02em] text-foreground scroll-mt-28"
    >
      {children}
    </h2>
  );
}

export function DocsH3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="mt-10 mb-3 text-lg sm:text-xl font-medium tracking-tight text-foreground scroll-mt-28"
    >
      {children}
    </h3>
  );
}

export function DocsP({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base leading-7 text-foreground/85 text-pretty">
      {children}
    </p>
  );
}

export function DocsList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-2 text-foreground/85 text-base leading-7">
      {children}
    </ul>
  );
}

export function DocsLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="relative pl-6 before:absolute before:left-0 before:top-[0.7em] before:size-1.5 before:rounded-full before:bg-primary/70">
      {children}
    </li>
  );
}

export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: "info" | "warn" | "success";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-primary/30 bg-primary/5",
    warn: "border-amber-500/30 bg-amber-500/5",
    success: "border-emerald-500/30 bg-emerald-500/5",
  } as const;
  const titleColor = {
    info: "text-primary",
    warn: "text-amber-400",
    success: "text-emerald-400",
  } as const;
  return (
    <div
      className={`my-6 rounded-2xl border px-5 py-4 ${styles[variant]}`}
    >
      {title && (
        <div
          className={`text-[11px] uppercase tracking-[0.18em] font-medium ${titleColor[variant]} mb-1.5`}
        >
          {title}
        </div>
      )}
      <div className="text-sm leading-6 text-foreground/85 [&_p]:m-0 [&_code]:font-mono [&_code]:text-foreground [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:bg-background/60 [&_code]:text-[12.5px]">
        {children}
      </div>
    </div>
  );
}

export function PropTable({
  rows,
}: {
  rows: {
    name: string;
    type: string;
    required?: boolean;
    default?: string;
    description: string;
  }[];
}) {
  return (
    <div className="my-6 rounded-2xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-foreground">
          <tr className="text-left">
            <th className="px-4 py-2.5 font-medium text-foreground/80 font-mono text-xs">
              Prop
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground/80 font-mono text-xs">
              Type
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground/80 text-xs">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-border align-top">
              <td className="px-4 py-3 font-mono text-[12.5px] text-foreground">
                <div className="flex items-center gap-1.5">
                  {row.name}
                  {row.required && (
                    <span className="text-[9px] uppercase tracking-wider text-primary/80">
                      req
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-[12.5px] text-muted">
                {row.type}
                {row.default && (
                  <div className="mt-1 text-[10.5px] uppercase tracking-wider text-muted/60">
                    default {row.default}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-foreground/80 leading-6">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
