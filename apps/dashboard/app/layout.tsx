import type { Metadata } from "next";
import DashboardNav from "@/components/DashboardNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "SightHog Control Center",
  description: "Telemetry analytics and session replay dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative bg-background text-foreground antialiased">
        <div className="isolate relative flex min-h-svh flex-col">
          <DashboardNav />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
