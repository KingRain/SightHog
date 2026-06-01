"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearCart, readCart, type CartLine } from "@/lib/cart";

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    setLines(readCart());
  }, []);

  const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <span className="badge">Cart</span>
        <h1 className="font-display text-3xl font-semibold text-ink">Your cart</h1>
        <p className="text-ink-muted">
          Items persist in localStorage while you stay in this tab.
        </p>
      </header>

      <div className="rounded-2xl border border-line bg-surface-raised p-6 shadow-card">
        {lines.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Cart is empty. Add something from the catalog.
          </p>
        ) : (
          <ul className="space-y-4">
            {lines.map((line) => (
              <li
                key={line.slug}
                className="flex items-center justify-between border-b border-line pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-ink">{line.name}</p>
                  <p className="text-xs text-ink-muted">Qty {line.qty}</p>
                </div>
                <span className="tabular-nums text-ink">
                  ${(line.price * line.qty).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm text-ink-muted">Subtotal</span>
          <span className="font-display text-2xl font-semibold tabular-nums text-accent">
            ${total.toFixed(2)}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/checkout"
            className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Go to checkout
          </Link>
          <button
            type="button"
            className="inline-flex h-11 items-center rounded-xl border border-line px-5 text-sm font-medium text-ink hover:border-accent/40"
            onClick={() => {
              clearCart();
              setLines([]);
            }}
          >
            Clear cart
          </button>
        </div>
      </div>
    </div>
  );
}
