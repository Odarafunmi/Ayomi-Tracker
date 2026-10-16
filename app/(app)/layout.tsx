'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { FloatingNav } from '@/components/floating-nav';
import { PointerGlow } from '@/components/pointer-glow';
import { useApp } from '@/app/providers';

/**
 * Shell for the signed-in area: warm canvas, floating nav pill, and a
 * single-column canvas that keeps the app card-like on every screen size.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const { ready, profile, cycles, deleteEverything } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace('/onboarding');
  }, [ready, profile, router]);

  if (!ready || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-5 w-5 animate-pulse-dot rounded-full bg-burgundy" aria-hidden />
        <span className="sr-only">Loading…</span>
      </main>
    );
  }

  // A profile always needs at least one logged cycle to compute predictions.
  if (cycles.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="rounded-card bg-surface p-8 shadow-glow">
          <h1 className="font-serif text-[22px] font-semibold text-burgundy-deep">
            Let&apos;s start fresh
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            There are no cycles logged yet, so there is nothing to predict. Set up again to
            get new predictions.
          </p>
          <button
            type="button"
            onClick={async () => {
              await deleteEverything();
              router.replace('/onboarding');
            }}
            className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-burgundy px-6 text-[15px] font-semibold text-cream shadow-pill"
          >
            Set up Ayomi
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="relative min-h-screen">
      <PointerGlow />
      <FloatingNav />
      <main className="relative z-10 mx-auto w-full max-w-md px-4 pb-32 pt-6 md:pt-24">
        {children}
      </main>
    </div>
  );
}
