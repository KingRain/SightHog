"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackFunnelViewProduct } from "@/lib/funnel";
import { PRODUCTS } from "@/lib/products";

export default function CatalogPage() {
  useEffect(() => {
    trackFunnelViewProduct();
  }, []);

  return (
    <div className="page">
      <span className="badge">Catalog</span>
      <h1>Product catalog</h1>
      <p className="lead">Each product links to its own route for page-tab replay.</p>

      <div className="grid">
        {PRODUCTS.map((product) => (
          <article key={product.slug} className="card">
            <h3 style={{ marginTop: 0 }}>{product.name}</h3>
            <p className="muted">{product.description}</p>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <Link
              href={`/product/${product.slug}`}
              className="btn btn-primary"
              style={{ marginTop: "0.75rem" }}
            >
              View product
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
