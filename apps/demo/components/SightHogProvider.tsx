"use client";

import { useEffect } from "react";
import { initSightHog } from "@sighthog/sdk";

export default function SightHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const endpoint =
      process.env.NEXT_PUBLIC_SDK_ENDPOINT ?? "http://localhost:8080/v1/events";

    initSightHog({
      endpoint,
      flushIntervalMs: 5000,
      maskAllInputs: true,
      maskSelectors: ["[data-sensitive]", "input[type='password']"],
    });
  }, []);

  return <>{children}</>;
}
