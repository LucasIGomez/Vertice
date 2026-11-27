// POST /api/mp/create-preference  { order_id, amount? }
// Crea un link de pago de Mercado Pago (Checkout Pro) para un pedido y lo guarda en orders.payment_link.
// Si no se indica amount, cobra el saldo pendiente (total - ya cobrado).
import { adminClient, requireUser, publicUrl, handle, HttpError } from '../_lib/supabase.js';

export default handle(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');
  await requireUser(req);

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new HttpError(500, 'Falta MP_ACCESS_TOKEN en las variables de entorno de Vercel.');

  const { order_id, amount } = req.body || {};
  if (!order_id) throw new HttpError(400, 'Falta order_id');

  const db = adminClient();
  const { data: order, error } = await db
    .from('orders')
    .select('*, client:clients(name, email), quote:quotes(number)')
    .eq('id', order_id)
    .single();
  if (error || !order) throw new HttpError(404, 'Pedido no encontrado');

  const pending = Number(order.total_price) - Number(order.payment_amount);
  const charge = Math.round((amount != null ? Number(amount) : pending) * 100) / 100;
  if (!(charge > 0)) throw new HttpError(400, 'El monto a cobrar tiene que ser mayor a 0');

  const { data: settings } = await db.from('settings').select('business_name').eq('id', 1).single();
  const business = settings?.business_name || 'Vértice';
  const ref = order.quote?.number ? `#${order.quote.number}` : order.id.slice(0, 8);
  const isPartial = charge < pending;

  const base = publicUrl(req);
  const isPublicHttps = base.startsWith('https://');

  const preference = {
    items: [{
      id: order.id,
      title: `${business} — Pedido ${ref}${isPartial ? ' (seña)' : ''}`,
      quantity: 1,
      currency_id: 'ARS',
      unit_price: charge,
    }],
    external_reference: order.id,
    metadata: { order_id: order.id },
    statement_descriptor: business.slice(0, 13),
    ...(order.client?.email ? { payer: { email: order.client.email, name: order.client.name } } : {}),
    // Mercado Pago exige URLs públicas https para el webhook y el auto_return
    ...(isPublicHttps ? {
      notification_url: `${base}/api/mp/webhook`,
      back_urls: {
        success: `${base}/pago?estado=aprobado`,
        pending: `${base}/pago?estado=pendiente`,
        failure: `${base}/pago?estado=rechazado`,
      },
      auto_return: 'approved',
    } : {}),
  };

  const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${order.id}-${charge}-${Date.now()}`,
    },
    body: JSON.stringify(preference),
  });
  const pref = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(502, `Mercado Pago: ${pref?.message || r.status}`);

  const link = pref.init_point || pref.sandbox_init_point;
  await db.from('orders').update({ payment_link: link }).eq('id', order.id);

  res.status(200).json({ ok: true, link, amount: charge, preference_id: pref.id });
});
