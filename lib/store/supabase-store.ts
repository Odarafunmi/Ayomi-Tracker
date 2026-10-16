'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { CycleEntry } from '@/lib/cycle/types';
import { sortCycles } from '@/lib/cycle/engine';
import type { DataStore, Profile } from './types';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when the app has been configured with Supabase credentials. */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

let client: SupabaseClient | null = null;

/** Shared browser client (auth persists in localStorage). */
export function getSupabase(): SupabaseClient {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  average_cycle_length: number;
  average_period_length: number;
  consent_health_data: boolean;
  consent_reminder_emails: boolean;
  consented_at: string | null;
  remind_period: boolean;
  remind_ovulation: boolean;
  remind_phase_change: boolean;
  created_at: string;
}

interface CycleRow {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    averageCycleLength: row.average_cycle_length,
    averagePeriodLength: row.average_period_length,
    createdAt: row.created_at,
    consent: {
      healthData: row.consent_health_data,
      reminderEmails: row.consent_reminder_emails,
      consentedAt: row.consented_at ?? row.created_at,
    },
    reminders: {
      period: row.remind_period,
      ovulation: row.remind_ovulation,
      phaseChange: row.remind_phase_change,
    },
  };
}

function toCycle(row: CycleRow): CycleEntry {
  return { id: row.id, startDate: row.start_date, endDate: row.end_date };
}

/**
 * Supabase-backed store. Every query runs under Row Level Security, so the
 * signed-in user can only ever see and mutate their own rows.
 */
export class SupabaseStore implements DataStore {
  readonly mode = 'supabase' as const;

  private sb = getSupabase();

  private async userId(): Promise<string> {
    const { data, error } = await this.sb.auth.getUser();
    if (error || !data.user) throw new Error('Not signed in');
    return data.user.id;
  }

  async getProfile(): Promise<Profile | null> {
    let uid: string;
    try {
      uid = await this.userId();
    } catch {
      return null;
    }
    const { data, error } = await this.sb
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (error) throw error;
    return data ? toProfile(data as ProfileRow) : null;
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    const row = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      average_cycle_length: profile.averageCycleLength,
      average_period_length: profile.averagePeriodLength,
      consent_health_data: profile.consent.healthData,
      consent_reminder_emails: profile.consent.reminderEmails,
      consented_at: profile.consent.consentedAt,
      remind_period: profile.reminders.period,
      remind_ovulation: profile.reminders.ovulation,
      remind_phase_change: profile.reminders.phaseChange,
      updated_at: new Date().toISOString(),
    };
    const { error } = await this.sb.from('profiles').upsert(row);
    if (error) throw error;
    return profile;
  }

  async listCycles(): Promise<CycleEntry[]> {
    const uid = await this.userId();
    const { data, error } = await this.sb
      .from('cycles')
      .select('*')
      .eq('user_id', uid)
      .order('start_date', { ascending: true });
    if (error) throw error;
    return sortCycles(((data ?? []) as CycleRow[]).map(toCycle));
  }

  async addCycle(entry: CycleEntry): Promise<CycleEntry> {
    const uid = await this.userId();
    const { error } = await this.sb.from('cycles').insert({
      user_id: uid,
      start_date: entry.startDate,
      end_date: entry.endDate,
    });
    if (error) throw error;
    return entry;
  }

  async updateCycle(entry: CycleEntry): Promise<CycleEntry> {
    const { error } = await this.sb
      .from('cycles')
      .update({ start_date: entry.startDate, end_date: entry.endDate })
      .eq('id', entry.id);
    if (error) throw error;
    return entry;
  }

  async deleteCycle(id: string): Promise<void> {
    const { error } = await this.sb.from('cycles').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteAll(): Promise<void> {
    const uid = await this.userId();
    await this.sb.from('cycles').delete().eq('user_id', uid);
    await this.sb.from('profiles').delete().eq('id', uid);
    await this.sb.auth.signOut();
  }
}
