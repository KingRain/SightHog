export interface Product {
  slug: string;
  name: string;
  price: number;
  description: string;
}

export const PRODUCTS: Product[] = [
  {
    slug: "headphones",
    name: "Pro Headphones",
    price: 149,
    description: "Wireless noise cancelling headphones for daily use.",
  },
  {
    slug: "lamp",
    name: "Desk Lamp",
    price: 59,
    description: "Adjustable LED lamp with warm and cool modes.",
  },
  {
    slug: "hub",
    name: "USB-C Hub",
    price: 79,
    description: "Seven-port hub with HDMI and fast charging.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
