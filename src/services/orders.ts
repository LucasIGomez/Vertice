import { supabase } from '@/lib/supabase';
import type { Order } from '@/types';

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, client:clients(*), quote:quotes(*), machine:machines(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function getOrder(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, client:clients(*), quote:quotes(*, items:quote_items(*)), machine:machines(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Order;
}

export async function createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'client' | 'quote' | 'machine'>) {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}

export async function updateOrderStatus(id: string, status: Order['status']) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}

export async function updateOrder(id: string, updates: Partial<Order>) {
  const { data, error } = await supabase
    .from('orders')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}
