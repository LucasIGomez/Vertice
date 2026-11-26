import { useState, useEffect } from 'react';
import { Card, CardTitle, Button, Input, PageLoader } from '@/components/ui';
import { getSettings, updateSettings } from '@/services/settings';
import type { Settings } from '@/types';

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
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

  function update(field: keyof Settings, value: string | number) {
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
        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${settings.mercadopago_enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>Mercado Pago — {settings.mercadopago_enabled ? 'Conectado' : 'No configurado'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${settings.whatsapp_enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span>WhatsApp Business — {settings.whatsapp_enabled ? 'Conectado' : 'No configurado'}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Las integraciones se configuran desde las variables de entorno del servidor.
          </p>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>Guardar configuración</Button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Guardado</span>}
      </div>
    </div>
  );
}
