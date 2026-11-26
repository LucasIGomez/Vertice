import { supabase } from '@/lib/supabase';
import type { Order, Quote, QuoteItem } from '@/types';

export type NewQuote = Omit<Quote, 'id' | 'number' | 'items' | 'created_at' | 'updated_at' | 'client'>;
export type NewQuoteItem = Omit<QuoteItem, 'id' | 'quote_id' | 'created_at'>;

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
    .order('created_at', { referencedTable: 'quote_items', ascending: true })
    .single();
  if (error) throw error;
  return data as Quote;
}

export async function createQuote(quote: NewQuote, items: NewQuoteItem[]) {
  const { data: quoteData, error: quoteError } = await supabase
    .from('quotes')
    .insert(quote)
    .select()
    .single();
  if (quoteError) throw quoteError;

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(items.map(item => ({ ...item, quote_id: quoteData.id })));
    if (itemsError) {
      // No dejar una cotización vacía si fallaron los ítems
      await supabase.from('quotes').delete().eq('id', quoteData.id);
      throw itemsError;
    }
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

export async function deleteQuote(id: string) {
  const { error } = await supabase.from('quotes').delete().eq('id', id);
  if (error) throw error;
}

export async function getOrderForQuote(quoteId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('quote_id', quoteId)
    .maybeSingle();
  if (error) throw error;
  return data as Order | null;
}

/**
 * Marca la cotización como aceptada y crea el pedido (si todavía no existe).
 */
export async function acceptQuote(quote: Quote) {
  await updateQuoteStatus(quote.id, 'aceptada');

  const existing = await getOrderForQuote(quote.id);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('orders')
    .insert({
      quote_id: quote.id,
      client_id: quote.client_id,
      status: 'confirmado',
      total_price: quote.final_price,
      notes: quote.notes,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}
