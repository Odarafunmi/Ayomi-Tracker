'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

import { useApp } from './providers';

/**
 * Entry point: send returning users to Today and new users to onboarding.
 * Shows a calm pulsing mark while the store loads.
 */
export default function Home() {
  const router = useRouter();
  const { ready, profile } = useApp();

  useEffect(() => {
    if (!ready) return;
    router.replace(profile ? '/today' : '/onboarding');
  }, [ready, profile, router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <motion.div
        aria-hidden
        className="h-5 w-5 rounded-full bg-burgundy"
        animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="sr-only">Loading Ayomi Tracker…</span>
    </main>
  );
}
