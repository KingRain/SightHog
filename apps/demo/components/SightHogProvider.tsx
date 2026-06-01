"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { captureFullSnapshot, initSightHog } from "@sighthog/sdk";

export default function SightHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const endpoint =
      process.env.NEXT_PUBLIC_SDK_ENDPOINT ?? "http://localhost:8080/v1/events";

    initSightHog({
      endpoint,
      flushIntervalMs: 5000,
      maskAllInputs: true,
      maskSelectors: ["[data-sensitive]", "input[type='password']"],
    });
  }, []);

  useEffect(() => {
    captureFullSnapshot();
  }, [pathname]);

  return <>{children}</>;
}
