// Ayomi Tracker — daily reminder job (Supabase Edge Function, Deno).
//
// Schedule daily with pg_cron, e.g.:
//   select cron.schedule(
//     'ayomi-daily-reminders',
//     '0 7 * * *',  -- every day at 07:00 UTC
//     $$ select net.http_post(
//          url := '<project-url>/functions/v1/send-reminders',
//          headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
//        ); $$
//   );
//
// Required secrets (supabase secrets set ...):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, REMINDER_FROM_EMAIL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DAY_MS = 86_400_000;
const REMINDER_LEAD_DAYS = 3;

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  average_cycle_length: number;
  average_period_length: number;
  consent_reminder_emails: boolean;
  remind_period: boolean;
  remind_ovulation: boolean;
  remind_phase_change: boolean;
}

interface CycleRow {
  user_id: string;
  start_date: string;
  end_date: string | null;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDay(d);
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / DAY_MS);
}

/** Learned average cycle length (mirrors the frontend engine). */
function effectiveCycleLength(starts: string[], fallback: number): number {
  if (starts.length < 2) return fallback;
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i += 1) lengths.push(diffDays(starts[i - 1], starts[i]));
  const recent = lengths.slice(-4);
  return Math.round(recent.reduce((s, n) => s + n, 0) / recent.length);
}

function ovulationDay(cycleLength: number, periodLength: number): number {
  return Math.min(Math.max(cycleLength - 14, periodLength + 2), cycleLength - 1);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('REMINDER_FROM_EMAIL') ?? 'Ayomi Tracker <reminders@ayomi.app>',
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
}

function emailShell(title: string, body: string): string {
  return `
  <div style="background:#F8F0E3;padding:32px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
    <div style="max-width:420px;margin:0 auto;background:#FFFBF5;border-radius:32px;padding:28px;">
      <p style="color:#7A5C60;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Ayomi Tracker</p>
      <h1 style="color:#3A0C1C;font-size:22px;margin:8px 0;">${title}</h1>
      <p style="color:#7A5C60;font-size:14px;line-height:1.6;">${body}</p>
      <p style="color:#B79A9E;font-size:11px;margin-top:24px;">
        Ayomi Tracker offers educational insights, not medical advice.
      </p>
    </div>
  </div>`;
}

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const today = isoDay(new Date());

    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('consent_reminder_emails', true)
      .not('email', 'is', null);
    if (pErr) throw pErr;

    const { data: cycles, error: cErr } = await supabase
      .from('cycles')
      .select('user_id, start_date, end_date')
      .order('start_date', { ascending: true });
    if (cErr) throw cErr;

    const cyclesByUser = new Map<string, CycleRow[]>();
    for (const c of cycles ?? []) {
      const list = cyclesByUser.get(c.user_id) ?? [];
      list.push(c);
      cyclesByUser.set(c.user_id, list);
    }

    let sent = 0;

    for (const profile of (profiles ?? []) as ProfileRow[]) {
      const userCycles = cyclesByUser.get(profile.id) ?? [];
      if (userCycles.length === 0 || !profile.email) continue;

      const starts = userCycles.map((c) => c.start_date);
      const lastStart = starts[starts.length - 1];
      const len = effectiveCycleLength(starts, profile.average_cycle_length);
      const cycleDay = diffDays(lastStart, today) + 1;

      const nextPeriod = addDays(lastStart, len);
      const daysToPeriod = diffDays(today, nextPeriod);
      const ovDay = ovulationDay(len, profile.average_period_length);
      const ovulation = addDays(lastStart, ovDay - 1);
      const fertileStart = addDays(ovulation, -5);
      const daysToFertile = diffDays(today, fertileStart);

      const name = profile.name || 'there';

      // 1. Period reminder (N days before).
      if (profile.remind_period && daysToPeriod === REMINDER_LEAD_DAYS) {
        await sendEmail(
          profile.email,
          `Your period is due in ${REMINDER_LEAD_DAYS} days`,
          emailShell(
            `Hi ${name} — your period is due in ${REMINDER_LEAD_DAYS} days`,
            `Based on your recent cycles, your next period is expected around <strong>${nextPeriod}</strong>. A warm moment to stock up and ease your schedule where you can.`,
          ),
        );
        sent += 1;
      }

      // 2. Fertile window reminder.
      if (profile.remind_ovulation && daysToFertile === 0) {
        await sendEmail(
          profile.email,
          'Your fertile window starts today',
          emailShell(
            `Hi ${name} — your fertile window starts today`,
            `Your estimated fertile window runs from <strong>${fertileStart}</strong> to <strong>${addDays(ovulation, 1)}</strong>. Ovulation is expected around <strong>${ovulation}</strong>.`,
          ),
        );
        sent += 1;
      }

      // 3. Phase change reminder: fires on day 1 of each phase.
      if (profile.remind_phase_change) {
        const phaseStartDays: Array<[string, number]> = [
          ['menstrual', 1],
          ['follicular', profile.average_period_length + 1],
          ['ovulation', ovDay - 1 < profile.average_period_length + 1 ? profile.average_period_length + 1 : ovDay - 1],
          ['luteal', ovDay + 2],
        ];
        const entered = phaseStartDays.find(([, day]) => day === cycleDay)?.[0];
        if (entered) {
          await sendEmail(
            profile.email,
            `You've entered your ${entered} phase`,
            emailShell(
              `Hi ${name} — you've entered your ${entered} phase`,
              `A new phase begins today. Open Ayomi Tracker to see what to expect for your mood, energy and body, and one gentle suggestion for the days ahead.`,
            ),
          );
          sent += 1;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent, date: today }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
