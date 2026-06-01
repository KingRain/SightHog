"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { GithubIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "Docs", href: "/docs" },
  { label: "FAQ", href: "/#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const isDocs = location.pathname.startsWith("/docs");

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu when route changes.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 30, delay: 0.1 }}
        className="fixed inset-x-0 top-4 sm:top-6 z-50 flex justify-center pointer-events-none"
      >
        <FloatingPill scrolled={scrolled}>
          <LogoLink to={isDocs ? "/docs" : "/"} />

          <nav className="hidden md:flex items-center gap-1 pointer-events-auto">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/docs"
                  ? location.pathname.startsWith("/docs")
                  : false;
              return (
                <NavLinkItem key={link.href} {...link} active={isActive} />
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2 pointer-events-auto">
            <a
              href="https://github.com/kingrain/sighthog"
              target="_blank"
              rel="noreferrer"
              className="size-9 rounded-full border border-border bg-card hover:bg-secondary transition-colors flex items-center justify-center text-foreground/70 hover:text-foreground"
              aria-label="GitHub"
            >
              <GithubIcon className="size-4" />
            </a>
            <Link
              to="/docs"
              className="size-9 rounded-full border border-border bg-card hover:bg-secondary transition-colors flex items-center justify-center text-foreground/70 hover:text-foreground"
              aria-label="Docs"
            >
              <BookOpen className="size-4" strokeWidth={1.5} />
            </Link>
            <CTAButton />
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden pointer-events-auto size-9 rounded-full border border-border bg-card flex items-center justify-center text-foreground"
          >
            {open ? (
              <X className="size-4" strokeWidth={1.5} />
            ) : (
              <Menu className="size-4" strokeWidth={1.5} />
            )}
          </button>
        </FloatingPill>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden bg-background/95 backdrop-blur-xl pt-28 px-6"
          >
            <motion.nav
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } },
              }}
              className="flex flex-col gap-2"
            >
              {NAV_LINKS.map((link) => {
                const isExternal =
                  link.href.startsWith("#") || link.href.startsWith("http");
                const inner = (
                  <motion.span
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    className="block text-2xl font-medium tracking-tight text-foreground py-3 border-b border-border"
                  >
                    {link.label}
                  </motion.span>
                );
                return isExternal ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </Link>
                );
              })}
              <div className="mt-6">
                <CTAButton full />
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FloatingPill({
  scrolled,
  children,
}: {
  scrolled: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      animate={{
        width: scrolled ? "min(720px, calc(100% - 32px))" : "min(820px, calc(100% - 32px))",
        backgroundColor: scrolled
          ? "rgba(22, 22, 26, 0.85)"
          : "rgba(22, 22, 26, 0.6)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className={cn(
        "pointer-events-auto flex items-center justify-between gap-3 px-3 py-2.5",
        "rounded-full border border-border backdrop-blur-xl",
        scrolled
          ? "shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          : "shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
      )}
    >
      {children}
    </motion.div>
  );
}

function NavLinkItem({
  label,
  href,
  active = false,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  const isExternal = href.startsWith("#") || href.startsWith("http");
  const className = cn(
    "relative px-3 py-1.5 text-sm transition-colors",
    active ? "text-foreground" : "text-foreground/70 hover:text-foreground",
  );

  if (isExternal) {
    return (
      <a href={href} className={className}>
        <HoverHighlight>{label}</HoverHighlight>
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      <HoverHighlight>{label}</HoverHighlight>
    </Link>
  );
}

function HoverHighlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-x-0 -bottom-0.5 h-px bg-foreground/40 origin-left scale-x-0 hover:scale-x-100 transition-transform duration-300" />
    </span>
  );
}

function CTAButton({ full = false }: { full?: boolean }) {
  const content = (
    <>
      Get started
      <span aria-hidden>→</span>
    </>
  );
  if (full) {
    return (
      <Link
        to="/docs"
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-fg font-medium text-base hover:opacity-90 transition-opacity"
      >
        {content}
      </Link>
    );
  }
  return (
    <Link
      to="/docs"
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-fg text-sm font-medium hover:opacity-90 transition-opacity"
    >
      {content}
    </Link>
  );
}

function LogoLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 pointer-events-auto"
      aria-label="SightHog home"
    >
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
      <span className="font-semibold tracking-tight text-foreground">
        Sight<span className="text-primary">Hog</span>
      </span>
    </Link>
  );
}
