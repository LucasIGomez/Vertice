# Contexto Completo — Proyecto Vértice (Rewrite TypeScript)

## Qué es Vértice
Plataforma web para gestionar un negocio de impresión 3D y grabado láser. El dueño es Lucas, que opera desde Argentina con su socio. Tiene 3 impresoras 3D (Flashforge AD5X, Bambulab A1 combo, Anycubic Kobra S1 combo) y un láser (Atomstack A5 Pro V2).

## Estado actual: Fases 1 y 2 completas · en producción en Vercel · integraciones Mercado Pago y WhatsApp hechas (ver README → Integraciones)
Se hizo un rewrite completo desde cero en TypeScript. El código viejo era JSX sin tipos, con navegación por useState, todo en un solo archivo `supabase.js`. El nuevo proyecto tiene arquitectura modular, tipado estricto, y routing real.

## Stack técnico
- **Frontend**: React 19 + TypeScript + Vite 6
- **Estilos**: Tailwind CSS 3 con paleta custom `vertice` (emerald-based)
- **Routing**: React Router v7 (BrowserRouter)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Iconos**: Lucide React
- **Deploy**: Vercel (frontend + funciones serverless en `api/`)
- **Repo**: github.com/LucasIGomez/Vertice (branch `main`)
- **Path aliases**: `@/` → `src/` (configurado en tsconfig.json y vite.config.ts)

## Arquitectura del proyecto

```
src/
├── App.tsx                          # Router principal con 3 grupos de rutas
├── main.tsx                         # Entry point
├── index.css                        # Tailwind directives
├── types/
│   ├── database.ts                  # Enums y interfaces completas
│   └── index.ts                     # Re-export
├── lib/
│   ├── supabase.ts                  # Cliente Supabase con validación de env vars
│   └── constants.ts                 # Labels, colores, categorías de estimación rápida, formato moneda
├── hooks/
│   ├── useAuth.ts                   # Auth hook (signIn, signUp, signOut, session listener)
│   └── useSupabaseQuery.ts          # Hook genérico de queries con filtros y refetch
├── services/
│   ├── costCalculator.ts            # LÓGICA DE NEGOCIO CENTRAL — cálculo de costos Keitron
│   ├── clients.ts                   # CRUD clientes
│   ├── materials.ts                 # CRUD materiales
│   ├── machines.ts                  # CRUD máquinas
│   ├── settings.ts                  # CRUD configuración (single-row)
│   ├── quotes.ts                    # CRUD cotizaciones con items y joins
│   └── orders.ts                    # CRUD pedidos con joins
├── components/
│   ├── ui/                          # Componentes base reutilizables
│   │   ├── Button.tsx               # Variantes: primary/secondary/danger/ghost, tamaños, loading
│   │   ├── Card.tsx                 # Con header, footer, padding opcional
│   │   ├── Input.tsx                # Con label, error, hint
│   │   ├── Select.tsx               # Con label, error, placeholder
│   │   ├── Badge.tsx                # Variantes de color con dot opcional
│   │   ├── LoadingSpinner.tsx       # Spinner + PageLoader full-screen
│   │   ├── EmptyState.tsx           # Estado vacío con icono, título, descripción, action
│   │   └── index.ts                 # Barrel export
│   ├── auth/
│   │   └── ProtectedRoute.tsx       # Redirect a /login si no autenticado
│   └── layout/
│       ├── Sidebar.tsx              # Sidebar responsive con 8 items de navegación
│       ├── AdminLayout.tsx          # Sidebar + <Outlet />
│       └── PublicLayout.tsx         # Header + <Outlet /> + Footer
└── pages/
    ├── admin/
    │   ├── DashboardPage.tsx        # 4 stat cards + lista de pedidos recientes
    │   ├── CalculatorPage.tsx       # Toggle rápida/exacta, selects, desglose de costos
    │   ├── InventoryPage.tsx        # CRUD completo con filtro por tipo y alertas de stock
    │   ├── MachinesPage.tsx         # CRUD con cards mostrando specs
    │   ├── ClientsPage.tsx          # CRUD con búsqueda por nombre/teléfono
    │   ├── OrdersPage.tsx           # Kanban con 7 columnas, botones avanzar/retroceder
    │   ├── QuotesPage.tsx           # Tabla con badges de estado y precios
    │   └── SettingsPage.tsx         # Datos del negocio, params de costeo, indicadores de integración
    ├── auth/
    │   └── LoginPage.tsx            # Email/password con manejo de errores
    └── public/
        ├── HomePage.tsx             # Hero + grilla de servicios
        └── CatalogPage.tsx          # Cards de servicios 3D y láser

supabase/
├── schema.sql                       # Schema completo: 6 enums, 7 tablas, RLS, triggers
└── seed.sql                         # Datos iniciales: settings, 4 máquinas reales, 8 materiales

Archivos raíz:
├── package.json                     # Dependencias (react 19, supabase, lucide, react-router, tailwind)
├── tsconfig.json                    # Strict mode, path aliases @/
├── vite.config.ts                   # Plugin react + resolve alias @/
├── tailwind.config.js               # Paleta vertice (emerald-based), content paths
├── postcss.config.js                # Tailwind + autoprefixer
├── index.html                       # Entry HTML con div#root
├── vite-env.d.ts                    # Declaración de tipos Vite
├── .env.example                     # Template de variables de entorno
└── .gitignore                       # node_modules, dist, .env, .vercel
```

