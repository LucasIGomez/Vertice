import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CardTitle, Button, Input, Select, PageLoader } from '@/components/ui';
import { getMaterials } from '@/services/materials';
import { getMachines } from '@/services/machines';
import { getSettings } from '@/services/settings';
import { quickEstimate, calculateCost } from '@/services/costCalculator';
import { QUICK_ESTIMATE_CATEGORIES, CURRENCY_FORMAT, SERVICE_TYPE_LABELS } from '@/lib/constants';
import type { Material, Machine, Settings, CostBreakdown, ServiceType } from '@/types';

type Mode = 'rapida' | 'exacta';

export function CalculatorPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<Mode>('rapida');
  const [serviceType, setServiceType] = useState<ServiceType>('impresion_3d');
  const [materialId, setMaterialId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [category, setCategory] = useState('mediano');
  const [quantity, setQuantity] = useState(1);
  const [marginPercent, setMarginPercent] = useState(40);

  // Exacta
  const [timeMinutes, setTimeMinutes] = useState(0);
  const [materialGrams, setMaterialGrams] = useState(0);

  const [result, setResult] = useState<CostBreakdown | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [mats, machs, sett] = await Promise.all([
          getMaterials(),
          getMachines(),
          getSettings(),
        ]);
        setMaterials(mats);
        setMachines(machs);
        setSettings(sett);
        setMarginPercent(sett.default_margin_percent);
        if (mats.length) setMaterialId(mats[0]!.id);
        if (machs.length) setMachineId(machs[0]!.id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleCalculate() {
    if (!settings) return;
    const material = materials.find(m => m.id === materialId);
    const machine = machines.find(m => m.id === machineId);
    if (!material || !machine) return;

    if (mode === 'rapida') {
      setResult(quickEstimate(category, material, machine, settings, quantity, marginPercent));
    } else {
      setResult(calculateCost({
        service_type: serviceType,
        material_id: materialId,
        machine_id: machineId,
        time_minutes: timeMinutes,
        material_grams: materialGrams,
        quantity,
        margin_percent: marginPercent,
      }, material, machine, settings));
    }
  }

  if (loading) return <PageLoader />;

  const materialOptions = materials.map(m => ({ value: m.id, label: `${m.name} (${m.color ?? ''})` }));
  const machineOptions = machines.map(m => ({ value: m.id, label: m.name }));
  const categoryOptions = Object.entries(QUICK_ESTIMATE_CATEGORIES).map(([value, { label }]) => ({ value, label }));
  const serviceOptions = Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Cotizador</h1>

      {/* Modo toggle */}
      <div className="flex gap-2">
        {(['rapida', 'exacta'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-vertice-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {m === 'rapida' ? '⚡ Rápida' : '🎯 Exacta'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <Card>
          <CardTitle>{mode === 'rapida' ? 'Cotización rápida' : 'Cotización exacta'}</CardTitle>
          <p className="text-sm text-gray-500 mb-4">
            {mode === 'rapida'
              ? 'Estimación basada en categoría de tamaño. Ideal para dar un precio antes de diseñar.'
              : 'Usá los datos del slicer para un cálculo preciso.'
            }
          </p>

          <div className="space-y-4">
            <Select label="Tipo de servicio" value={serviceType} onChange={e => setServiceType(e.target.value as ServiceType)} options={serviceOptions} />
            <Select label="Material" value={materialId} onChange={e => setMaterialId(e.target.value)} options={materialOptions} placeholder="Seleccionar material" />
            <Select label="Máquina" value={machineId} onChange={e => setMachineId(e.target.value)} options={machineOptions} placeholder="Seleccionar máquina" />

            {mode === 'rapida' ? (
              <Select label="Tamaño estimado" value={category} onChange={e => setCategory(e.target.value)} options={categoryOptions} />
            ) : (
              <>
                <Input label="Tiempo de impresión (minutos)" type="number" value={timeMinutes} onChange={e => setTimeMinutes(Number(e.target.value))} hint="Dato del slicer" />
                <Input label="Material (gramos)" type="number" value={materialGrams} onChange={e => setMaterialGrams(Number(e.target.value))} hint="Dato del slicer" />
              </>
            )}

            <Input label="Cantidad" type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} />
            <Input label="Margen de ganancia (%)" type="number" value={marginPercent} onChange={e => setMarginPercent(Number(e.target.value))} />

            <Button onClick={handleCalculate} className="w-full" disabled={!materialId || !machineId}>
              <Calculator className="h-4 w-4" /> Calcular
            </Button>
          </div>
        </Card>

        {/* Resultado */}
        {result && (
          <Card>
            <CardTitle>Desglose de costos</CardTitle>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Material', value: result.material },
                { label: 'Electricidad', value: result.electricity },
                { label: 'Desgaste máquina', value: result.machine_wear },
                { label: 'Mano de obra', value: result.labor },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium text-gray-900">{CURRENCY_FORMAT.format(value)}</span>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                <span className="text-gray-600">Subtotal (costo)</span>
                <span className="font-medium">{CURRENCY_FORMAT.format(result.subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Margen ({result.margin_percent}%)</span>
                <span className="font-medium text-vertice-600">+{CURRENCY_FORMAT.format(result.margin_amount)}</span>
              </div>

              <div className="border-t-2 border-vertice-600 pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Precio final</span>
                <span className="text-2xl font-bold text-vertice-600">{CURRENCY_FORMAT.format(result.total)}</span>
              </div>

              {quantity > 1 && (
                <p className="text-sm text-gray-500 text-right">
                  {CURRENCY_FORMAT.format(result.total / quantity)} por unidad × {quantity}
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
