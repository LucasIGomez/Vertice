import { supabase } from '@/lib/supabase';
import type { Machine } from '@/types';

export async function getMachines() {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .order('type')
    .order('name');
  if (error) throw error;
  return data as Machine[];
}

export async function getMachine(id: string) {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Machine;
}

export async function createMachine(machine: Omit<Machine, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('machines')
    .insert(machine)
    .select()
    .single();
  if (error) throw error;
  return data as Machine;
}

export async function updateMachine(id: string, updates: Partial<Machine>) {
  const { data, error } = await supabase
    .from('machines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Machine;
}

export async function deleteMachine(id: string) {
  const { error } = await supabase
    .from('machines')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
