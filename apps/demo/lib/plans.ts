/** Billing SDK–style plan shape (https://billingsdk.com/docs) */
export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

export const MEMBERSHIP_PLANS: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For solo builders testing session replay.",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "500 replay minutes / mo",
      "7-day retention",
      "Console & network logs",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For teams shipping product insights weekly.",
    priceMonthly: 49,
    priceYearly: 39,
    highlighted: true,
    badge: "Most popular",
    features: [
      "Unlimited replay minutes",
      "90-day retention",
      "Rage-click & dead-click alerts",
      "Heatmaps & funnels",
      "Priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    description: "For orgs with compliance and SSO needs.",
    priceMonthly: 149,
    priceYearly: 119,
    features: [
      "Everything in Pro",
      "1-year retention",
      "SSO & audit logs",
      "Custom PII rules",
      "Dedicated success manager",
    ],
  },
];

export type BillingInterval = "monthly" | "yearly";

export function planPrice(plan: BillingPlan, interval: BillingInterval): number {
  return interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
}
