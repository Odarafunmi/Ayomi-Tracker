'use client';

import {
  motion,
  useMotionValue,
  useSpring,
  type HTMLMotionProps,
} from 'framer-motion';
import { useRef, type ReactNode } from 'react';

const MAX_TILT = 5;

/**
 * Hover tilt wrapper: the card leans a few degrees toward the pointer
 * (desktop only) and settles back on a soft spring.
 */
export function Tilt({
  children,
  className = '',
  ...props
}: HTMLMotionProps<'div'> & { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, { stiffness: 260, damping: 24, mass: 0.6 });
  const rotateY = useSpring(rawY, { stiffness: 260, damping: 24, mass: 0.6 });

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(-py * MAX_TILT * 2);
    rawY.set(px * MAX_TILT * 2);
  }

  function handleLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
