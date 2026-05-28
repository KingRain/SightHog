"use client";

const CART_KEY = "sighthog-demo-cart";

export interface CartLine {
  slug: string;
  name: string;
  price: number;
  qty: number;
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartLine[];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(lines));
}

export function addToCart(line: Omit<CartLine, "qty">, qty = 1): CartLine[] {
  const cart = readCart();
  const existing = cart.find((item) => item.slug === line.slug);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...line, qty });
  }
  writeCart(cart);
  return cart;
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}
