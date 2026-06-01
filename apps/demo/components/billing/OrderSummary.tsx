import { cn } from "@/lib/utils";

export interface OrderLine {
  label: string;
  amount: number;
  detail?: string;
}

interface OrderSummaryProps {
  lines: OrderLine[];
  tax?: number;
  className?: string;
}

/** Billing SDK order summary / invoice preview pattern */
export default function OrderSummary({
  lines,
  tax = 0,
  className,
}: OrderSummaryProps) {
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const total = subtotal + tax;

  return (
    <aside
      className={cn(
        "rounded-2xl border border-line bg-surface-raised p-6 shadow-card",
        className
      )}
    >
      <h2 className="font-display text-lg font-semibold text-ink">Order summary</h2>
      <p className="mt-1 text-sm text-ink-muted">Review before you pay</p>

      <ul className="mt-6 space-y-4 border-b border-line pb-6">
        {lines.map((line) => (
          <li key={line.label} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">{line.label}</p>
              {line.detail && (
                <p className="text-xs text-ink-muted">{line.detail}</p>
              )}
            </div>
            <span className="text-sm tabular-nums text-ink">
              ${line.amount.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-ink-muted">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">${subtotal.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between text-ink-muted">
          <dt>Tax</dt>
          <dd className="tabular-nums">${tax.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
          <dt>Total due today</dt>
          <dd className="tabular-nums">${total.toFixed(2)}</dd>
        </div>
      </dl>
    </aside>
  );
}
