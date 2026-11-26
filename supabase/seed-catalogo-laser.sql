-- Vértice — Catálogo láser inicial (ejecutar después de migration-003-catalogo.sql)
-- Tiempos y precios son ESTIMADOS a partir del estudio de mercado (nov-2026): ajustalos.
-- Los productos de MDF no tienen material asignado: asignalo cuando cargues el MDF en Inventario.

INSERT INTO products (name, description, category, machine_id, units_per_set, time_minutes, labor_minutes, extra_cost, price, notes)
SELECT p.name, p.description, p.category, m.id, p.units, p.time_min, p.labor_min, p.extra, p.price, p.notes
FROM (VALUES
  ('Topper de torta',            'Nombre y/o número en MDF 3 mm, hasta 20 cm, con palillo', 'Repostería', 1, 15, 15,    0,  4500, 'Mercado: $2.000–$6.000'),
  ('Toppers para cupcakes',      'Pack de 6 mini toppers en MDF con la temática del evento', 'Repostería', 6, 20, 20,    0,  5400, 'Precio a validar'),
  ('Grabado de termo',           'Logo, nombre o frase sobre termo pintado del cliente',     'Mate y tereré', 1, 10, 10, 0,  8000, 'Mercado: $7.770–$14.800'),
  ('Grabado de mate o guampa',   'Nombre o diseño sobre mate/guampa del cliente',            'Mate y tereré', 1,  8, 10, 0,  6000, 'Precio a validar'),
  ('Tabla de asado grabada',     'Grabado de nombre, frase o logo sobre tabla del cliente',  'Regalos', 1, 15, 10,       0,  8000, 'Precio a validar'),
  ('Llaveros MDF con nombre',    'Pack de 10 llaveros en MDF 3 mm con argolla',              'Regalos', 10, 25, 25,    1000,  7000, 'Insumos: 10 argollas'),
  ('Souvenirs MDF con imán',     'Pack de 20 souvenirs para eventos (15, bautismos, comuniones)', 'Eventos', 20, 40, 40, 2000, 16000, 'Insumos: 20 imanes. Precio a validar'),
  ('Exhibidores QR de mesa',     'Pack de 5 soportes de mesa en MDF con QR y logo',          'Comercios', 5, 30, 25,     0, 12500, 'Mercado: $1.500–$3.000 por mesa'),
  ('Cartel para comercio o casa','Cartel calado en MDF 3 mm, hasta 30 cm',                   'Comercios', 1, 30, 20,     0, 12000, 'Precio a validar')
) AS p(name, description, category, units, time_min, labor_min, extra, price, notes)
CROSS JOIN LATERAL (SELECT id FROM machines WHERE type = 'laser' ORDER BY created_at LIMIT 1) m
WHERE NOT EXISTS (SELECT 1 FROM products);
