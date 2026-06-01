import { Fragment, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type KbdSize = "sm" | "md" | "lg";

interface KbdProps extends HTMLAttributes<HTMLElement> {
  size?: KbdSize;
  children: ReactNode;
}

interface ShortcutProps extends HTMLAttributes<HTMLSpanElement> {
  keys: string[];
  separator?: ReactNode;
  size?: KbdSize;
}

function Kbd({ size = "md", children, className, ...props }: KbdProps) {
  const sizeClass: Record<KbdSize, string> = {
    sm: "h-[1.125rem] min-w-[1.125rem] px-1 text-[10px]",
    md: "h-[1.375rem] min-w-[1.375rem] px-1.5 text-[11px]",
    lg: "h-7 min-w-7 px-2 text-xs",
  };

  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded font-mono font-medium leading-none select-none",
        "border border-b-2 border-border bg-muted text-muted-foreground",
        "shadow-[inset_0_-1px_0_color-mix(in_srgb,var(--foreground)_6%,transparent)]",
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

function Shortcut({
  keys,
  separator = "+",
  size = "md",
  className,
  ...props
}: ShortcutProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={keys.join(separator === "+" ? " + " : " then ")}
      {...props}
    >
      {keys.map((key, i) => (
        <Fragment key={`${key}-${i}`}>
          <Kbd size={size}>{key}</Kbd>
          {i < keys.length - 1 && (
            <span
              className="px-0.5 text-[10px] font-medium text-muted-foreground/60"
              aria-hidden
            >
              {separator}
            </span>
          )}
        </Fragment>
      ))}
    </span>
  );
}

export { Kbd, Shortcut };
export type { KbdProps, ShortcutProps, KbdSize };
