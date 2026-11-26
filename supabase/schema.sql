-- ═══════════════════════════════════════════════════════════
-- Vértice — Schema de Base de Datos v2.0
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tipos enumerados ──────────────────────────────────────

CREATE TYPE material_type AS ENUM (
  'filamento', 'resina', 'madera', 'acrilico', 'cuero', 'mdf', 'otro'
);

CREATE TYPE machine_type AS ENUM (
  'printer_fdm', 'printer_sla', 'laser'
);

CREATE TYPE service_type AS ENUM (
  'impresion_3d', 'grabado_laser'
);

CREATE TYPE order_status AS ENUM (
  'consulta', 'cotizando', 'esperando_confirmacion',
  'confirmado', 'en_produccion', 'listo', 'entregado', 'cancelado'
);

CREATE TYPE quote_status AS ENUM (
  'borrador', 'enviada', 'aceptada', 'rechazada', 'vencida'
);

CREATE TYPE payment_status AS ENUM (
  'pendiente', 'parcial', 'pagado'
);

-- ── Tablas ─────────────────────────────────────────────────

-- Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Materiales
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type material_type NOT NULL DEFAULT 'filamento',
  color TEXT,
  brand TEXT,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_label TEXT NOT NULL DEFAULT 'kg',
  stock_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_min_alert NUMERIC(10,2) NOT NULL DEFAULT 1,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Máquinas
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type machine_type NOT NULL,
  brand TEXT,
  model TEXT,
  purchase_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  lifespan_hours INTEGER NOT NULL DEFAULT 5000,
  wattage INTEGER NOT NULL DEFAULT 200,
  maintenance_cost_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configuración (single-row)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  electricity_cost_kwh NUMERIC(10,2) NOT NULL DEFAULT 120,
  labor_cost_hour NUMERIC(10,2) NOT NULL DEFAULT 3400,
  default_margin_percent NUMERIC(5,2) NOT NULL DEFAULT 40,
  currency TEXT NOT NULL DEFAULT 'ARS',
  business_name TEXT NOT NULL DEFAULT 'Vértice',
  business_phone TEXT,
  business_instagram TEXT,
  mercadopago_enabled BOOLEAN NOT NULL DEFAULT false,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar fila de settings por defecto
INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Cotizaciones
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  status quote_status NOT NULL DEFAULT 'borrador',
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  margin_percent NUMERIC(5,2) NOT NULL DEFAULT 40,
  final_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  valid_until TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Items de cotización
CREATE TABLE quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  estimated_time_minutes INTEGER NOT NULL DEFAULT 0,
  exact_time_minutes INTEGER,
  material_grams NUMERIC(10,2),
  material_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  electricity_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  machine_wear_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'consulta',
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  assigned_machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  payment_status payment_status NOT NULL DEFAULT 'pendiente',
  payment_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_link TEXT,
  delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Índices ────────────────────────────────────────────────

CREATE INDEX idx_materials_type ON materials(type);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);

-- ── Row Level Security ────────────────────────────────────

-- Habilitar RLS en todas las tablas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios autenticados tienen acceso completo
-- (fase 1: single-tenant, después se refina para multi-tenant)

CREATE POLICY "Authenticated users full access" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access" ON materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access" ON machines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access" ON quotes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access" ON quote_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users full access" ON orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Acceso público de lectura al catálogo (para el panel público)
CREATE POLICY "Public read settings" ON settings
  FOR SELECT TO anon USING (true);

-- ── Trigger para updated_at ───────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