## Base de datos (Supabase/PostgreSQL)

### Enums
- `material_type`: filamento_pla, filamento_abs, filamento_petg, filamento_tpu, filamento_otro, mdf, acrilico, cuero, tela, otro
- `machine_type`: printer_fdm, printer_sla, laser_co2, laser_diode
- `service_type`: impresion_3d, grabado_laser, corte_laser
- `order_status`: pending, quoted, confirmed, designing, printing, post_processing, ready, delivered, cancelled
- `quote_status`: draft, sent, accepted, rejected, expired
- `payment_status`: pending, partial, paid, refunded

### Tablas
1. **clients**: id, name, email, phone, address, instagram, notes, created_at, updated_at
2. **materials**: id, name, type, brand, color, cost_per_unit, unit, stock_quantity, min_stock, density, notes
3. **machines**: id, name, type, brand, model, purchase_cost, maintenance_cost_monthly, lifespan_hours, wattage, build_volume_x/y/z, max_speed, nozzle_size, is_active, notes
4. **settings**: id (single-row), business_name, owner_name, electricity_cost_kwh, labor_cost_per_hour, default_margin_percent, currency, whatsapp_number, instagram_handle, mercadopago_public_key, mercadopago_access_token
5. **quotes**: id, client_id (FK→clients), status, total_estimated, notes, valid_until, created_at, updated_at
6. **quote_items**: id, quote_id (FK→quotes CASCADE), service_type, description, material_id (FK→materials), machine_id (FK→machines), estimated_time_minutes, estimated_material_grams, unit_price, quantity
7. **orders**: id, quote_id (FK→quotes), client_id (FK→clients), machine_id (FK→machines), status, payment_status, total_price, paid_amount, delivery_date, notes, created_at, updated_at

### RLS
- Todas las tablas: `authenticated` tiene acceso completo (select, insert, update, delete)
- `settings`: lectura pública adicional para el catálogo

## Lógica de negocio — Calculadora de costos (Keitron)

### Fórmulas en `src/services/costCalculator.ts`:

**Desgaste de máquina por hora:**
```
machineWearPerHour = (purchase_cost × 1.2 + maintenance_monthly × months_life) / lifespan_hours
donde months_life = lifespan_hours / (8 × 22) // 8hs/día × 22 días/mes
```

**Electricidad por hora:**
```
electricityCostPerHour = (wattage / 1000) × electricity_cost_kwh
```

**Estimación rápida** (por categoría/tamaño sin slicer):
- Usa tabla `QUICK_ESTIMATE_CATEGORIES` en constants.ts
- Categorías: llavero, figura_pequeña, figura_mediana, pieza_funcional, pieza_grande
- Cada una tiene ranges de tiempo (min/max minutos) y gramos estimados

