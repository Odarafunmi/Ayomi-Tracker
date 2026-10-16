'use client';

import { LayoutGroup, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { PhaseCharacter } from '@/components/phase-character';
import { Tilt } from '@/components/tilt';
import { PHASE_CONTENT, PHASE_ORDER } from '@/lib/cycle/content';
import type { CycleStatus, PhaseId } from '@/lib/cycle/types';
import { fadeUp } from './motion';

function rangeLabel(phase: PhaseId, status: CycleStatus): string {
  const b = status.boundaries;
  switch (phase) {
    case 'menstrual':
      return `Days 1–${b.menstrualEnd}`;
    case 'follicular': {
      const start = b.menstrualEnd + 1;
      return start <= b.ovulationStart - 1 ? `Days ${start}–${b.ovulationStart - 1}` : 'Between phases';
    }
    case 'ovulation':
      return `Days ${b.ovulationStart}–${b.ovulationEnd}`;
    case 'luteal':
      return `Days ${b.ovulationEnd + 1}–${b.cycleLength}`;
  }
}

const TILE_BG: Record<PhaseId, string> = {
  menstrual: 'tile-menstrual',
  follicular: 'tile-follicular',
  ovulation: 'tile-ovulation',
  luteal: 'tile-luteal',
};

const DRIFT: Record<PhaseId, string> = {
  menstrual: 'animate-drift-slow',
  follicular: 'animate-drift-slower',
  ovulation: 'animate-drift-slow',
  luteal: 'animate-drift-slower',
};

const layoutSpring = { type: 'spring' as const, stiffness: 320, damping: 32 };

/**
 * The four frosted glass phase tiles. Your current phase stars in the big
 * ringed tile with the phase character; tap any small tile and it swaps into
 * the spotlight with a springy layout animation.
 */
export function PhaseTiles({ status }: { status: CycleStatus }) {
  const current = status.phase;
  const [featured, setFeatured] = useState<PhaseId>(current);

  // Always return the spotlight to the real current phase when it changes.
  useEffect(() => setFeatured(current), [current]);

  const order: PhaseId[] = [featured, ...PHASE_ORDER.filter((p) => p !== featured)];

  return (
    <div>
      <h2 className="sr-only">Your four phases</h2>
      <LayoutGroup>
        <div className="grid grid-cols-2 gap-3">
          {order.map((phase, i) => {
            const c = PHASE_CONTENT[phase];
            const isFeatured = i === 0;
            const isCurrent = phase === current;
            const isWideLast = !isFeatured && i === 3;

            return (
              <motion.article
                key={phase}
                layout
                variants={fadeUp}
                transition={layoutSpring}
                className={isFeatured ? 'col-span-2' : isWideLast ? 'col-span-2' : ''}
                aria-label={`${c.name} phase, ${rangeLabel(phase, status)}${isCurrent ? ' — current' : ''}`}
              >
                <Tilt className="h-full">
                  <motion.button
                    type="button"
                    layout="position"
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    onClick={() => setFeatured(phase)}
                    aria-pressed={isFeatured}
                    className={`glass-tile ${TILE_BG[phase]} flex h-full w-full rounded-tile text-left ${
                      isFeatured
                        ? `${DRIFT[phase]} min-h-48 items-center justify-between gap-4 p-5 ring-2 ring-surface/90`
                        : `tile-muted ${isWideLast ? 'min-h-24 flex-row items-center justify-between gap-3' : 'min-h-28 flex-col'} p-4`
                    }`}
                  >
                    {isFeatured ? (
                      <>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-burgundy-deep/70">
                            <span
                              aria-hidden
                              className={`h-2 w-2 rounded-full bg-burgundy-deep ${isCurrent ? 'animate-pulse-dot' : ''}`}
                            />
                            {isCurrent ? 'Now' : 'Peek'}
                          </p>
                          <h3 className="mt-1 font-serif text-[26px] font-semibold leading-tight text-burgundy-deep">
                            {c.name}
                          </h3>
                          <span className="mt-1 inline-block rounded-full bg-surface/70 px-3 py-1 text-[12px] font-semibold text-burgundy-deep/80 backdrop-blur">
                            {rangeLabel(phase, status)}
                          </span>
                          <p className="mt-3 max-w-[16rem] text-[13.5px] font-medium leading-snug text-burgundy-deep/85">
                            {isCurrent ? `${c.mood} · ${c.energy.toLowerCase()}` : c.why}
                          </p>
                        </div>
                        <motion.div
                          key={phase}
                          initial={{ opacity: 0, x: 14, scale: 0.9 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        >
                          <PhaseCharacter phase={phase} size={104} />
                        </motion.div>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <h3 className="font-serif text-[18px] font-semibold leading-tight text-burgundy-deep">
                            {c.name}
                          </h3>
                          <p className="mt-0.5 text-[12px] font-medium text-burgundy-deep/70">
                            {rangeLabel(phase, status)}
                          </p>
                        </div>
                        <p
                          className={`text-[12px] font-semibold text-burgundy-deep/60 ${
                            isWideLast ? 'rounded-full bg-surface/60 px-3 py-1' : 'mt-2'
                          }`}
                        >
                          {isWideLast ? 'Tap to peek →' : c.short}
                        </p>
                      </>
                    )}
                  </motion.button>
                </Tilt>
              </motion.article>
            );
          })}
        </div>
      </LayoutGroup>
    </div>
  );
}
