// POST /api/whatsapp/notify  { order_id, event }
// Envía al cliente el aviso de WhatsApp correspondiente al estado del pedido.
import { adminClient, requireUser, handle, HttpError } from '../_lib/supabase.js';
import { notifyOrder } from '../_lib/whatsapp.js';

export default handle(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');
  await requireUser(req);
  const { order_id, event } = req.body || {};
  if (!order_id || !event) throw new HttpError(400, 'Faltan order_id y event');
  const result = await notifyOrder(adminClient(), order_id, event);
  res.status(200).json({ ok: result.status !== 'error', ...result });
});
