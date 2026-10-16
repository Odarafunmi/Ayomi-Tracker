'use client';

import { motion } from 'framer-motion';
import { Cloud, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useApp } from '@/app/providers';
import { AmberPill } from '@/components/amber-pill';
import { StaggerPage, fadeUp } from '@/components/motion';
import { NumberStepper } from '@/components/number-stepper';
import { PrimaryButton, SecondaryButton, Toggle } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/store';

export default function SettingsPage() {
  const { profile, cycles, mode, updateProfile, deleteEverything } = useApp();
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [name, setName] = useState(profile?.name ?? '');

  if (!profile) return null;

  const cloud = isSupabaseConfigured();

  function exportData() {
    if (!profile) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Ayomi Tracker',
      profile,
      cycles,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayomi-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    await deleteEverything();
    router.replace('/onboarding');
  }

  const reminderRows: Array<{
    key: 'period' | 'ovulation' | 'phaseChange';
    title: string;
    detail: string;
  }> = [
    { key: 'period', title: 'Period reminder', detail: 'An email 3 days before your predicted period.' },
    { key: 'ovulation', title: 'Fertile window reminder', detail: 'An email when your fertile window begins.' },
    { key: 'phaseChange', title: 'Phase change reminder', detail: 'A gentle note when you move into a new phase.' },
  ];

  return (
    <StaggerPage className="space-y-4">
      <motion.header variants={fadeUp} className="px-1 pt-2">
        <h1 className="font-serif text-[28px] font-semibold tracking-tight text-burgundy-deep">
          Make it <AmberPill>yours</AmberPill>
        </h1>
        <p className="mt-1 text-[14px] text-muted">Profile, reminders and your data.</p>
      </motion.header>

      {/* Profile */}
      <motion.section variants={fadeUp} aria-label="Profile" className="rounded-card bg-surface p-5 shadow-pill">
        <h2 className="font-serif text-[19px] font-semibold text-burgundy-deep">Profile</h2>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted">
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => updateProfile({ name: name.trim() || 'Friend' })}
            className="w-full rounded-2xl border border-cream-deep bg-cream/60 px-4 py-3 text-[15px] font-medium text-burgundy-deep"
          />
        </label>

        <div className="mt-4 space-y-3">
          <div>
            <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted">
              Average cycle length
            </span>
            <NumberStepper
              value={profile.averageCycleLength}
              min={21}
              max={40}
              onChange={(n) => updateProfile({ averageCycleLength: n })}
              label="average cycle length"
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted">
              Average period length
            </span>
            <NumberStepper
              value={profile.averagePeriodLength}
              min={2}
              max={10}
              onChange={(n) => updateProfile({ averagePeriodLength: n })}
              label="average period length"
            />
          </div>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Predictions also learn from the cycles you log, so they get more personal over time.
        </p>
      </motion.section>

      {/* Email reminders */}
      <motion.section variants={fadeUp} aria-label="Email reminders" className="rounded-card bg-surface p-5 shadow-pill">
        <h2 className="font-serif text-[19px] font-semibold text-burgundy-deep">Email reminders</h2>
        <p className="mt-0.5 text-[13px] text-muted">So a phase change never catches you off guard.</p>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-muted">
            Email address
          </span>
          <input
            type="email"
            value={profile.email}
            placeholder="you@example.com"
            onChange={(e) => updateProfile({ email: e.target.value })}
            className="w-full rounded-2xl border border-cream-deep bg-cream/60 px-4 py-3 text-[15px] font-medium text-burgundy-deep"
          />
        </label>

        <ul className="mt-4 space-y-3">
          {reminderRows.map((row) => (
            <li key={row.key} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-burgundy-deep">{row.title}</p>
                <p className="text-[12px] text-muted">{row.detail}</p>
              </div>
              <Toggle
                checked={profile.reminders[row.key]}
                onChange={(next) =>
                  updateProfile({ reminders: { ...profile.reminders, [row.key]: next } })
                }
                label={row.title}
              />
            </li>
          ))}
        </ul>

        <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-[12px] leading-relaxed text-muted">
          {cloud
            ? 'Reminders are sent by our daily scheduled job once they are switched on.'
            : 'You are in local demo mode, so reminders are saved for your account but no emails are sent. Connect Supabase and the reminder function to switch them on.'}
        </p>
      </motion.section>

      {/* Account & sync */}
      <motion.section variants={fadeUp} aria-label="Account and sync" className="rounded-card bg-surface p-5 shadow-pill">
        <h2 className="flex items-center gap-2 font-serif text-[19px] font-semibold text-burgundy-deep">
          <Cloud size={18} aria-hidden /> Account &amp; sync
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          {cloud
            ? `Connected to Supabase (mode: ${mode}). Your data is synced and protected by Row Level Security.`
            : 'Account sign-in and cross-device sync run on Supabase. Add your project keys to .env.local (see .env.example) and restart to enable it — until then everything stays privately in this browser.'}
        </p>
      </motion.section>

      {/* Your data */}
      <motion.section variants={fadeUp} aria-label="Your data" className="rounded-card bg-surface p-5 shadow-pill">
        <h2 className="font-serif text-[19px] font-semibold text-burgundy-deep">Your data</h2>
        <p className="mt-0.5 text-[13px] text-muted">
          Your cycle data belongs to you. Export it or erase it at any time.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <SecondaryButton onClick={exportData} className="flex-1">
            <Download size={16} aria-hidden />
            Export JSON
          </SecondaryButton>
          <PrimaryButton
            onClick={handleDelete}
            className={`flex-1 ${confirmingDelete ? 'bg-burgundy-deep hover:bg-burgundy-deep' : ''}`}
          >
            <Trash2 size={16} aria-hidden />
            {confirmingDelete ? 'Tap again to erase' : 'Delete everything'}
          </PrimaryButton>
        </div>
        {confirmingDelete && (
          <p role="alert" className="mt-3 rounded-2xl bg-cream-deep/70 px-4 py-2.5 text-[13px] font-semibold text-burgundy-deep">
            This permanently deletes your profile and every logged cycle. There is no undo.
          </p>
        )}
      </motion.section>

      {/* Privacy & consent */}
      <motion.section variants={fadeUp} aria-label="Privacy and consent" className="rounded-card bg-surface p-5 shadow-pill">
        <h2 className="font-serif text-[19px] font-semibold text-burgundy-deep">Privacy &amp; consent</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          You consented to health-data storage on{' '}
          {new Date(profile.consent.consentedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          . You can withdraw consent at any time by deleting your data above.
        </p>
        <Link
          href="/privacy"
          className="mt-3 inline-block text-[14px] font-semibold text-burgundy-soft underline-offset-4 hover:underline"
        >
          Read the privacy policy →
        </Link>
      </motion.section>
    </StaggerPage>
  );
}
