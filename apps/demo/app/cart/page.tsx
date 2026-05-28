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
    <div className="page">
      <span className="badge">Cart</span>
      <h1>Your cart</h1>
      <p className="lead">Items persist in localStorage while you stay in this tab.</p>

      <div className="card">
        {lines.length === 0 ? (
          <p className="muted">Cart is empty. Add something from the catalog.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            {lines.map((line) => (
              <li key={line.slug}>
                {line.name} × {line.qty} — ${(line.price * line.qty).toFixed(2)}
              </li>
            ))}
          </ul>
        )}
        <p className="product-price" style={{ marginTop: "1rem" }}>
          Subtotal: ${total.toFixed(2)}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <Link href="/checkout" className="btn btn-primary">
            Go to checkout
          </Link>
          <button
            type="button"
            className="btn"
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
