-- Vértice — Datos reales de máquinas + vaciar insumos (2026-11-26)

-- Amortización: costo de compra y horas para recuperar la inversión
UPDATE machines SET purchase_cost = 1500000, lifespan_hours = 500 WHERE name = 'Bambulab A1 Combo';
UPDATE machines SET purchase_cost =  900000, lifespan_hours = 450 WHERE name = 'Flashforge AD5X';
UPDATE machines SET purchase_cost = 1300000, lifespan_hours = 500 WHERE name = 'Anycubic Kobra S1 Combo';

-- Vaciar insumos de ejemplo (los cargás vos desde Inventario)
DELETE FROM materials;

-- Verificación
SELECT name, purchase_cost, lifespan_hours, wattage FROM machines ORDER BY name;
