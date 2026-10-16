'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

import { useApp } from '@/app/providers';
import { PHASE_CONTENT } from '@/lib/cycle/content';

/**
 * Ambient glow that leans toward the pointer — two soft, phase-tinted blobs
 * drifting on springs. Desktop (fine pointer) only; purely decorative.
 */
export function PointerGlow() {
  const { status } = useApp();
  const [enabled, setEnabled] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x1 = useSpring(mx, { stiffness: 42, damping: 20, mass: 0.8 });
  const y1 = useSpring(my, { stiffness: 42, damping: 20, mass: 0.8 });
  const x2 = useSpring(useMotionValue(0), { stiffness: 30, damping: 22, mass: 1 });
  const y2 = useSpring(useMotionValue(0), { stiffness: 30, damping: 22, mass: 1 });

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!fine.matches) return;
    setEnabled(true);
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      mx.set(nx * 36);
      my.set(ny * 28);
      x2.set(nx * -26);
      y2.set(ny * -20);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [mx, my, x2, y2]);

  if (!enabled) return null;

  const phaseColor = status ? PHASE_CONTENT[status.phase].color : '#D6336C';

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute -left-32 -top-24 h-96 w-96 rounded-full opacity-[0.16] blur-3xl transition-colors duration-700"
        style={{ x: x1, y: y1, backgroundColor: phaseColor }}
      />
      <motion.div
        className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-burgundy opacity-[0.07] blur-3xl"
        style={{ x: x2, y: y2 }}
      />
    </div>
  );
}
