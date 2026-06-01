"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import OrderSummary from "@/components/billing/OrderSummary";
import PaymentMethodSelector, {
  type PaymentMethod,
} from "@/components/billing/PaymentMethodSelector";
import {
  MEMBERSHIP_PLANS,
  planPrice,
  type BillingInterval,
} from "@/lib/plans";
import { readCart } from "@/lib/cart";
import {
  trackFunnelOpenCheckout,
  trackFunnelPayment,
} from "@/lib/funnel";
import { cn } from "@/lib/utils";

export default function CheckoutExperience() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") ?? "pro";
  const interval = (searchParams.get("interval") ?? "monthly") as BillingInterval;
  const plan = MEMBERSHIP_PLANS.find((p) => p.id === planId) ?? MEMBERSHIP_PLANS[1];

  const [method, setMethod] = useState<PaymentMethod>("card");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    trackFunnelOpenCheckout();
  }, []);

  const cartLines = useMemo(() => readCart(), []);
  const cartSubtotal = cartLines.reduce(
    (sum, line) => sum + line.price * line.qty,
    0
  );
  const membershipPrice = planPrice(plan, interval);

  const orderLines = useMemo(() => {
    const lines = [
      {
        label: `${plan.name} membership`,
        amount: membershipPrice,
        detail: interval === "yearly" ? "Billed annually" : "Billed monthly",
      },
    ];
    for (const line of cartLines) {
      lines.push({
        label: line.name,
        amount: line.price * line.qty,
        detail: `Qty ${line.qty}`,
      });
    }
    return lines;
  }, [cartLines, interval, membershipPrice, plan.name]);

  const tax = (membershipPrice + cartSubtotal) * 0.08;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="space-y-2">
        <span className="badge">Secure checkout</span>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Complete your purchase
        </h1>
        <p className="max-w-2xl text-sm text-ink-muted sm:text-base">
          Premium billing flow inspired by{" "}
          <a
            href="https://billingsdk.com/docs"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-2 hover:underline"
          >
            Billing SDK
          </a>
          . Submitting fires analytics events for SightHog replay testing.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <form
          className="space-y-6 rounded-2xl border border-line bg-surface-raised p-6 shadow-card sm:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitting(true);
            trackFunnelPayment();
            setMessage(
              "Payment authorized (demo). Open the dashboard in ~30s to view replay."
            );
            void fetch("https://httpbin.org/post", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ demo: true, plan: plan.id, method }),
            }).catch(() => undefined);
            setSubmitting(false);
          }}
        >
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Payment method
            </h2>
            <PaymentMethodSelector value={method} onChange={setMethod} />
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Billing details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" id="name" placeholder="Alex Morgan" />
              <Field
                label="Email"
                id="email"
                type="email"
                placeholder="alex@company.com"
                required
              />
            </div>

            {method === "card" && (
              <div className="space-y-4 rounded-xl border border-line bg-surface p-4">
                <Field
                  label="Card number"
                  id="card"
                  placeholder="4242 4242 4242 4242"
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Expiry" id="expiry" placeholder="12 / 28" />
                  <Field label="CVC" id="cvc" placeholder="123" />
                </div>
              </div>
            )}

            <Field label="Country" id="country" as="select">
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
            </Field>
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-ink-muted">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent" />
            <p>
              Payments are simulated in this demo. No card is charged. SightHog
              captures this flow for session replay and funnel analytics.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60"
            )}
          >
            <Sparkles className="size-4" />
            {submitting ? "Processing…" : "Pay securely"}
          </button>
        </form>

        <OrderSummary lines={orderLines} tax={tax} />
      </div>

      {message && (
        <p className="toast" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  id,
  placeholder,
  type = "text",
  required,
  as,
  children,
}: {
  label: string;
  id: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  as?: "select";
  children?: React.ReactNode;
}) {
  const className =
    "mt-1.5 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/20";

  return (
    <label className="block text-sm font-medium text-ink" htmlFor={id}>
      {label}
      {as === "select" ? (
        <select id={id} name={id} className={className} defaultValue="US">
          {children}
        </select>
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          required={required}
          className={className}
        />
      )}
    </label>
  );
}
