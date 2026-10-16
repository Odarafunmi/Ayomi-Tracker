import { LocalStore } from './local-store';
import { isSupabaseConfigured, SupabaseStore } from './supabase-store';
import type { DataStore } from './types';

export { isSupabaseConfigured };

/**
 * Pick the storage backend: Supabase when configured, otherwise a fully
 * functional browser-local demo mode.
 */
export function createStore(): DataStore {
  if (isSupabaseConfigured()) return new SupabaseStore();
  return new LocalStore();
}
