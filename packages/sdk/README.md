# @httperror/sighthog

The official browser telemetry and session replay SDK for **SightHog**.

> **Publishing:** See [PUBLISHING.md](./PUBLISHING.md). Package name on npm: `@httperror/sighthog`.

SightHog captures pixel-accurate DOM replay (via `rrweb`), user interactions (clicks, scrolls, custom events), browser logs (console logs, unhandled exceptions), network performance, and Core Web Vitals to deliver a complete dashboard for session playback and product analytics.

---

## Features

- 📹 **Pixel-Accurate Session Replay** — Complete DOM recording with high performance and smooth reproduction.
- ⚡ **Performance & Vitals** — Out-of-the-box tracking for Core Web Vitals (`LCP`, `INP`, `CLS`, `TTFB`) and network timing.
- 🖱️ **User Interaction Tracking** — Clicks, scrolls, and automatic frustration signal detection (rage clicks, dead clicks, error clicks).
- 🪵 **Console & Error Logger** — Captures console logs, uncaught exceptions, and unhandled promise rejections with stack traces.
- 🛡️ **Privacy by Default** — Highly configurable text masking and element blocking to exclude PII or sensitive inputs.
- 🪶 **Ultra Lightweight Bundle** — Tree-shakeable core (~6 kB gzipped). Peer dependencies like `rrweb` are loaded asynchronously after initialization.

---

## Installation

Install the SDK via your preferred package manager. Since `@httperror/sighthog` delegates DOM recording and metric capture to peer packages, make sure `rrweb` and `web-vitals` are also installed.

```bash
# Using npm
npm install @httperror/sighthog rrweb web-vitals

# Using pnpm
pnpm add @httperror/sighthog rrweb web-vitals

# Using yarn
yarn add @httperror/sighthog rrweb web-vitals
```

---

## Quick Start

Initialize the SDK once as early as possible in your application's entry point (e.g., `index.js`, `app.tsx`, or a React/Next.js root provider).

```typescript
import { initSightHog } from "@httperror/sighthog";

initSightHog({
  endpoint: "https://ingest.your-app.com/v1/events",
  maskAllInputs: true,
});
```

For server-side rendered (SSR) frameworks like Next.js, Remix, or Nuxt, the SDK is safe to load and initialize on the server — it will gracefully behave as a no-op on the server side and boot up only once it mounts in the client browser.

---

## API Reference

### `initSightHog(options: SightHogOptions): void`
Initializes the SDK, sets up console listeners, network recorders, and dynamic `rrweb` replay engines.
- **Parameters:** `options: SightHogOptions` (see [Configuration Options](#configuration-options))

### `stopSightHog(): void`
Completely stops telemetry tracking, stops DOM recording, unpatches console/network APIs, and tears down event listeners.

### `trackEvent(eventName: string, metricValue?: number): void`
Manually records a custom user interaction or product event.
- **`eventName`**: The unique name representing the custom action (e.g. `completed_onboarding`).
- **`metricValue`**: Optional numerical metric to associate with the event (defaults to `1`).

### `captureFullSnapshot(): void`
Forces the underlying recording engine to capture a new full DOM snapshot. Useful during client-side route transitions to ensure subsequent incremental changes map correctly to the DOM.

### `getSightHogSessionId(): string`
Returns the active logical `sessionId` stored in sessionStorage.

### `getSightHogVisitorId(): string`
Returns the persistent `visitorId` stored in localStorage.

### `resetSightHogSession(): void`
Clears session storage and invalidates the current session ID, forcing a new session ID to be generated on next reload.

---

## Configuration Options

Pass these options inside the `initSightHog` call:

| Option | Type | Required | Default | Description |
|:---|:---|:---:|:---|:---|
| `endpoint` | `string` | **Yes** | — | The HTTP POST URL of your SightHog Ingest API (e.g. `https://ingest.domain.com/v1/events`). |
| `sessionId` | `string` | No | *Auto-generated* | Custom session ID override. If empty, the SDK auto-generates a UUID and caches it in `sessionStorage` for the duration of the tab session. |
| `userId` | `string` | No | — | Optional custom user identity or account ID to associate with the session. |
| `flushIntervalMs` | `number` | No | `5000` | The frequency in milliseconds at which buffered telemetry and event batches are sent to the ingest API. |
| `maxBatchSize` | `number` | No | `500` | Force-flushes the batch buffer immediately once this number of raw events is accumulated. |
| `maskSelectors` | `string[]` | No | `[]` | Array of CSS selectors whose text content should be masked (replaced with asterisk characters) in playback. |
| `blockSelectors` | `string[]` | No | `[]` | Array of CSS selectors for elements that should be fully excluded from recording (e.g. chat widgets, credit card fields). |
| `maskAllInputs` | `boolean` | No | `false` | If set to `true`, masks the values of all form input elements (inputs, textareas, select dropdowns). |

---

## Privacy & Redaction

Protecting user PII (Personally Identifiable Information) is extremely important. SightHog provides powerful masking/redaction controls both dynamically and declaratively:

### 1. Element Masking
Mask text inside elements matching a specific selector:
```javascript
initSightHog({
  endpoint: "...",
  maskSelectors: [".user-profile-balance", "span.email-address"],
});
```

### 2. Blocking Elements
Prevent sensitive elements from being recorded or streamed altogether:
```javascript
initSightHog({
  endpoint: "...",
  blockSelectors: ["#payment-form-card-number", ".third-party-chat-iframe"],
});
```

### 3. Dynamic Masking via Classnames
Alternatively, you can mark elements directly in your HTML template using the utility classnames:
- Use class `sighthog-mask` to mask text.
- Use class `sighthog-block` to block element rendering.

```html
<p class="sighthog-mask">This text will be asterisks in the player</p>
<div class="sighthog-block">This whole div will appear blank in playback</div>
```

---

## License

Apache License 2.0. See [LICENSE](../../LICENSE) at the repository root.
