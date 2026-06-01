import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  animate?: boolean;
}

function ShimmerSkeleton({
  className,
  rounded = "md",
  animate = true,
  ...props
}: ShimmerSkeletonProps) {
  const roundedClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "relative overflow-hidden bg-muted",
        roundedClass,
        className,
      )}
      {...props}
    >
      {animate && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full unlumen-shimmer-sweep"
        />
      )}
    </div>
  );
}

export { ShimmerSkeleton };
export type { ShimmerSkeletonProps };
