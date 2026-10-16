'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

/** Signature easing from the style guide: soft, slow, purposeful. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Page-load stagger: cards fade up with a 60ms stagger over 500ms. */
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

/** Hook carrying the reduced-motion preference for imperative animations. */
export function useSoftMotion(): { reduce: boolean; seconds: (n: number) => number } {
  const reduce = Boolean(useReducedMotion());
  return { reduce, seconds: (n: number) => (reduce ? 0 : n) };
}

/** Staggered fade-up wrapper for a page section. */
export function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      transition={{ delay }}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

/** Root of a staggered page. */
export function StaggerPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerParent} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}
