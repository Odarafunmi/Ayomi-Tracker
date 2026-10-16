'use client';

import { motion } from 'framer-motion';

import { ENERGY_CURVE } from '@/lib/cycle/content';
import type { CycleStatus } from '@/lib/cycle/types';
import { useSoftMotion } from './motion';

const W = 100;
const H = 46;
const PAD_TOP = 6;
const PAD_BOTTOM = 10;

function yFor(level: number): number {
  return H - PAD_BOTTOM - (level / 10) * (H - PAD_TOP - PAD_BOTTOM);
}

function xFor(frac: number): number {
  return frac * W;
}

/** Interpolated energy level at a given cycle-day fraction (0..1). */
export function energyAt(frac: number): number {
  const pts = ENERGY_CURVE;
  if (frac <= pts[0].frac) return pts[0].level;
  for (let i = 1; i < pts.length; i += 1) {
    if (frac <= pts[i].frac) {
      const t = (frac - pts[i - 1].frac) / (pts[i].frac - pts[i - 1].frac);
      return pts[i - 1].level + t * (pts[i].level - pts[i - 1].level);
    }
  }
  return pts[pts.length - 1].level;
}

/** Catmull-Rom → cubic Bézier smooth path through the energy points. */
function smoothPath(): string {
  const pts = ENERGY_CURVE.map((p) => ({ x: xFor(p.frac), y: yFor(p.level) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Typical energy across the cycle. The line draws itself in via
 * stroke-dashoffset and the amber "today" marker pops in last.
 */
export function EnergyChart({
  status,
  tone = 'light',
  showBands = false,
}: {
  status: CycleStatus;
  tone?: 'light' | 'dark';
  showBands?: boolean;
}) {
  const { seconds } = useSoftMotion();
  const frac = Math.min(status.cycleDay / status.effectiveCycleLength, 1);
  const marker = { x: xFor(frac), y: yFor(energyAt(frac)) };
  const line = tone === 'dark' ? '#F8F0E3' : '#6D1A36';
  const guide = tone === 'dark' ? 'rgba(248,240,227,0.28)' : 'rgba(122,92,96,0.25)';

  const bands = showBands
    ? [
        { from: 0, to: status.boundaries.menstrualEnd / status.effectiveCycleLength, color: '#D6336C' },
        {
          from: status.boundaries.menstrualEnd / status.effectiveCycleLength,
          to: status.boundaries.ovulationStart / status.effectiveCycleLength,
          color: '#2BB3A3',
        },
        {
          from: status.boundaries.ovulationStart / status.effectiveCycleLength,
          to: status.boundaries.ovulationEnd / status.effectiveCycleLength,
          color: '#F2A33A',
        },
        { from: status.boundaries.ovulationEnd / status.effectiveCycleLength, to: 1, color: '#9B7EDE' },
      ]
    : [];

  return (
    <div className="relative">
      {showBands && (
        <div aria-hidden className="absolute inset-0 flex overflow-hidden rounded-2xl">
          {bands.map((b, i) => (
            <div
              key={i}
              style={{
                width: `${(b.to - b.from) * 100}%`,
                backgroundColor: `${b.color}14`,
              }}
            />
          ))}
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="relative h-36 w-full"
        role="img"
        aria-label="Typical energy across the cycle, with today marked"
      >
        {/* Dotted guides. */}
        {[2, 5, 8].map((lvl) => (
          <line
            key={lvl}
            x1={0}
            x2={W}
            y1={yFor(lvl)}
            y2={yFor(lvl)}
            stroke={guide}
            strokeWidth={0.4}
            strokeDasharray="1.6 2"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Energy line. */}
        <motion.path
          d={smoothPath()}
          fill="none"
          stroke={line}
          strokeWidth={1.4}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ duration: seconds(0.9), ease: 'easeInOut' }}
        />

        {/* Today marker — pops in after the line. */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-20px' }}
          transition={{ delay: seconds(0.8), type: 'spring', stiffness: 400, damping: 18 }}
          style={{ transformBox: 'fill-box' }}
        >
          <circle cx={marker.x} cy={marker.y} r={3.4} fill="#F2A33A" opacity={0.35} />
          <circle cx={marker.x} cy={marker.y} r={1.8} fill="#F2A33A" stroke={tone === 'dark' ? '#3A0C1C' : '#FFFBF5'} strokeWidth={0.5} />
        </motion.g>
      </svg>
    </div>
  );
}
