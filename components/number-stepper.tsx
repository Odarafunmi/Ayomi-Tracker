'use client';

import { Minus, Plus } from 'lucide-react';

/** Big-number stepper used for cycle and period length. */
export function NumberStepper({
  value,
  min,
  max,
  onChange,
  label,
  unit = 'days',
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
  unit?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div className="flex items-center justify-between rounded-3xl bg-cream px-4 py-3">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-burgundy shadow-pill transition-all hover:bg-cream-deep active:scale-95 disabled:opacity-40"
      >
        <Minus size={18} />
      </button>
      <div className="text-center">
        <span className="tabular text-[34px] font-bold leading-none text-burgundy-deep">
          {value}
        </span>
        <span className="ml-1.5 text-[13px] font-medium text-muted">{unit}</span>
      </div>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-burgundy shadow-pill transition-all hover:bg-cream-deep active:scale-95 disabled:opacity-40"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
