'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useApp } from '@/app/providers';
import { AmberPill } from '@/components/amber-pill';
import { EASE_OUT } from '@/components/motion';
import { NumberStepper } from '@/components/number-stepper';
import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { MEDICAL_DISCLAIMER } from '@/lib/cycle/content';
import { addDays, todayISO } from '@/lib/cycle/dates';

const TOTAL_STEPS = 5;

const stepVariants = {
  enter: { opacity: 0, y: 24 },
  center: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: 'easeIn' as const } },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { ready, profile, completeOnboarding, seedDemo } = useApp();

  const [step, setStep] = useState(0);
  const [lastPeriodStart, setLastPeriodStart] = useState(addDays(todayISO(), -9));
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consentHealth, setConsentHealth] = useState(false);
  const [consentEmails, setConsentEmails] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ready && profile) router.replace('/today');
  }, [ready, profile, router]);

  if (!ready || profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-5 w-5 animate-pulse-dot rounded-full bg-burgundy" aria-hidden />
        <span className="sr-only">Loading…</span>
      </main>
    );
  }

  async function next() {
    setError('');
    if (step === 1) {
      if (!lastPeriodStart) {
        setError('Please pick a date — a rough guess is fine.');
        return;
      }
      if (lastPeriodStart > todayISO()) {
        setError('That date is in the future.');
        return;
      }
    }
    if (step === 4) {
      if (!consentHealth) {
        setError('We need your consent to store cycle data before we can continue.');
        return;
      }
      setSaving(true);
      await completeOnboarding({
        name,
        email: consentEmails ? email : '',
        lastPeriodStart,
        averageCycleLength: cycleLength,
        averagePeriodLength: periodLength,
        consentReminderEmails: consentEmails && Boolean(email.trim()),
      });
      setSaving(false);
      router.replace('/today');
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  async function demo() {
    setSaving(true);
    await seedDemo();
    setSaving(false);
    router.replace('/today');
  }

  const headings = [
    <>
      Your cycle,
      <br />
      finally <AmberPill>explained</AmberPill>
    </>,
    <>
      When did your last <AmberPill>period</AmberPill> start?
    </>,
    <>
      How long is your <AmberPill>cycle</AmberPill>, usually?
    </>,
    <>
      And how many <AmberPill>bleeding</AmberPill> days?
    </>,
    <>
      A quick word on <AmberPill>privacy</AmberPill>
    </>,
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-8">
      {/* Brand + progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-burgundy font-serif text-[15px] font-bold text-cream">
            A
          </span>
          <span className="font-serif text-[17px] font-semibold text-burgundy-deep">
            Ayomi Tracker
          </span>
        </div>
        <ol className="flex gap-1.5" aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <li
              key={i}
              aria-hidden
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? 'w-6 bg-burgundy' : 'w-1.5 bg-cream-deep'
              }`}
            />
          ))}
        </ol>
      </div>

      <div className="relative mt-10 flex-1">
        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            aria-live="polite"
          >
            <h1 className="text-balance font-serif text-[34px] font-semibold leading-[1.15] tracking-tight text-burgundy-deep">
              {headings[step]}
            </h1>

            {step === 0 && (
              <div className="mt-5 space-y-4">
                <p className="text-[15px] leading-relaxed text-muted">
                  Ayomi predicts your period, explains each hormone phase, and gently flags
                  anything unusual — so your cycle never catches you off guard again.
                </p>
                <ul className="space-y-2.5">
                  {[
                    ['#D6336C', 'Know exactly when your period is due'],
                    ['#F2A33A', 'See your fertile window and ovulation day'],
                    ['#2BB3A3', 'Understand your mood, energy and body in every phase'],
                  ].map(([color, text]) => (
                    <li key={text} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-pill">
                      <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[14px] font-medium text-burgundy-deep">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step === 1 && (
              <div className="mt-5">
                <p className="text-[15px] leading-relaxed text-muted">
                  A close guess works — Ayomi refines predictions as you log.
                </p>
                <input
                  type="date"
                  value={lastPeriodStart}
                  max={todayISO()}
                  onChange={(e) => setLastPeriodStart(e.target.value)}
                  aria-label="First day of your last period"
                  className="mt-4 w-full rounded-2xl border border-cream-deep bg-surface px-4 py-3.5 text-[16px] font-medium text-burgundy-deep shadow-pill"
                />
              </div>
            )}

            {step === 2 && (
              <div className="mt-5">
                <p className="text-[15px] leading-relaxed text-muted">
                  From the first day of one period to the first day of the next. Not sure?
                  28 is a classic starting point.
                </p>
                <div className="mt-4">
                  <NumberStepper
                    value={cycleLength}
                    min={21}
                    max={40}
                    onChange={setCycleLength}
                    label="average cycle length"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  {[26, 28, 30, 32].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCycleLength(n)}
                      className={`tabular rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                        cycleLength === n
                          ? 'bg-burgundy text-cream'
                          : 'bg-surface text-burgundy shadow-pill hover:bg-cream-deep'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-5">
                <p className="text-[15px] leading-relaxed text-muted">
                  How many days does your bleeding usually last? Anywhere from 2 to 8 is
                  typical.
                </p>
                <div className="mt-4">
                  <NumberStepper
                    value={periodLength}
                    min={2}
                    max={10}
                    onChange={setPeriodLength}
                    label="average period length"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="mt-5 space-y-4">
                <p className="text-[15px] leading-relaxed text-muted">
                  Your cycle data is health data, and we treat it that way. It is used
                  only to power your predictions and insights — never sold, never shared.
                </p>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted">
                    What should we call you?
                  </span>
                  <input
                    type="text"
                    value={name}
                    placeholder="Your name"
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-cream-deep bg-surface px-4 py-3 text-[15px] font-medium text-burgundy-deep shadow-pill"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted">
                    Email for reminders <span className="font-normal normal-case">(optional)</span>
                  </span>
                  <input
                    type="email"
                    value={email}
                    placeholder="you@example.com"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-cream-deep bg-surface px-4 py-3 text-[15px] font-medium text-burgundy-deep shadow-pill"
                  />
                </label>

                <div className="space-y-2.5 rounded-3xl bg-surface p-4 shadow-pill">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={consentHealth}
                      onChange={(e) => setConsentHealth(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded-md accent-burgundy"
                    />
                    <span className="text-[13px] leading-snug text-burgundy-deep">
                      I consent to Ayomi storing my cycle data to provide predictions and
                      insights. <span className="text-muted">(Required — NDPA)</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={consentEmails}
                      onChange={(e) => setConsentEmails(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded-md accent-burgundy"
                    />
                    <span className="text-[13px] leading-snug text-burgundy-deep">
                      Send me reminder emails before my period and fertile window.
                      <span className="text-muted"> (Optional)</span>
                    </span>
                  </label>
                </div>

                <p className="text-[12px] leading-relaxed text-muted">
                  By continuing you agree to our{' '}
                  <Link href="/privacy" className="font-semibold text-burgundy-soft underline">
                    privacy policy
                  </Link>
                  . {MEDICAL_DISCLAIMER}
                </p>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-2xl bg-error/10 px-4 py-2.5 text-[13px] font-medium text-error">
                {error}
              </p>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-8 space-y-3">
        <div className="flex gap-3">
          {step > 0 && (
            <SecondaryButton onClick={back} aria-label="Back" className="!px-4">
              <ArrowLeft size={18} aria-hidden />
            </SecondaryButton>
          )}
          <PrimaryButton onClick={next} disabled={saving} className="flex-1">
            {step === TOTAL_STEPS - 1 ? (
              <>
                <ShieldCheck size={17} aria-hidden />
                {saving ? 'Setting up…' : 'Start tracking'}
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={17} aria-hidden />
              </>
            )}
          </PrimaryButton>
        </div>

        {step === 0 && (
          <button
            type="button"
            onClick={demo}
            disabled={saving}
            className="w-full py-2 text-center text-[14px] font-semibold text-burgundy-soft underline-offset-4 transition-colors hover:text-burgundy hover:underline"
          >
            Just exploring? Try the demo →
          </button>
        )}
      </div>
    </main>
  );
}
