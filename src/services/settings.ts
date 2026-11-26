import { supabase } from '@/lib/supabase';
import type { Settings } from '@/types';

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data as Settings;
}

export async function updateSettings(updates: Partial<Settings>) {
  const { data, error } = await supabase
    .from('settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data as Settings;
}
