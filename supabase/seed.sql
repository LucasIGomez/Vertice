-- ═══════════════════════════════════════════════════════════
-- Vértice — Datos iniciales (seed)
-- Ejecutar después de schema.sql
-- ═══════════════════════════════════════════════════════════

-- Configuración por defecto (Argentina)
UPDATE settings SET
  electricity_cost_kwh = 120,
  labor_cost_hour = 3400,
  default_margin_percent = 40,
  currency = 'ARS',
  business_name = 'Vértice'
WHERE id = 1;

-- Máquinas reales del taller
INSERT INTO machines (name, type, brand, model, purchase_cost, lifespan_hours, wattage, maintenance_cost_monthly) VALUES
  ('Flashforge AD5X', 'printer_fdm', 'Flashforge', 'Adventurer 5X', 650000, 6000, 350, 5000),
  ('Bambulab A1 Combo', 'printer_fdm', 'Bambulab', 'A1 Combo', 580000, 5000, 200, 3000),
  ('Anycubic Kobra S1 Combo', 'printer_fdm', 'Anycubic', 'Kobra S1 Combo', 420000, 5000, 200, 3000),
  ('Atomstack A5 Pro V2', 'laser', 'Atomstack', 'A5 Pro V2', 620000, 4000, 40, 2000);

-- Materiales de ejemplo
INSERT INTO materials (name, type, color, brand, unit_cost, unit_label, stock_quantity, stock_min_alert, supplier) VALUES
  ('PLA 1.75mm', 'filamento', 'Blanco', 'eSUN', 12000, 'kg', 3, 1, 'PrintaLot'),
  ('PLA 1.75mm', 'filamento', 'Negro', 'eSUN', 12000, 'kg', 2, 1, 'PrintaLot'),
  ('PLA 1.75mm', 'filamento', 'Rojo', 'eSUN', 13000, 'kg', 1.5, 1, 'PrintaLot'),
  ('PETG 1.75mm', 'filamento', 'Transparente', 'eSUN', 15000, 'kg', 2, 1, 'PrintaLot'),
  ('ABS 1.75mm', 'filamento', 'Gris', 'eSUN', 14000, 'kg', 1, 1, 'PrintaLot'),
  ('MDF 3mm', 'mdf', 'Natural', NULL, 800, 'pliego', 10, 3, 'Maderera local'),
  ('Acrílico 3mm', 'acrilico', 'Transparente', NULL, 3500, 'pliego', 5, 2, 'PlastiAR'),
  ('Cuero sintético', 'cuero', 'Marrón', NULL, 2500, 'metro', 3, 1, 'Textil Norte');
