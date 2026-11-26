import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>;

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('category')
    .order('name');
  if (error) throw error;
  return data as Product[];
}

export async function createProduct(product: ProductInput) {
  const { data, error } = await supabase.from('products').insert(product).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(id: string, updates: Partial<ProductInput>) {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}
