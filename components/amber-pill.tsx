import type { ReactNode } from 'react';

/**
 * The style guide's highlight device: one key word per screen sits on an
 * amber pill (bg-ovulation, burgundy-deep text).
 */
export function AmberPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block whitespace-nowrap rounded-full bg-phase-ovulation px-3 py-0.5 align-baseline font-semibold text-burgundy-deep">
      {children}
    </span>
  );
}
