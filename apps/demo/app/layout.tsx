import type { Metadata } from "next";
import SightHogProvider from "@/components/SightHogProvider";
import SiteChrome from "@/components/SiteChrome";
import "./globals.css";

export const metadata: Metadata = {
  title: "SightHog Demo Store",
  description: "Multi-page demo site for SightHog session replay",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SightHogProvider>
          <SiteChrome>{children}</SiteChrome>
        </SightHogProvider>
      </body>
    </html>
  );
}
