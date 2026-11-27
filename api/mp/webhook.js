// POST /api/mp/webhook
// Mercado Pago avisa acá cada vez que cambia un pago. Se consulta el pago a la API de MP
// (fuente de verdad), se guarda en la tabla payments y se recalcula lo cobrado del pedido.
import crypto from 'node:crypto';
import { adminClient } from '../_lib/supabase.js';
import { notifyOrder } from '../_lib/whatsapp.js';

/** Valida la firma x-signature si está configurado MP_WEBHOOK_SECRET. */
function validSignature(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  const sig = String(req.headers['x-signature'] || '');
  const requestId = String(req.headers['x-request-id'] || '');
  const parts = Object.fromEntries(sig.split(',').map(p => p.trim().split('=')));
  if (!parts.ts || !parts.v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return expected.length === parts.v1.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

export default async function handler(req, res) {
  // MP manda notificaciones nuevas (type=payment&data.id=) y viejas tipo IPN (topic=payment&id=)
  const q = req.query || {};
  const body = req.body || {};
  const topic = q.type || q.topic || body.type || body.topic;
  const paymentId = String(q['data.id'] || body?.data?.id || q.id || '');

  if (topic !== 'payment' || !paymentId) {
    return res.status(200).json({ ok: true, ignored: true });
  }
  if (!validSignature(req, paymentId)) {
    return res.status(401).json({ ok: false, error: 'Firma inválida' });
  }

  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    if (r.status === 404) return res.status(200).json({ ok: true, ignored: 'pago inexistente' });
    if (!r.ok) throw new Error(`MP respondió ${r.status}`);
    const p = await r.json();

    const orderId = p.external_reference || p.metadata?.order_id;
    if (!orderId) return res.status(200).json({ ok: true, ignored: 'sin external_reference' });

    const db = adminClient();
    const { data: order } = await db.from('orders').select('id, status, total_price').eq('id', orderId).maybeSingle();
    if (!order) return res.status(200).json({ ok: true, ignored: 'pedido inexistente' });

    const { data: previous } = await db.from('payments').select('status').eq('mp_payment_id', String(p.id)).maybeSingle();

    const amount = Number(p.transaction_amount || 0) - Number(p.transaction_amount_refunded || 0);
    const { error: upErr } = await db.from('payments').upsert({
      order_id: orderId,
      provider: 'mercadopago',
      mp_payment_id: String(p.id),
      status: p.status,
      status_detail: p.status_detail,
      amount,
      payment_method: p.payment_method_id,
      payer_email: p.payer?.email ?? null,
      raw: p,
    }, { onConflict: 'mp_payment_id' });
    if (upErr) throw upErr;

    // Recalcular lo cobrado con todos los pagos aprobados del pedido
    const { data: approved } = await db.from('payments').select('amount').eq('order_id', orderId).eq('status', 'approved');
    const paid = (approved || []).reduce((s, x) => s + Number(x.amount), 0);
    const total = Number(order.total_price);
    const update = {
      payment_amount: paid,
      payment_status: paid <= 0 ? 'pendiente' : paid + 0.5 >= total ? 'pagado' : 'parcial',
    };
    // Un pago (o seña) confirma los pedidos que todavía estaban en etapa de consulta
    if (paid > 0 && ['consulta', 'cotizando', 'esperando_confirmacion'].includes(order.status)) {
      update.status = 'confirmado';
    }
    await db.from('orders').update(update).eq('id', orderId);

    if (p.status === 'approved' && previous?.status !== 'approved') {
      await notifyOrder(db, orderId, 'pago', { amount });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('mp webhook', err);
    // 500 → Mercado Pago reintenta más tarde
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
}
