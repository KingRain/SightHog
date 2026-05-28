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
      <div className="page">
        <h1>Product not found</h1>
        <Link href="/catalog" className="btn">
          Back to catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <span className="badge">Product — {product.slug}</span>
      <h1>{product.name}</h1>
      <p className="lead">{product.description}</p>
      <div className="card">
        <p className="product-price">${product.price.toFixed(2)}</p>
        <AddToCartButton
          slug={product.slug}
          name={product.name}
          price={product.price}
        />
      </div>
    </div>
  );
}
