"use client";

import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import { trackFunnelAddCart } from "@/lib/funnel";

export default function AddToCartButton({
  slug,
  name,
  price,
}: {
  slug: string;
  name: string;
  price: number;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
      onClick={() => {
        trackFunnelAddCart();
        addToCart({ slug, name, price });
        router.push("/cart");
      }}
    >
      Add to cart
    </button>
  );
}
