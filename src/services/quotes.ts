import { supabase } from '@/lib/supabase';
import type { Quote, QuoteItem } from '@/types';

export async function getQuotes() {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, client:clients(*), items:quote_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Quote[];
}

export async function getQuote(id: string) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, client:clients(*), items:quote_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Quote;
}

export async function createQuote(
  quote: Omit<Quote, 'id' | 'items' | 'created_at' | 'updated_at' | 'client'>,
  items: Omit<QuoteItem, 'id' | 'quote_id' | 'created_at'>[]
) {
  // Crear cotización
  const { data: quoteData, error: quoteError } = await supabase
    .from('quotes')
    .insert(quote)
    .select()
    .single();
  if (quoteError) throw quoteError;

  // Crear items vinculados
  if (items.length > 0) {
    const itemsWithQuoteId = items.map(item => ({
      ...item,
      quote_id: quoteData.id,
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(itemsWithQuoteId);
    if (itemsError) throw itemsError;
  }

  return quoteData as Quote;
}

export async function updateQuoteStatus(id: string, status: Quote['status']) {
  const { data, error } = await supabase
    .from('quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Quote;
}
