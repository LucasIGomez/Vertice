import { useEffect, useState } from 'react';
import type { CostBreakdown, ServiceType } from '@/types';

export interface DraftItem {
  key: string;
  description: string;
  service_type: ServiceType;
  material_id: string | null;
  machine_id: string;
  quantity: number;
  time_minutes: number;
  labor_minutes: number;
  material_amount: number;
  batch: boolean;           // true = tiempos/material corresponden a la tanda completa
  cost: CostBreakdown;      // costos totales del ítem (sin margen)
}

export interface QuoteDraft {
  items: DraftItem[];
  clientId: string;         // '' = sin cliente, '__new__' = cliente nuevo
  newClientName: string;
  newClientPhone: string;
  notes: string;
  validDays: number;
}

const STORAGE_KEY = 'vertice.quoteDraft.v1';

export const EMPTY_DRAFT: QuoteDraft = {
  items: [],
  clientId: '',
  newClientName: '',
  newClientPhone: '',
  notes: '',
  validDays: 7,
};

function load(): QuoteDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<QuoteDraft>) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

/** Cotización en armado, persistida en localStorage para no perderla al navegar. */
export function useQuoteDraft() {
  const [draft, setDraft] = useState<QuoteDraft>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  return {
    draft,
    update: (changes: Partial<QuoteDraft>) => setDraft(d => ({ ...d, ...changes })),
    addItem: (item: Omit<DraftItem, 'key'>) =>
      setDraft(d => ({ ...d, items: [...d.items, { ...item, key: crypto.randomUUID() }] })),
    removeItem: (key: string) => setDraft(d => ({ ...d, items: d.items.filter(i => i.key !== key) })),
    reset: () => setDraft(EMPTY_DRAFT),
  };
}
