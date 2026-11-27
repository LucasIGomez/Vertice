import { supabase } from '@/lib/supabase';
import type { OrderStatus } from '@/types';

/** Llama a una función de /api con el token de la sesión actual. */
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const r = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init.headers,
    },
  });
  const json = await r.json().catch(() => null);
  if (!r.ok || !json) {
    throw new Error(json?.error ?? (r.status === 404
      ? 'Las funciones del servidor no están disponibles (en local usá "vercel dev").'
      : `Error del servidor (${r.status})`));
  }
  return json as T;
}

export interface IntegrationStatus {
  server: boolean;
  mercadopago: boolean;
  mercadopago_test: boolean;
  mercadopago_webhook_secret: boolean;
  whatsapp: boolean;
  whatsapp_template: string;
}

export function getIntegrationStatus() {
  return api<IntegrationStatus>('/api/integrations/status');
}

/** Crea un link de pago de Mercado Pago. Sin amount, cobra el saldo pendiente. */
export function createPaymentLink(orderId: string, amount?: number) {
  return api<{ link: string; amount: number }>('/api/mp/create-preference', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, amount }),
  });
}

export interface NotifyResult { status: 'sent' | 'skipped' | 'error'; error?: string }

export function notifyOrderWhatsapp(orderId: string, event: OrderStatus | 'pago') {
  return api<NotifyResult>('/api/whatsapp/notify', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, event }),
  });
}

/** Estados del pedido que disparan aviso automático por WhatsApp. */
export const NOTIFIED_STATUSES: OrderStatus[] = ['confirmado', 'en_produccion', 'listo', 'entregado', 'cancelado'];
