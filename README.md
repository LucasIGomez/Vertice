# Vértice

Plataforma de gestión para emprendimientos de impresión 3D y grabado láser.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deploy:** Vercel (frontend) + Supabase Cloud (backend)
- **Routing:** React Router v7

## Setup local

```bash
# Clonar e instalar
git clone https://github.com/LucasIGomez/Vertice.git
cd Vertice
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Iniciar desarrollo
npm run dev
```

## Base de datos

1. Ir al SQL Editor de tu proyecto en Supabase
2. Ejecutar `supabase/schema.sql` (crea tablas, índices, RLS)
3. Ejecutar `supabase/seed.sql` (datos iniciales: máquinas, materiales)

## Estructura

```
src/
  components/
    ui/          # Componentes base (Button, Card, Input...)
    layout/      # AdminLayout, PublicLayout, Sidebar
    auth/        # ProtectedRoute
  pages/
    admin/       # Dashboard, Cotizador, Inventario, Pedidos...
    public/      # Home, Catálogo
    auth/        # Login
  hooks/         # useAuth, useSupabaseQuery
  services/      # CRUD + costCalculator
  types/         # Interfaces TypeScript
  lib/           # Supabase client, constantes
```
