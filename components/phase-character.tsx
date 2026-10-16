'use client';

import { motion } from 'framer-motion';

import type { PhaseId } from '@/lib/cycle/types';

const CAPTIONS: Record<PhaseId, string> = {
  menstrual: 'resting with tea',
  follicular: 'full of energy',
  ovulation: 'feeling radiant',
  luteal: 'winding down with a book',
};

/**
 * The phase character: a warm flat illustration that breathes gently (slow
 * float) and perks up with a little wave on hover. Loops are transform-only
 * and switch off automatically under prefers-reduced-motion.
 */
export function PhaseCharacter({
  phase,
  size = 96,
  className = '',
  rounded = 'rounded-[24px]',
}: {
  phase: PhaseId;
  size?: number;
  className?: string;
  rounded?: string;
}) {
  return (
    <motion.div
      aria-hidden
      className={`shrink-0 overflow-hidden bg-surface/60 ring-1 ring-cream-deep/70 shadow-pill ${rounded} ${className}`}
      style={{ width: size, height: size }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.img
        src={`/characters/${phase}.png`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        className="h-full w-full select-none object-cover"
        whileHover={{ scale: 1.08, rotate: -2.5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
        title={`She is ${CAPTIONS[phase]} in this phase`}
      />
    </motion.div>
  );
}
