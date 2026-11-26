-- Vértice — Migración 003: catálogo de productos estándar (grabado láser)
-- Ejecutar una vez en el SQL Editor de Supabase. Es seguro correrlo de nuevo.

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  service_type service_type NOT NULL DEFAULT 'grabado_laser',
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  units_per_set INTEGER NOT NULL DEFAULT 1 CHECK (units_per_set >= 1), -- unidades que trae el juego
  time_minutes INTEGER NOT NULL DEFAULT 0,        -- tiempo de láser por juego
  labor_minutes INTEGER NOT NULL DEFAULT 0,       -- trabajo humano por juego
  material_amount NUMERIC(10,3) NOT NULL DEFAULT 0, -- en la unidad del material (ej. 0.1 pliego)
  extra_cost NUMERIC(12,2) NOT NULL DEFAULT 0,    -- otros insumos por juego (argollas, imanes, packaging)
  price NUMERIC(12,2) NOT NULL DEFAULT 0,         -- precio fijo del juego
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users full access" ON products;
CREATE POLICY "Authenticated users full access" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_updated_at ON products;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

NOTIFY pgrst, 'reload schema';
