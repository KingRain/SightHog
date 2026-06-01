"use client";

export default function RageClickZone() {
  return (
    <div className="rage-zone space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-red-300/90">
        Frustration testing
      </p>
      <p className="text-sm text-ink-muted">
        Click this button five or more times within two seconds to trigger rage-click detection.
      </p>
      <button
        type="button"
        className="inline-flex h-10 items-center rounded-xl border border-red-400/40 bg-red-500/10 px-4 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        id="rage-test-btn"
      >
        Broken checkout button
      </button>
    </div>
  );
}
