// Vértice — keep-alive de Supabase
// Supabase (plan gratuito) pausa el proyecto tras varios días sin actividad.
// Vercel Cron llama a esta función una vez por día (ver vercel.json) y hace
// una consulta real a Postgres para que el proyecto cuente como activo.

export default async function handler(req, res) {
  // Si está definida CRON_SECRET en Vercel, solo acepta llamadas del cron.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return res.status(500).json({ ok: false, error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY' });
  }

  try {
    // La tabla settings tiene lectura pública: la consulta llega a la base de datos.
    const r = await fetch(`${url}/rest/v1/settings?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const body = await r.text();
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok, status: r.status, at: new Date().toISOString(), body: r.ok ? undefined : body.slice(0, 300) });
  } catch (err) {
    return res.status(502).json({ ok: false, error: String(err) });
  }
}
