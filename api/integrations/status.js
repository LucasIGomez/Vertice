// GET /api/integrations/status
// Indica qué integraciones tienen sus variables de entorno cargadas en Vercel (sin exponer valores).
import { requireUser, handle } from '../_lib/supabase.js';
import { whatsappConfigured } from '../_lib/whatsapp.js';

export default handle(async (req, res) => {
  await requireUser(req);
  const mp = process.env.MP_ACCESS_TOKEN || '';
  res.status(200).json({
    ok: true,
    server: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    mercadopago: Boolean(mp),
    mercadopago_test: mp.startsWith('TEST-'),
    mercadopago_webhook_secret: Boolean(process.env.MP_WEBHOOK_SECRET),
    whatsapp: whatsappConfigured(),
    whatsapp_template: process.env.WHATSAPP_TEMPLATE_NAME || 'actualizacion_pedido',
  });
});
