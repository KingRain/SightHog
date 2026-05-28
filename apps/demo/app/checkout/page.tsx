"use client";

import { useEffect, useState } from "react";
import {
  trackFunnelOpenCheckout,
  trackFunnelPayment,
} from "@/lib/funnel";

export default function CheckoutPage() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    trackFunnelOpenCheckout();
  }, []);

  return (
    <div className="page">
      <span className="badge">Step 3–4 — checkout funnel</span>
      <h1>Checkout</h1>
      <p className="lead">
        Submitting fires funnel_payment and a sample network request for the log
        panel.
      </p>

      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          trackFunnelPayment();
          setMessage("Order submitted (demo). Wait ~30s, then open the dashboard.");
          void fetch("https://httpbin.org/post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ demo: true }),
          }).catch(() => {
            // errors are still useful in the frustration feed
          });
        }}
      >
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="form-row">
          <label htmlFor="card">Card number</label>
          <input id="card" name="card" placeholder="4242 4242 4242 4242" required />
        </div>
        <div className="form-row">
          <label htmlFor="shipping">Shipping</label>
          <select id="shipping" name="shipping" defaultValue="standard">
            <option value="standard">Standard (free)</option>
            <option value="express">Express ($12)</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Pay now
        </button>
      </form>

      {message && <p className="toast">{message}</p>}
    </div>
  );
}
