"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import PricingTable from "@/components/billing/PricingTable";
import RageClickZone from "@/components/RageClickZone";
import { trackFunnelViewProduct } from "@/lib/funnel";

export default function HomePage() {
  useEffect(() => {
    trackFunnelViewProduct();
  }, []);

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-surface-raised px-6 py-12 shadow-card sm:px-10 sm:py-16">
        <div className="relative z-10 max-w-2xl space-y-6">
          <span className="badge">Step 1 — funnel_view_product</span>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            Session replay meets premium billing UX
          </h1>
          <p className="text-base leading-relaxed text-ink-muted sm:text-lg">
            Explore a modern storefront with Billing SDK–style pricing and checkout.
            Every click, scroll, and payment step is captured by SightHog in one
            browser tab.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalog"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              Browse catalog
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/checkout?plan=pro"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-sm font-semibold text-ink transition hover:border-accent/40"
            >
              <PlayCircle className="size-4 text-accent" />
              Try checkout
            </Link>
          </div>
        </div>
      </section>

      <PricingTable />

      <section className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
        <h2 className="font-display text-xl font-semibold text-ink">
          Suggested test flow
        </h2>
        <ol className="mt-4 grid gap-2 text-sm text-ink-muted sm:grid-cols-2">
          <li>1. Home — pick a membership plan</li>
          <li>
            2.{" "}
            <Link href="/catalog" className="text-accent hover:underline">
              Catalog
            </Link>{" "}
            — add hardware
          </li>
          <li>
            3.{" "}
            <Link href="/product/headphones" className="text-accent hover:underline">
              Product detail
            </Link>
          </li>
          <li>
            4.{" "}
            <Link href="/cart" className="text-accent hover:underline">
              Cart
            </Link>{" "}
            — review items
          </li>
          <li>
            5.{" "}
            <Link href="/checkout" className="text-accent hover:underline">
              Checkout
            </Link>{" "}
            — complete payment
          </li>
          <li>6. Dashboard — watch replay + DevTools timeline</li>
        </ol>
      </section>

      <RageClickZone />
    </div>
  );
}
