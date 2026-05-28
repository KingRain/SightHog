"use client";

import { useEffect, useRef } from "react";
import {
  markerPercent,
  TIMELINE_MARKER_COLORS,
  type TimelineMarker,
} from "@/lib/session-markers";

interface TimelineMarkerOverlayProps {
  playerRoot: HTMLElement | null;
  markers: TimelineMarker[];
  sessionStartTimeMs: number;
  totalDurationMs: number;
  onSeek?: (timeMs: number) => void;
}

export default function TimelineMarkerOverlay({
  playerRoot,
  markers,
  sessionStartTimeMs,
  totalDurationMs,
  onSeek,
}: TimelineMarkerOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!playerRoot) {
      return;
    }

    const timeline = playerRoot.querySelector(".rr-timeline");
    if (!(timeline instanceof HTMLElement)) {
      return;
    }

    timeline.style.position = "relative";
    timeline.style.overflow = "visible";

    const overlay = document.createElement("div");
    overlay.className = "replay-timeline-marker-layer";
    overlayRef.current = overlay;
    timeline.appendChild(overlay);

    return () => {
      overlay.remove();
      overlayRef.current = null;
    };
  }, [playerRoot]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }

    overlay.replaceChildren();

    for (const marker of markers) {
      const percent = markerPercent(
        marker.timestamp,
        sessionStartTimeMs,
        totalDurationMs
      );

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `replay-timeline-marker replay-timeline-marker--${marker.kind}`;
      dot.style.left = `${percent}%`;
      dot.style.backgroundColor = TIMELINE_MARKER_COLORS[marker.kind];
      dot.title = marker.label;
      dot.setAttribute("aria-label", marker.label);

      dot.addEventListener("click", (event) => {
        event.stopPropagation();
        const relativeMs = marker.timestamp - sessionStartTimeMs;
        onSeek?.(Math.max(0, relativeMs));
      });

      overlay.appendChild(dot);
    }
  }, [markers, sessionStartTimeMs, totalDurationMs, onSeek]);

  return null;
}

function decoratePlayerControls(root: HTMLElement): () => void {
  const btnContainer = root.querySelector(".rr-controller__btns");
  if (!(btnContainer instanceof HTMLElement)) {
    return () => {};
  }

  const buttons = Array.from(btnContainer.querySelectorAll("button"));
  const speedButtons = buttons.filter((button) =>
    /^\d+(\.\d+)?x$/.test(button.textContent?.trim() ?? "")
  );

  if (speedButtons.length > 0 && !btnContainer.querySelector(".replay-speed-segment")) {
    const group = document.createElement("div");
    group.className = "replay-speed-segment";
    speedButtons[0].before(group);
    speedButtons.forEach((button) => group.appendChild(button));
  }

  for (const button of buttons) {
    const label = button.textContent?.trim().toLowerCase() ?? "";
    if (label.includes("skip") && label.includes("inactive")) {
      button.classList.add("replay-skip-inactive-btn");
    }
  }

  const observer = new MutationObserver(() => {
    for (const button of speedButtons) {
      const pressed =
        button.getAttribute("aria-pressed") === "true" ||
        button.classList.contains("active");
      button.classList.toggle("replay-speed-active", pressed);
    }
    const skipBtn = btnContainer.querySelector(".replay-skip-inactive-btn");
    if (skipBtn instanceof HTMLElement) {
      const active =
        skipBtn.getAttribute("aria-pressed") === "true" ||
        skipBtn.classList.contains("active");
      skipBtn.classList.toggle("replay-skip-inactive-active", active);
    }
  });

  observer.observe(btnContainer, {
    attributes: true,
    subtree: true,
    attributeFilter: ["class", "aria-pressed"],
  });

  return () => observer.disconnect();
}

export { decoratePlayerControls };
