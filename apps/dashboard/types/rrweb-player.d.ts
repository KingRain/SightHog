declare module "rrweb-player" {
  import type { eventWithTime } from "@rrweb/types";

  interface RRwebPlayerOptions {
    target: HTMLElement;
    props: {
      events: eventWithTime[];
      width?: number;
      height?: number;
      autoPlay?: boolean;
      showController?: boolean;
      maxScale?: number;
      speed?: number;
      speedOption?: number[];
      tags?: Record<string, string>;
      inactiveColor?: string;
    };
  }

  interface RRwebPlayerMetadata {
    startTime: number;
    endTime: number;
    totalTime: number;
  }

  export default class rrwebPlayer {
    constructor(options: RRwebPlayerOptions);
    addEventListener(event: string, handler: (params: unknown) => void): void;
    addEvent(event: eventWithTime): void;
    getMetaData(): RRwebPlayerMetadata;
    getReplayer(): { getCurrentTime(): number };
    toggle(): void;
    setSpeed(speed: number): void;
    toggleSkipInactive(): void;
    triggerResize(): void;
    play(): void;
    pause(): void;
    goto(timeOffset: number, play?: boolean): void;
    $destroy(): void;
  }
}
