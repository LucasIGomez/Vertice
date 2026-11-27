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
4. Ejecutar las migraciones en orden: `migration-002-…`, `migration-003-…`, `migration-004-pagos-whatsapp.sql`

## Integraciones (funciones de servidor en `api/`)

Las claves van en **Vercel → Settings → Environment Variables** (ver `.env.example`) y después hay que hacer
**Redeploy**. Nunca les pongas el prefijo `VITE_`: eso las publicaría en el navegador.

| Variable | Para qué |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | El servidor escribe pagos y avisos (Supabase → Project Settings → API) |
| `MP_ACCESS_TOKEN` | Crear links de pago y consultar pagos |
| `MP_WEBHOOK_SECRET` | Verificar que las notificaciones vienen de Mercado Pago (opcional, recomendado) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Enviar avisos por la API oficial de WhatsApp |
| `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG` | Plantilla a usar (por defecto `actualizacion_pedido`, `es_AR`) |

En **Configuración** del panel se ve qué integraciones quedaron conectadas.

### Mercado Pago

1. En [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) creá una aplicación
   (producto *Checkout Pro*) y copiá el **Access Token** (primero el de prueba `TEST-…`, después el de producción).
2. En la app → **Webhooks**: URL `https://TU-DOMINIO/api/mp/webhook`, evento **Pagos**. Copiá la clave secreta a
   `MP_WEBHOOK_SECRET`. (El link de pago ya manda esta URL igual, el panel solo agrega la firma.)
3. En **Pedidos**, cada tarjeta tiene *Cobrar con Mercado Pago*: elegís total o seña, se genera el link y lo mandás
   por WhatsApp. Cuando el cliente paga, el pedido se actualiza solo (Seña pagada / Pagado) y, si estaba en
   consulta, pasa a *Confirmado*.

### WhatsApp (Cloud API de Meta)

Los avisos automáticos usan la API oficial. Fuera de las 24 h desde el último mensaje del cliente, WhatsApp
solo deja enviar **plantillas aprobadas**, así que hay que crear una:

1. [Meta for Developers](https://developers.facebook.com/apps) → crear app tipo *Empresa* → agregar **WhatsApp**.
   Registrá el número del negocio (no puede estar usándose a la vez en la app de WhatsApp común).
2. Copiá el **Phone number ID** a `WHATSAPP_PHONE_NUMBER_ID`. Para `WHATSAPP_TOKEN` creá un *usuario del sistema*
   en el Business Manager con permiso `whatsapp_business_messaging` y generá un token **permanente**
   (el token temporal del panel vence en 24 h).
3. En **WhatsApp Manager → Plantillas** creá:
   - Nombre: `actualizacion_pedido` · Categoría: **Utilidad** · Idioma: **Español (ARG)**
   - Cuerpo: `Hola {{1}}, te escribimos de {{2}}. Novedades de tu pedido: {{3}}. Ante cualquier consulta respondé este mensaje.`
   - Ejemplos: `Juan` · `Vértice` · `ya está en producción`
4. Cuando la plantilla esté aprobada, activá *Avisar al cliente por WhatsApp* en **Configuración**.

Se avisa cuando el pedido pasa a Confirmado, En producción, Listo, Entregado o Cancelado, y cuando se acredita un
pago. Cada envío (o error) queda registrado en la tabla `notifications`. Los teléfonos se normalizan al formato
`549 + área + número`.

### Probar en local

`npm run dev` solo levanta el frontend. Para probar también las funciones de `api/` usá `npx vercel dev`.

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
