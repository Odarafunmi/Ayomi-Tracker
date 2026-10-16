import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Ayomi Tracker collects, uses and protects your health data (NDPA compliant).',
};

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: 'What we collect',
    body: [
      'Ayomi Tracker stores only what it needs to work: your name (optional), email (optional, for reminders), your average cycle and period lengths, and the period dates you log. This is health-related data, and we treat it with the highest level of care.',
      'We do not collect location, contacts, device identifiers for advertising, or any data from other apps.',
    ],
  },
  {
    title: 'How we use it',
    body: [
      'Your data is used exclusively to calculate your cycle predictions, show phase insights, and — if you opt in — send reminder emails. Predictions run in your browser; your history is only stored, never analysed for any other purpose.',
      'We never sell, rent or share your data with third parties, and we never show advertising.',
    ],
  },
  {
    title: 'Where it is stored',
    body: [
      'In local (demo) mode, everything stays in your browser on your device and never touches a server.',
      'When account sync is enabled, your data lives in a secured Supabase (PostgreSQL) database protected by Row Level Security, so each account can only ever read its own rows.',
    ],
  },
  {
    title: 'Your rights under the NDPA',
    body: [
      'Under the Nigeria Data Protection Act (2023) you have the right to access, correct, export and delete your personal data at any time. Settings → Your data lets you export everything as JSON or permanently erase it in one tap.',
      'You may withdraw consent at any time by deleting your data; this takes effect immediately and requires no explanation.',
    ],
  },
  {
    title: 'Data retention',
    body: [
      'We keep your data only for as long as your profile exists. Deleting your data removes it permanently from the browser or database, including reminder preferences.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'Questions about privacy? Reach the team at privacy@ayomi.app and we will respond within 7 days.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md px-5 pb-16 pt-8">
      <Link
        href="/today"
        className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[14px] font-semibold text-burgundy shadow-pill transition-colors hover:bg-cream-deep"
      >
        <ArrowLeft size={16} aria-hidden />
        Back
      </Link>

      <h1 className="mt-6 font-serif text-[30px] font-semibold tracking-tight text-burgundy-deep">
        Privacy policy
      </h1>
      <p className="mt-1 text-[13px] text-muted">
        Last updated 1 October 2026 · Compliant with the Nigeria Data Protection Act (NDPA, 2023)
      </p>

      <div className="mt-6 space-y-4">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-card bg-surface p-5 shadow-pill">
            <h2 className="font-serif text-[18px] font-semibold text-burgundy-deep">
              {section.title}
            </h2>
            {section.body.map((p, i) => (
              <p key={i} className="mt-2 text-[14px] leading-relaxed text-muted">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
