"use client";

import { useEffect } from "react";
import Link from "next/link";
import RageClickZone from "@/components/RageClickZone";
import { trackFunnelViewProduct } from "@/lib/funnel";

export default function HomePage() {
  useEffect(() => {
    trackFunnelViewProduct();
  }, []);

  return (
    <div className="page">
      <span className="badge">Step 1 — funnel_view_product</span>
      <h1>Welcome to the demo store</h1>
      <p className="lead">
        Browse multiple pages in one browser tab. SightHog keeps a single session
        across client-side navigation so replay tabs and funnels stay accurate.
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Suggested test flow</h2>
        <ol className="muted">
          <li>Home (this page)</li>
          <li>
            <Link href="/catalog">Catalog</Link>
          </li>
          <li>
            <Link href="/product/headphones">Product detail</Link>
          </li>
          <li>
            <Link href="/cart">Cart</Link>
          </li>
          <li>
            <Link href="/checkout">Checkout</Link>
          </li>
        </ol>
        <Link href="/catalog" className="btn btn-primary">
          Start shopping
        </Link>
      </div>

      <RageClickZone />
    </div>
  );
}
