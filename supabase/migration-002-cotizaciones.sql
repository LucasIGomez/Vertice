-- Vértice — Migración 002: cotizaciones completas (Fase 2)
-- Ejecutar una vez en el SQL Editor de Supabase. Es seguro correrlo de nuevo.

-- Minutos de trabajo humano por ítem (diseño, preparación, post-proceso)
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS labor_minutes INTEGER NOT NULL DEFAULT 0;

-- Precio de venta por ítem (costo + margen), para mostrarle al cliente
ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS price NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Número correlativo legible (Cotización #12)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS number SERIAL;

-- Precio total del pedido (payment_amount es lo que ya se cobró)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price NUMERIC(12,2) NOT NULL DEFAULT 0;

-- Forzar a la API a ver las columnas nuevas
NOTIFY pgrst, 'reload schema';
