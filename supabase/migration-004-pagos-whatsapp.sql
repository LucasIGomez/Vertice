-- ═══════════════════════════════════════════════
-- Migración 004 — Pagos (Mercado Pago) y notificaciones (WhatsApp)
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede correr dos veces.
-- ═══════════════════════════════════════════════

-- Pagos recibidos por Mercado Pago. Un registro por pago de MP (mp_payment_id único),
-- así el webhook puede llegar repetido sin duplicar cobros.
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  mp_payment_id TEXT UNIQUE,
  status TEXT NOT NULL,                 -- approved, pending, in_process, rejected, refunded, cancelled...
  status_detail TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payer_email TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- Registro de mensajes de WhatsApp enviados (o fallidos) para poder revisar qué pasó.
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  event TEXT NOT NULL,                  -- estado del pedido o 'pago'
  recipient TEXT,
  status TEXT NOT NULL,                 -- sent, error, skipped
  error TEXT,
  provider_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications(order_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- El panel (usuarios logueados) solo lee. Las escrituras las hace el servidor con la service role key.
DROP POLICY IF EXISTS "Authenticated read" ON payments;
CREATE POLICY "Authenticated read" ON payments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read" ON notifications;
CREATE POLICY "Authenticated read" ON notifications
  FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS set_updated_at ON payments;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

NOTIFY pgrst, 'reload schema';
