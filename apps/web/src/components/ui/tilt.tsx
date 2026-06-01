"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
} from "motion/react";

import { cn } from "@/lib/utils";

export interface TiltProps {
  children: React.ReactNode;
  className?: string;
  /** @default 11 */
  rotationFactor?: number;
  /** @default false */
  isReverse?: boolean;
  springOptions?: SpringOptions;
}

export function Tilt({
  children,
  className,
  rotationFactor = 11,
  isReverse = false,
  springOptions = { stiffness: 260, damping: 20 },
}: TiltProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, (v) => v * rotationFactor), springOptions);
  const rotateY = useSpring(
    useTransform(x, (v) => v * (isReverse ? -rotationFactor : rotationFactor)),
    springOptions,
  );

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const px = offsetX / rect.width - 0.5;
    const py = offsetY / rect.height - 0.5;
    x.set(px);
    y.set(py);
  };

  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 1000 }}
      className={cn("relative will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
