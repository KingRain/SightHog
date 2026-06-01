import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { Features } from "@/components/sections/features";
import { InstallSection } from "@/components/sections/install";
import { HowItWorks } from "@/components/sections/how-it-works";
import { UseCases } from "@/components/sections/use-cases";
import { FAQ } from "@/components/sections/faq";
import { CTA } from "@/components/sections/cta";

import { DocsIntro } from "@/pages/docs/intro";
import { DocsInstallation } from "@/pages/docs/installation";
import { DocsQuickStart } from "@/pages/docs/quick-start";
import { DocsConfiguration } from "@/pages/docs/configuration";
import { DocsApiReference } from "@/pages/docs/api-reference";
import { DocsEventTypes } from "@/pages/docs/event-types";
import { DocsFrustration } from "@/pages/docs/frustration";
import { DocsPrivacy } from "@/pages/docs/privacy";
import { DocsSelfHosting } from "@/pages/docs/self-hosting";
import { DocsArchitecture } from "@/pages/docs/architecture";
import { DocsIngestApi } from "@/pages/docs/ingest-api";

function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Features />
      <InstallSection />
      <HowItWorks />
      <UseCases />
      <FAQ />
      <CTA />
    </>
  );
}

function ScrollToHash() {
  const { hash, pathname, key } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(
          () => el.scrollIntoView({ behavior: "smooth", block: "start" }),
          30,
        );
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [hash, pathname, key]);
  return null;
}

function App() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="bg-noise pointer-events-none fixed inset-0 z-0 opacity-[0.6] mix-blend-overlay" />
      <ScrollToHash />
      <div className="relative z-10">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<DocsIntro />} />
          <Route path="/docs/installation" element={<DocsInstallation />} />
          <Route path="/docs/quick-start" element={<DocsQuickStart />} />
          <Route path="/docs/configuration" element={<DocsConfiguration />} />
          <Route path="/docs/api-reference" element={<DocsApiReference />} />
          <Route path="/docs/event-types" element={<DocsEventTypes />} />
          <Route path="/docs/frustration" element={<DocsFrustration />} />
          <Route path="/docs/privacy" element={<DocsPrivacy />} />
          <Route path="/docs/self-hosting" element={<DocsSelfHosting />} />
          <Route path="/docs/architecture" element={<DocsArchitecture />} />
          <Route path="/docs/ingest-api" element={<DocsIngestApi />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <Footer />
      </div>
    </div>
  );
}

export default App;
