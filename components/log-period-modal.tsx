'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { addDays } from '@/lib/cycle/dates';
import { PrimaryButton, SecondaryButton } from './ui';

/**
 * Bottom-sheet style modal for logging a period: start date (required,
 * not in the future) and an optional end date (leave blank if ongoing).
 */
export function LogPeriodModal({
  open,
  onClose,
  today,
  periodLength,
  initialStart,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  today: string;
  periodLength: number;
  initialStart?: string;
  onSave: (start: string, end: string | null) => Promise<void> | void;
}) {
  const [start, setStart] = useState(initialStart ?? today);
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStart(initialStart ?? today);
      setEnd('');
      setError('');
    }
  }, [open, initialStart, today]);

  const suggestedEnd = start ? addDays(start, periodLength - 1) : '';

  async function handleSave() {
    if (!start) {
      setError('Please pick the day your period started.');
      return;
    }
    if (start > today) {
      setError('A period cannot start in the future.');
      return;
    }
    if (end && end < start) {
      setError('The end date cannot be before the start date.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave(start, end || null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-burgundy-deep/40 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Log a period"
            className="w-full max-w-sm rounded-card bg-surface p-6 shadow-glow"
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-[22px] font-semibold text-burgundy-deep">
              Log a period
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              One tap is all it takes — predictions adjust straight away.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted">
                  Started
                </span>
                <input
                  type="date"
                  value={start}
                  max={today}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full rounded-2xl border border-cream-deep bg-cream/60 px-4 py-3 text-[15px] font-medium text-burgundy-deep"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted">
                  Ended <span className="font-normal normal-case">(optional — skip if ongoing)</span>
                </span>
                <input
                  type="date"
                  value={end}
                  min={start || undefined}
                  max={today}
                  placeholder={suggestedEnd}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full rounded-2xl border border-cream-deep bg-cream/60 px-4 py-3 text-[15px] font-medium text-burgundy-deep"
                />
              </label>

              {error && (
                <p role="alert" className="rounded-2xl bg-error/10 px-4 py-2.5 text-[13px] font-medium text-error">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <SecondaryButton onClick={onClose} className="flex-1">
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Saving…' : 'Save'}
              </PrimaryButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