**Cálculo exacto** (con datos del slicer):
```
materialCost = (grams / 1000) × material.cost_per_unit  // si cost_per_unit es por kg
electricityCost = (minutes / 60) × electricityCostPerHour
machineWearCost = (minutes / 60) × machineWearPerHour
laborCost = (minutes / 60) × settings.labor_cost_per_hour
subtotal = materialCost + electricityCost + machineWearCost + laborCost
total = subtotal × (1 + margin/100)
```

## Routing (React Router v7)

```tsx
// Rutas públicas (PublicLayout: header + footer)
/           → HomePage
/catalogo   → CatalogPage

// Auth
/login      → LoginPage

// Admin (ProtectedRoute + AdminLayout: sidebar)
/admin              → DashboardPage
/admin/calculadora  → CalculatorPage
/admin/inventario   → InventoryPage
/admin/maquinas     → MachinesPage
/admin/clientes     → ClientsPage
/admin/pedidos      → OrdersPage
/admin/cotizaciones → QuotesPage
/admin/configuracion → SettingsPage
```

## Variables de entorno requeridas
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
El `.env` ya está en la carpeta con los valores reales.

## Workflow del negocio
1. Cliente contacta (WhatsApp/Instagram/presencial)
2. Se crea cotización rápida (sin slicer, por categoría/tamaño)
3. Cliente confirma → se pide archivo STL/diseño
4. Se hace cálculo exacto con datos del slicer
5. Se genera cotización formal con desglose
6. Cliente acepta → se crea pedido
7. Pedido pasa por: pending → confirmed → designing → printing → post_processing → ready → delivered
8. Pago vía Mercado Pago (futuro)

## Qué falta — Fases pendientes

### Fase 2 — Core del Negocio (PRÓXIMA)
- [ ] Refinar cotizador de dos velocidades (UI completa para agregar items, preview, PDF)
- [ ] Entidad Cotización completa: crear, editar, enviar al cliente, link compartible
- [ ] Flujo cotización → pedido (al aceptar cotización, se crea pedido automáticamente)
- [ ] Dashboard real: métricas de Supabase (ingresos, pedidos activos, materiales bajos)
- [x] Integración real Mercado Pago (Checkout Pro + webhook en funciones de Vercel: api/mp/*)
- [ ] Upload de archivos STL/imágenes a Supabase Storage

### Fase 3 — Panel Público + Integraciones
- [ ] Catálogo público con precios estimados
- [ ] Formulario de contacto/cotización público
- [x] WhatsApp Business API (notificaciones automáticas de estado y pagos: api/whatsapp/*, api/_lib/whatsapp.js)
- [ ] Alertas de stock reales (email/WhatsApp cuando material baja del mínimo)

### Fase 4 — SaaS + Marketing
- [ ] Multi-tenancy (cada maker tiene su instancia)
- [ ] Instagram marketing agent (publicar automáticamente)
- [ ] PWA (Progressive Web App)
- [ ] Testing con Vitest + React Testing Library

## Pasos inmediatos para el desarrollador

### 1. Limpiar archivos viejos
Eliminar estos residuos del proyecto anterior:
```bash
cd C:\Users\lucas\Desktop\Vertice
del src\App.css src\App.jsx src\main.jsx src\supabase.js
rmdir /s /q src\assets src\utils
del .oxlintrc.json supabase_schema.sql vite.config.js
rmdir /s /q .vercel dist
del .git -recurse -force   # si existe .git del init fallido
```

### 2. Inicializar git y conectar al repo
```bash
cd C:\Users\lucas\Desktop\Vertice
git init
git remote add origin https://github.com/LucasIGomez/Vertice.git
git fetch origin
git checkout -b main
git add .
git status   # verificar que no incluya .env
git commit -m "Fase 1: scaffold TypeScript completo"
git push -u origin main --force
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Configurar Supabase
- Ir a https://supabase.com/dashboard → proyecto `dgncfvpmrskvqifmjdrp`
- SQL Editor → ejecutar `supabase/schema.sql`
- SQL Editor → ejecutar `supabase/seed.sql`
- Authentication → crear usuario con email/password para Lucas

### 5. Levantar dev server
```bash
npm run dev
```
Abrir http://localhost:5173

### 6. Continuar con Fase 2
Prioridad: cotizador completo → flujo cotización→pedido → Mercado Pago
