declare module "rrweb-player" {
  import type { eventWithTime } from "@rrweb/types";

  interface RRwebPlayerOptions {
    target: HTMLElement;
    props: {
      events: eventWithTime[];
      width?: number;
      height?: number;
      maxScale?: number;
      autoPlay?: boolean;
      skipInactive?: boolean;
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
    getReplayer(): {
      getCurrentTime(): number;
      play(timeOffset?: number): void;
      pause(timeOffset?: number): void;
      setConfig(config: { speed?: number; skipInactive?: boolean }): void;
      on(event: string, handler: (payload?: unknown) => void): void;
      service: { state: { matches: (state: string) => boolean } };
    };
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
