"use client";

import { SectionHeader } from "@/components/sections/features";
import { MotionAccordion } from "@/components/ui/motion-faqs-accordion";

const FAQS = [
  {
    question: "Is SightHog a SaaS product?",
    answer:
      "No. SightHog is an open-source SDK plus a reference backend you run on your own infrastructure. There's no hosted tier, no per-seat fees, and no data leaving your network. Apache 2.0 licensed.",
  },
  {
    question: "How heavy is the SDK on the client?",
    answer:
      "The core SDK ships at ~6 kB gzipped (rrweb is dynamically imported and only loaded after init). It batches every 5 seconds and uses sendBeacon on tab close, so it won't compete with your app for main-thread time.",
  },
  {
    question: "Can I disable replay for sensitive pages?",
    answer:
      "Yes. Pass blockSelectors to exclude any subtree (e.g. your chat widget), or call stopSightHog() before navigating to a sensitive route. You can also re-init with a fresh sessionId at any time.",
  },
  {
    question: "Where does the data live?",
    answer:
      "Wherever you put it. The reference stack uses Postgres for metadata, ClickHouse for analytics, and SeaweedFS for replay blobs — but the SDK only POSTs JSON to your endpoint, so you're free to swap any of those out.",
  },
  {
    question: "How is PII handled?",
    answer:
      "The SDK supports maskSelectors, blockSelectors, and maskAllInputs. The ingest API also masks common credit-card / SSN patterns by default. Sensitive fields never reach your replay storage.",
  },
  {
    question: "Do I have to use rrweb?",
    answer:
      "rrweb is the default recorder because it's battle-tested. If you only want interaction / telemetry, you can pass { record: false } and ship events without DOM capture. Future adapters (e.g. OpenTelemetry) are planned.",
  },
  {
    question: "How does frustration detection work?",
    answer:
      "The SDK counts clicks per element within a 1.2s window — three or more becomes a rage_click. A click on a non-interactive element (no role, no handler) is flagged as a dead_click. Console errors during the same window become error_click.",
  },
  {
    question: "Can I tag sessions with my own user id?",
    answer:
      "Absolutely. Pass userId in your initSightHog() call. The SDK will persist it in sessionStorage for the rest of the tab session and include it on every event batch.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions, answered."
          description="If you don't see your question here, open an issue on GitHub or jump into the community Discord."
        />
        <div className="mt-12">
          <MotionAccordion items={FAQS} gap={10} />
        </div>
      </div>
    </section>
  );
}
