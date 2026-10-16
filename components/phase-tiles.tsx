'use client';

import { motion } from 'framer-motion';

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

const DRIFT = ['animate-drift-slow', 'animate-drift-slower', 'animate-drift-slow', 'animate-drift-slower'];

/**
 * The four frosted glass phase tiles. The current phase is larger, ringed in
 * surface, with a slowly drifting glow; the others stay muted.
 */
export function PhaseTiles({ status }: { status: CycleStatus }) {
  const current = status.phase;
  const others = PHASE_ORDER.filter((p) => p !== current);
  const drift = DRIFT[PHASE_ORDER.indexOf(current)];
  const content = PHASE_CONTENT[current];

  return (
    <div>
      <h2 className="sr-only">Your four phases</h2>
      <div className="grid grid-cols-2 gap-3">
        {/* Current phase — hero tile. */}
        <motion.article
          variants={fadeUp}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`glass-tile ${TILE_BG[current]} ${drift} col-span-2 flex min-h-44 flex-col justify-between rounded-tile p-5 ring-2 ring-surface/90`}
          aria-label={`Current phase: ${content.name}, ${rangeLabel(current, status)}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-burgundy-deep/70">
                <span aria-hidden className="h-2 w-2 animate-pulse-dot rounded-full bg-burgundy-deep" />
                Now
              </p>
              <h3 className="mt-1 font-serif text-[26px] font-semibold leading-tight text-burgundy-deep">
                {content.name}
              </h3>
            </div>
            <span className="rounded-full bg-surface/70 px-3 py-1 text-[12px] font-semibold text-burgundy-deep/80 backdrop-blur">
              {rangeLabel(current, status)}
            </span>
          </div>
          <p className="mt-3 text-[14px] font-medium leading-snug text-burgundy-deep/85">
            {content.mood} · {content.energy.toLowerCase()}
          </p>
        </motion.article>

        {/* The other three phases stay muted. */}
        {others.map((phase, i) => {
          const c = PHASE_CONTENT[phase];
          return (
            <motion.article
              key={phase}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`glass-tile ${TILE_BG[phase]} tile-muted flex min-h-28 flex-col justify-between rounded-tile p-4 ${
                i === 2 ? 'col-span-2 min-h-24 flex-row items-center' : ''
              }`}
              aria-label={`${c.name} phase, ${rangeLabel(phase, status)}`}
            >
              <div>
                <h3 className="font-serif text-[18px] font-semibold leading-tight text-burgundy-deep">
                  {c.name}
                </h3>
                <p className="mt-0.5 text-[12px] font-medium text-burgundy-deep/70">
                  {rangeLabel(phase, status)}
                </p>
              </div>
              <p className={`mt-2 text-[12px] font-medium text-burgundy-deep/70 ${i === 2 ? 'mt-0 text-right' : ''}`}>
                {c.short}
              </p>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
