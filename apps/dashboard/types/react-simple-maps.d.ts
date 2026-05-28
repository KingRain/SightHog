declare module "react-simple-maps" {
  import type { ReactNode, CSSProperties } from "react";

  export interface Geography {
    rsmKey: string;
    properties: Record<string, string | number | undefined>;
  }

  export function ComposableMap(props: {
    projection?: string;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  }): JSX.Element;

  export function ZoomableGroup(props: {
    center?: [number, number];
    zoom?: number;
    children?: ReactNode;
  }): JSX.Element;

  export function Geographies(props: {
    geography: string | object;
    children: (args: { geographies: Geography[] }) => ReactNode;
  }): JSX.Element;

  export function Geography(props: {
    geography: Geography;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: Record<string, CSSProperties>;
  }): JSX.Element;
}
