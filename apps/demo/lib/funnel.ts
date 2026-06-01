import { trackEvent } from "@httperror/sighthog";

export function trackFunnelViewProduct(): void {
  trackEvent("funnel_view_product");
}

export function trackFunnelAddCart(): void {
  trackEvent("funnel_add_cart");
}

export function trackFunnelOpenCheckout(): void {
  trackEvent("funnel_open_checkout");
}

export function trackFunnelPayment(): void {
  trackEvent("funnel_payment");
}
