import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook genérico para queries a Supabase con refetch manual.
 */
export function useSupabaseQuery<T>(
  table: string,
  options?: {
    select?: string;
    orderBy?: string;
    ascending?: boolean;
    filters?: Array<{ column: string; operator: string; value: unknown }>;
  }
) {
  const [state, setState] = useState<QueryState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let query = supabase
        .from(table)
        .select(options?.select ?? '*');

      if (options?.filters) {
        for (const f of options.filters) {
          query = query.filter(f.column, f.operator, f.value);
        }
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.ascending ?? true,
        });
      }

      const { data, error } = await query;

      if (error) throw error;

      setState({ data: (data ?? []) as T[], loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [table, options?.select, options?.orderBy, options?.ascending, options?.filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
