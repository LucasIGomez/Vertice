// Envío de mensajes por la API oficial de WhatsApp Business (WhatsApp Cloud API de Meta).
//
// Fuera de la ventana de 24 h desde el último mensaje del cliente, WhatsApp solo permite
// enviar mensajes de PLANTILLA aprobadas por Meta. Por eso las notificaciones usan una
// plantilla con 3 variables:
//   {{1}} nombre del cliente · {{2}} nombre del negocio · {{3}} novedad del pedido
// Ver README → "WhatsApp" para el texto sugerido de la plantilla.

const GRAPH_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

export function whatsappConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Normaliza un teléfono argentino al formato internacional (549 + área + número).
 * Acepta "351 15 123-4567", "0351 1234567", "+54 9 351 1234567", etc.
 * (Misma lógica que src/lib/whatsapp.ts.)
 */
export function toWhatsappNumber(raw) {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('54')) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1);
  }
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 12) {
    for (const areaLen of [2, 3, 4]) {
      if (d.slice(areaLen, areaLen + 2) === '15') { d = d.slice(0, areaLen) + d.slice(areaLen + 2); break; }
    }
  }
  return d.length === 10 ? `549${d}` : d;
}

const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

/** Texto de la variable {{3}} según el evento. Devuelve null si el evento no se notifica. */
export function eventMessage(event, extra = {}) {
  switch (event) {
    case 'confirmado': return 'quedó confirmado y entra en la cola de producción';
    case 'en_produccion': return 'ya está en producción';
    case 'listo': return 'está listo para retirar o entregar';
    case 'entregado': return 'fue entregado, ¡gracias por tu compra!';
    case 'cancelado': return 'fue cancelado. Si es un error, escribinos';
    case 'pago': return `registramos tu pago de ${money.format(Number(extra.amount) || 0)}`;
    default: return null;
  }
}

/** Envía la plantilla de notificación. Lanza un Error con el mensaje de Meta si falla. */
export async function sendTemplate(to, params) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: process.env.WHATSAPP_TEMPLATE_NAME || 'actualizacion_pedido',
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'es_AR' },
      components: [{
        type: 'body',
        // WhatsApp no acepta saltos de línea ni tabs en las variables de plantilla
        parameters: params.map(p => ({ type: 'text', text: String(p).replace(/\s+/g, ' ').trim() || '-' })),
      }],
    },
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json?.error?.error_data?.details || json?.error?.message || `WhatsApp respondió ${r.status}`);
  return json?.messages?.[0]?.id ?? null;
}

/**
 * Notifica al cliente de un pedido y deja registro en la tabla notifications.
 * Nunca lanza: devuelve { status: 'sent' | 'skipped' | 'error', error? }.
 */
export async function notifyOrder(db, orderId, event, extra = {}) {
  const log = async (row) => {
    await db.from('notifications').insert({ order_id: orderId, channel: 'whatsapp', event, ...row });
    return row;
  };

  try {
    const text = eventMessage(event, extra);
    if (!text) return { status: 'skipped', error: `El evento "${event}" no envía aviso` };
    if (!whatsappConfigured()) return { status: 'skipped', error: 'WhatsApp no está configurado en el servidor' };

    const { data: settings } = await db.from('settings').select('business_name, whatsapp_enabled').eq('id', 1).single();
    if (!settings?.whatsapp_enabled) return { status: 'skipped', error: 'Avisos automáticos desactivados en Configuración' };

    const { data: order, error } = await db.from('orders').select('id, client:clients(name, phone)').eq('id', orderId).single();
    if (error || !order) return { status: 'error', error: 'Pedido no encontrado' };

    const to = toWhatsappNumber(order.client?.phone);
    if (!to) return log({ status: 'skipped', error: 'El cliente no tiene teléfono cargado' });

    const firstName = (order.client?.name || '').trim().split(/\s+/)[0] || 'cliente';
    try {
      const id = await sendTemplate(to, [firstName, settings.business_name || 'Vértice', text]);
      return log({ status: 'sent', recipient: to, provider_message_id: id });
    } catch (err) {
      return log({ status: 'error', recipient: to, error: err.message });
    }
  } catch (err) {
    console.error('notifyOrder', err);
    return { status: 'error', error: err?.message || String(err) };
  }
}
