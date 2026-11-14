"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

/** DESIGN.md → Motion. Gentle ease-out, no overshoot. */
export const EASE_SOFT = [0.22, 1, 0.36, 1] as const;
export const EASE_BREATHE = [0.45, 0, 0.55, 1] as const;

/** Fade + 12px rise. Use `delay` (or `index` for 60ms stagger) in lists. */
export function FadeRise({
  index = 0,
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { index?: number; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -8 }}
      transition={{ duration: 0.5, ease: EASE_SOFT, delay: delay + index * 0.06 }}
      {...props}
    />
  );
}

/** Slow breathing loop: 4s in, 6s out. */
export function Breath({
  scale = 1.06,
  ...props
}: HTMLMotionProps<"div"> & { scale?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      animate={reduced ? undefined : { scale: [1, scale, 1] }}
      transition={{ duration: 10, times: [0, 0.4, 1], ease: EASE_BREATHE, repeat: Infinity }}
      {...props}
    />
  );
}

/** Pill button with soft press feedback. */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: HTMLMotionProps<"button"> & { variant?: "primary" | "secondary" | "ghost" | "care" }) {
  const styles = {
    primary: "h-14 bg-action text-on-action",
    secondary: "h-13 bg-neutral text-on-neutral",
    ghost: "h-13 border border-neutral text-neutral bg-transparent",
    care: "h-13 bg-care text-white",
  }[variant];
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: EASE_SOFT }}
      className={`inline-flex items-center justify-center rounded-full px-8 text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
}
