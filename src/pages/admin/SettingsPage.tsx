import { useState, useEffect } from 'react';
import { Card, CardTitle, Button, Input, PageLoader } from '@/components/ui';
import { getSettings, updateSettings } from '@/services/settings';
import { getIntegrationStatus, type IntegrationStatus } from '@/services/integrations';
import type { Settings } from '@/types';

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
    getIntegrationStatus()
      .then(setStatus)
      .catch(err => setStatusError(err instanceof Error ? err.message : String(err)));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateSettings({
        electricity_cost_kwh: settings.electricity_cost_kwh,
        labor_cost_hour: settings.labor_cost_hour,
        default_margin_percent: settings.default_margin_percent,
        business_name: settings.business_name,
        business_phone: settings.business_phone,
        business_instagram: settings.business_instagram,
        whatsapp_enabled: settings.whatsapp_enabled,
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) return <PageLoader />;

  function update(field: keyof Settings, value: string | number | boolean) {
    setSettings(s => s ? { ...s, [field]: value } : s);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      <Card>
        <CardTitle>Datos del negocio</CardTitle>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre del negocio" value={settings.business_name} onChange={e => update('business_name', e.target.value)} />
          <Input label="Teléfono" value={settings.business_phone ?? ''} onChange={e => update('business_phone', e.target.value)} />
          <Input label="Instagram" value={settings.business_instagram ?? ''} onChange={e => update('business_instagram', e.target.value)} />
        </div>
      </Card>

      <Card>
        <CardTitle>Parámetros de costeo</CardTitle>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Costo kWh ($)"
            type="number"
            value={settings.electricity_cost_kwh}
            onChange={e => update('electricity_cost_kwh', Number(e.target.value))}
            hint="Precio del kWh en tu zona"
          />
          <Input
            label="Mano de obra ($/hora)"
            type="number"
            value={settings.labor_cost_hour}
            onChange={e => update('labor_cost_hour', Number(e.target.value))}
            hint="Tu costo horario de trabajo"
          />
          <Input
            label="Margen por defecto (%)"
            type="number"
            value={settings.default_margin_percent}
            onChange={e => update('default_margin_percent', Number(e.target.value))}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>Integraciones</CardTitle>
        <div className="mt-4 space-y-4 text-sm text-gray-600">
          {statusError && <p className="text-yellow-700">No se pudo consultar el servidor: {statusError}</p>}
          {status && !status.server && (
            <p className="text-yellow-700">
              Falta <code>SUPABASE_SERVICE_ROLE_KEY</code> en Vercel: sin ella no funcionan los pagos ni los avisos.
            </p>
          )}
          <IntegrationRow
            ok={!!status?.mercadopago}
            title="Mercado Pago"
            detail={!status ? '—' : !status.mercadopago
              ? 'Falta MP_ACCESS_TOKEN en Vercel'
              : status.mercadopago_test ? 'Conectado en modo PRUEBA (credenciales TEST-)' : 'Conectado (producción)'}
          />
          <IntegrationRow
            ok={!!status?.whatsapp}
            title="WhatsApp Business (Cloud API)"
            detail={!status ? '—' : status.whatsapp
              ? `Conectado · plantilla "${status.whatsapp_template}"`
              : 'Faltan WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID en Vercel'}
          />
          <label className="flex items-center gap-3 pt-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-vertice-600 focus:ring-vertice-500"
              checked={settings.whatsapp_enabled}
              onChange={e => update('whatsapp_enabled', e.target.checked)}
            />
            <span>
              Avisar al cliente por WhatsApp cuando su pedido cambia de estado o paga
              <span className="block text-xs text-gray-400">Confirmado, en producción, listo, entregado, cancelado y pagos recibidos.</span>
            </span>
          </label>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>Guardar configuración</Button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Guardado</span>}
      </div>
    </div>
  );
}

function IntegrationRow({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-gray-300'}`} />
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{detail}</p>
      </div>
    </div>
  );
}
