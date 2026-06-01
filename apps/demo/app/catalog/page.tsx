"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { trackFunnelViewProduct } from "@/lib/funnel";
import { PRODUCTS } from "@/lib/products";

export default function CatalogPage() {
  useEffect(() => {
    trackFunnelViewProduct();
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="badge">Catalog</span>
        <h1 className="font-display text-3xl font-semibold text-ink">Hardware add-ons</h1>
        <p className="text-ink-muted">
          Pair physical products with your membership. Each route becomes a replay page tab.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((product) => (
          <article
            key={product.slug}
            className="group flex flex-col rounded-2xl border border-line bg-surface-raised p-6 shadow-card transition hover:border-accent/30"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent/10 text-lg font-bold text-accent">
              {product.name.slice(0, 1)}
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">{product.name}</h3>
            <p className="mt-2 flex-1 text-sm text-ink-muted">{product.description}</p>
            <p className="mt-4 font-display text-2xl font-semibold tabular-nums text-accent">
              ${product.price.toFixed(2)}
            </p>
            <Link
              href={`/product/${product.slug}`}
              className="mt-4 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-semibold text-accent-foreground transition hover:opacity-90"
            >
              View product
              <ArrowUpRight className="size-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
