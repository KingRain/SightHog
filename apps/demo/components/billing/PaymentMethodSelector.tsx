"use client";

import { CreditCard, Landmark, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMethod = "card" | "bank" | "wallet";

const METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof CreditCard;
}[] = [
  {
    id: "card",
    label: "Card",
    description: "Visa, Mastercard, Amex",
    icon: CreditCard,
  },
  {
    id: "bank",
    label: "Bank transfer",
    description: "ACH · 2–3 business days",
    icon: Landmark,
  },
  {
    id: "wallet",
    label: "Digital wallet",
    description: "Apple Pay · Google Pay",
    icon: Wallet,
  },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

/** Billing SDK payment-method selector pattern */
export default function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {METHODS.map(({ id, label, description, icon: Icon }) => {
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition",
              selected
                ? "border-accent bg-accent/10 shadow-glow"
                : "border-line bg-surface hover:border-accent/30"
            )}
          >
            <Icon
              className={cn("size-5", selected ? "text-accent" : "text-ink-muted")}
            />
            <span className="text-sm font-semibold text-ink">{label}</span>
            <span className="text-xs text-ink-muted">{description}</span>
          </button>
        );
      })}
    </div>
  );
}
