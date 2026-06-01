import type { Metadata } from "next";
import "@fontsource-variable/dm-sans/wght.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import SightHogProvider from "@/components/SightHogProvider";
import SiteChrome from "@/components/SiteChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "SightHog Store — Premium Demo",
  description: "Modern billing demo for SightHog session replay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SightHogProvider>
          <SiteChrome>{children}</SiteChrome>
        </SightHogProvider>
      </body>
    </html>
  );
}
