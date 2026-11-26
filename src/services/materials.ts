import { supabase } from '@/lib/supabase';
import type { Material } from '@/types';

export async function getMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('type')
    .order('name');
  if (error) throw error;
  return data as Material[];
}

export async function getMaterial(id: string) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Material;
}

export async function createMaterial(material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('materials')
    .insert(material)
    .select()
    .single();
  if (error) throw error;
  return data as Material;
}

export async function updateMaterial(id: string, updates: Partial<Material>) {
  const { data, error } = await supabase
    .from('materials')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Material;
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getLowStockMaterials() {
  // PostgREST no compara dos columnas entre sí: se filtra en el cliente
  const { data, error } = await supabase.from('materials').select('*');
  if (error) throw error;
  return (data as Material[]).filter(m => Number(m.stock_quantity) <= Number(m.stock_min_alert));
}
