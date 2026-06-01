import type { ReplayController } from "@/components/ReplayControls";
import type rrwebPlayer from "rrweb-player";

/** Control playback via rrweb-player (works with mutable event copies). */
export function createReplayController(
  player: InstanceType<typeof rrwebPlayer>
): ReplayController {
  return {
    play: () => player.play(),
    pause: () => player.pause(),
    toggle: () => player.toggle(),
    goto: (timeMs: number) => player.goto(timeMs, false),
    setSpeed: (speed: number) => player.setSpeed(speed),
    toggleSkipInactive: () => player.toggleSkipInactive(),
  };
}

/** Size and center the rrweb iframe inside the playback viewport. */
export function fitReplayerToViewport(
  host: HTMLElement,
  viewportWidth: number,
  viewportHeight: number
): void {
  const playerEl = host.querySelector(".rr-player") as HTMLElement | null;
  const frameEl = host.querySelector(".rr-player__frame") as HTMLElement | null;
  const wrapper = host.querySelector(".replayer-wrapper") as HTMLElement | null;
  const iframe = host.querySelector(
    ".replayer-wrapper iframe"
  ) as HTMLIFrameElement | null;

  if (!playerEl || !frameEl || !wrapper || !iframe) {
    return;
  }

  const vw = Math.max(1, viewportWidth);
  const vh = Math.max(1, viewportHeight);

  playerEl.style.width = `${vw}px`;
  playerEl.style.height = `${vh}px`;
  frameEl.style.width = `${vw}px`;
  frameEl.style.height = `${vh}px`;
  frameEl.style.position = "relative";
  frameEl.style.overflow = "hidden";

  const iw = iframe.offsetWidth;
  const ih = iframe.offsetHeight;
  if (iw <= 0 || ih <= 0) {
    return;
  }

  const scale = Math.min(vw / iw, vh / ih);
  wrapper.style.position = "absolute";
  wrapper.style.left = "50%";
  wrapper.style.top = "50%";
  wrapper.style.transformOrigin = "top left";
  wrapper.style.transform = `scale(${scale}) translate(-50%, -50%)`;
}
