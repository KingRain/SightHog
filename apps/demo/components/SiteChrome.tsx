"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/catalog", label: "Catalog" },
  { href: "/product/headphones", label: "Product" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
];

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="site">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">SH</span>
          <div>
            <p className="brand-title">SightHog Store</p>
            <p className="brand-sub">Multi-page demo for replay testing</p>
          </div>
        </div>
        <nav className="site-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="nav-cta"
          >
            Dashboard
          </a>
        </nav>
      </header>
      <main className="site-main">{children}</main>
    </div>
  );
}
