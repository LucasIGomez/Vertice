// Helpers de servidor compartidos por las funciones de /api.
// Los archivos dentro de carpetas que empiezan con "_" no se publican como endpoints en Vercel.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Cliente con permisos de administrador (ignora RLS). Solo para uso en el servidor. */
export function adminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new HttpError(500, 'Falta SUPABASE_SERVICE_ROLE_KEY (o VITE_SUPABASE_URL) en las variables de entorno de Vercel.');
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Verifica que la petición venga de un usuario logueado en el panel. Devuelve el usuario. */
export async function requireUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'No autenticado');
  if (!SUPABASE_URL || !ANON_KEY) throw new HttpError(500, 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Sesión inválida o vencida');
  return data.user;
}

/** URL pública del sitio (para back_urls y webhooks). */
export function publicUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

/** Envuelve un handler para responder errores como JSON. */
export function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status >= 500) console.error(err);
      res.status(status).json({ ok: false, error: err?.message || String(err) });
    }
  };
}
