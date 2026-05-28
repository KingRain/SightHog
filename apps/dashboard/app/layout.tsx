import type { Metadata } from "next";
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
    <html lang="en" className="dark">
      <body className="relative antialiased">
        <div className="isolate relative flex min-h-svh flex-col">{children}</div>
      </body>
    </html>
  );
}
