import { Suspense } from "react";
import CheckoutExperience from "./CheckoutExperience";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-ink-muted">
          Loading checkout…
        </div>
      }
    >
      <CheckoutExperience />
    </Suspense>
  );
}
