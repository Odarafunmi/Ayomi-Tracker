'use client';

import { Battery, Heart, Waves } from 'lucide-react';

import { AmberPill } from '@/components/amber-pill';
import { EnergyChart } from '@/components/energy-chart';
import { MEDICAL_DISCLAIMER, PHASE_CONTENT } from '@/lib/cycle/content';
import type { CycleStatus } from '@/lib/cycle/types';
import { fadeUp } from './motion';
import { motion } from 'framer-motion';

/**
 * The burgundy anchor card: today's insight with mood, energy and body
 * notes, plus a small cream energy chart with an amber marker.
 */
export function InsightCard({ status }: { status: CycleStatus }) {
  const content = PHASE_CONTENT[status.phase];
  const [before, after] = content.headline.split(content.highlight);

  const rows = [
    { icon: Heart, label: 'Mood', value: content.mood },
    { icon: Battery, label: 'Energy', value: content.energy },
    { icon: Waves, label: 'Body', value: content.body },
  ];

  return (
    <motion.section
      variants={fadeUp}
      aria-label="Today's insight"
      className="rounded-card bg-anchor p-6 text-cream shadow-glow"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-cream/60">
        Today&apos;s insight
      </p>

      <h2 className="text-balance mt-2 font-serif text-[24px] font-semibold leading-snug">
        {before}
        <AmberPill>{content.highlight}</AmberPill>
        {after}
      </h2>

      <p className="mt-2 text-[14px] leading-relaxed text-cream/80">{content.why}</p>
      <p className="mt-1 text-[14px] leading-relaxed text-cream/80">{content.suggestion}</p>

      <div className="mt-5 space-y-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-full bg-cream/10 px-4 py-2.5"
          >
            <Icon size={16} className="shrink-0 text-cream/80" aria-hidden />
            <span className="w-14 shrink-0 text-[12px] font-semibold uppercase tracking-wide text-cream/60">
              {label}
            </span>
            <span className="text-[13px] font-medium text-cream/90">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl bg-cream/10 p-4">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-cream/60">
            Energy this cycle
          </span>
          <span className="text-[12px] font-medium text-cream/60">Typical pattern</span>
        </div>
        <EnergyChart status={status} tone="dark" />
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-cream/50">{MEDICAL_DISCLAIMER}</p>
    </motion.section>
  );
}
