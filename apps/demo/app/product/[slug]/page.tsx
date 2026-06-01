"use client";

import { useEffect } from "react";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";
import { trackFunnelViewProduct } from "@/lib/funnel";
import { getProduct } from "@/lib/products";

export default function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = getProduct(params.slug);

  useEffect(() => {
    trackFunnelViewProduct();
  }, []);

  if (!product) {
    return (
      <div className="space-y-4 py-12 text-center">
        <h1 className="font-display text-2xl text-ink">Product not found</h1>
        <Link href="/catalog" className="text-accent hover:underline">
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <span className="badge">Product — {product.slug}</span>
      <h1 className="font-display text-4xl font-semibold text-ink">{product.name}</h1>
      <p className="text-lg text-ink-muted">{product.description}</p>

      <div className="rounded-2xl border border-line bg-surface-raised p-8 shadow-card">
        <p className="font-display text-4xl font-semibold tabular-nums text-accent">
          ${product.price.toFixed(2)}
        </p>
        <div className="mt-6">
          <AddToCartButton
            slug={product.slug}
            name={product.name}
            price={product.price}
          />
        </div>
      </div>
    </div>
  );
}
