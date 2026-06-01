"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  MEMBERSHIP_PLANS,
  planPrice,
  type BillingInterval,
  type BillingPlan,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

/** Billing SDK pricing-table-one pattern */
export default function PricingTable() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <section className="space-y-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Membership
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Plans that grow with your product
        </h2>
        <p className="max-w-xl text-sm text-ink-muted sm:text-base">
          Billing SDK–style pricing table. Pick a tier, then continue to checkout
          to exercise the full payment funnel in SightHog.
        </p>

        <div className="inline-flex rounded-full border border-line bg-surface-raised p-1">
          {(["monthly", "yearly"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setInterval(key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
                interval === key
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              {key}
              {key === "yearly" && (
                <span className="ml-1.5 text-xs opacity-80">−20%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {MEMBERSHIP_PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} interval={interval} />
        ))}
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  interval,
}: {
  plan: BillingPlan;
  interval: BillingInterval;
}) {
  const price = planPrice(plan, interval);

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border bg-surface-raised p-6 shadow-card transition hover:border-accent/30",
        plan.highlighted
          ? "border-accent/40 shadow-glow lg:scale-[1.02]"
          : "border-line"
      )}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
          {plan.badge}
        </span>
      )}

      <div className="mb-6 space-y-2">
        <h3 className="font-display text-xl font-semibold text-ink">{plan.name}</h3>
        <p className="text-sm text-ink-muted">{plan.description}</p>
      </div>

      <div className="mb-6 flex items-baseline gap-1">
        <span className="font-display text-4xl font-semibold tabular-nums text-ink">
          ${price}
        </span>
        <span className="text-sm text-ink-muted">
          /{interval === "yearly" ? "mo, billed yearly" : "month"}
        </span>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-ink-muted">
            <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/checkout?plan=${plan.id}&interval=${interval}`}
        className={cn(
          "inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition",
          plan.highlighted
            ? "bg-accent text-accent-foreground hover:opacity-90"
            : "border border-line bg-surface text-ink hover:border-accent/40"
        )}
      >
        {price === 0 ? "Start free" : "Subscribe"}
      </Link>
    </article>
  );
}
