import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus, Trash2, Save } from 'lucide-react';
import { Card, CardTitle, Button, Input, Select, PageLoader } from '@/components/ui';
import { getMaterials } from '@/services/materials';
import { getMachines } from '@/services/machines';
import { getSettings } from '@/services/settings';
import { getClients, createClient } from '@/services/clients';
import { createQuote } from '@/services/quotes';
import { calculateCost, materialInputUnit, machineWearPerHour, electricityCostPerHour } from '@/services/costCalculator';
import { useQuoteDraft } from '@/hooks/useQuoteDraft';
import { QUICK_ESTIMATE_CATEGORIES, CURRENCY_FORMAT, SERVICE_TYPE_LABELS } from '@/lib/constants';
import type { Material, Machine, Settings, ServiceType, Client } from '@/types';

const NO_MATERIAL = '__none__';
const NEW_CLIENT = '__new__';

function isMaterialFor(service: ServiceType, m: Material) {
  const printMaterial = m.type === 'filamento' || m.type === 'resina';
  return service === 'impresion_3d' ? printMaterial : !printMaterial;
}

function isMachineFor(service: ServiceType, m: Machine) {
  return m.is_active && (service === 'grabado_laser' ? m.type === 'laser' : m.type !== 'laser');
}

function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return String((err as { message?: string })?.message ?? err);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function CalculatorPage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [serviceType, setServiceType] = useState<ServiceType>('impresion_3d');
  const [materialId, setMaterialId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [timeMinutes, setTimeMinutes] = useState(0);
  const [laborMinutes, setLaborMinutes] = useState(0);
  const [materialAmount, setMaterialAmount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [batch, setBatch] = useState(false);
  const [marginPercent, setMarginPercent] = useState(40);
  const [description, setDescription] = useState('');

  const { draft, update, addItem, removeItem, reset } = useQuoteDraft();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [mats, machs, sett, cls] = await Promise.all([getMaterials(), getMachines(), getSettings(), getClients()]);
        setMaterials(mats);
        setMachines(machs);
        setSettings(sett);
        setClients(cls);
        setMarginPercent(Number(sett.default_margin_percent));
      } catch (err) {
        console.error(err);
        setLoadError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const availableMaterials = useMemo(() => materials.filter(m => isMaterialFor(serviceType, m)), [materials, serviceType]);
  const availableMachines = useMemo(() => machines.filter(m => isMachineFor(serviceType, m)), [machines, serviceType]);

  // Al cambiar de servicio (o al cargar), elegir la primera máquina/material compatibles
  useEffect(() => {
    if (!availableMachines.some(m => m.id === machineId)) setMachineId(availableMachines[0]?.id ?? '');
    if (materialId !== NO_MATERIAL && !availableMaterials.some(m => m.id === materialId)) {
      setMaterialId(availableMaterials[0]?.id ?? (serviceType === 'grabado_laser' ? NO_MATERIAL : ''));
    }
  }, [availableMachines, availableMaterials, machineId, materialId, serviceType]);

  const material = materialId === NO_MATERIAL ? null : materials.find(m => m.id === materialId) ?? null;
  const machine = machines.find(m => m.id === machineId) ?? null;
  const unit = materialInputUnit(material);

  function applyCategory(key: string) {
    const cat = QUICK_ESTIMATE_CATEGORIES[serviceType][key];
    if (!cat) return;
    setCategory(key);
    setBatch(false);
    setTimeMinutes(cat.minutes);
    setLaborMinutes(cat.labor);
    setMaterialAmount(material ? cat.material : 0);
    if (!description) setDescription(cat.label.split(' (')[0] ?? '');
  }

  function changeService(s: ServiceType) {
    setServiceType(s);
    setCategory(null);
    setMaterialId('');
  }

  // Costo del ítem actual. En modo tanda, los valores ya son del total → se calcula con cantidad 1.
  const result = useMemo(() => {
    if (!settings || !machine) return null;
    if (materialId !== NO_MATERIAL && !material) return null;
    return calculateCost(
      {
        service_type: serviceType,
        material_id: material?.id ?? '',
        machine_id: machine.id,
        time_minutes: timeMinutes,
        labor_minutes: laborMinutes,
        material_amount: materialAmount,
        quantity: batch ? 1 : quantity,
        margin_percent: marginPercent,
      },
      material,
      machine,
      settings,
    );
  }, [settings, machine, material, materialId, serviceType, timeMinutes, laborMinutes, materialAmount, quantity, batch, marginPercent]);

  function handleAddItem() {
    if (!result || !machine) return;
    addItem({
      description: description.trim() || (SERVICE_TYPE_LABELS[serviceType] ?? 'Ítem'),
      service_type: serviceType,
      material_id: material?.id ?? null,
      machine_id: machine.id,
      quantity,
      time_minutes: timeMinutes,
      labor_minutes: laborMinutes,
      material_amount: materialAmount,
      batch,
      cost: result,
    });
    setDescription('');
    setCategory(null);
  }

  const draftCost = draft.items.reduce((sum, i) => sum + i.cost.subtotal, 0);
  const marginFactor = 1 + marginPercent / 100;

  async function handleSaveQuote() {
    if (draft.items.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      let clientId: string | null = draft.clientId && draft.clientId !== NEW_CLIENT ? draft.clientId : null;
      if (draft.clientId === NEW_CLIENT) {
        if (!draft.newClientName.trim()) throw new Error('Completá el nombre del cliente nuevo.');
        const client = await createClient({
          name: draft.newClientName.trim(),
          phone: draft.newClientPhone.trim() || null,
          email: null,
          instagram: null,
          notes: null,
        });
        clientId = client.id;
      }

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + Math.max(1, draft.validDays));

      const quote = await createQuote(
        {
          client_id: clientId,
          status: 'borrador',
          total: round2(draftCost),
          margin_percent: marginPercent,
          final_price: round2(draftCost * marginFactor),
          valid_until: validUntil.toISOString(),
          notes: draft.notes.trim() || null,
        },
        draft.items.map(i => ({
          service_type: i.service_type,
          description: i.description,
          quantity: i.quantity,
          material_id: i.material_id,
          machine_id: i.machine_id,
          estimated_time_minutes: Math.round(i.time_minutes),
          exact_time_minutes: null,
          material_grams: i.material_amount,
          labor_minutes: Math.round(i.labor_minutes),
          material_cost: round2(i.cost.material),
          electricity_cost: round2(i.cost.electricity),
          machine_wear_cost: round2(i.cost.machine_wear),
          labor_cost: round2(i.cost.labor),
          subtotal: round2(i.cost.subtotal),
          price: round2(i.cost.subtotal * marginFactor),
        })),
      );
      reset();
      navigate(`/admin/cotizaciones/${quote.id}`);
    } catch (err) {
      console.error(err);
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader />;

  if (loadError || !settings) {
    return (
      <Card>
        <div className="flex gap-3 text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">No se pudieron cargar los datos de Supabase.</p>
            <p className="text-sm mt-1">{loadError ?? 'No existe la fila de configuración.'}</p>
            <p className="text-sm mt-2 text-gray-600">
              Verificá que se hayan ejecutado <code>supabase/schema.sql</code> y <code>supabase/seed.sql</code> en el SQL Editor.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const serviceOptions = Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  const materialOptions = [
    ...(serviceType === 'grabado_laser' ? [{ value: NO_MATERIAL, label: 'Sin material (objeto del cliente)' }] : []),
    ...availableMaterials.map(m => ({
      value: m.id,
      label: `${m.name}${m.color ? ` (${m.color})` : ''} — ${CURRENCY_FORMAT.format(m.unit_cost)}/${m.unit_label}`,
    })),
  ];
  const machineOptions = availableMachines.map(m => ({ value: m.id, label: m.name }));
  const clientOptions = [
    { value: '', label: 'Sin cliente' },
    { value: NEW_CLIENT, label: '+ Cliente nuevo' },
    ...clients.map(c => ({ value: c.id, label: c.phone ? `${c.name} — ${c.phone}` : c.name })),
  ];
  const categories = Object.entries(QUICK_ESTIMATE_CATEGORIES[serviceType]);
  const minutesLabel = serviceType === 'grabado_laser' ? 'Tiempo de láser (min)' : 'Tiempo de impresión (min)';
  const perLabel = batch ? 'Total de la tanda' : 'Por unidad';

  const rows = result
    ? [
        { label: 'Material', value: result.material },
        { label: 'Electricidad', value: result.electricity },
        { label: 'Desgaste de máquina', value: result.machine_wear },
        { label: 'Mano de obra', value: result.labor },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Cotizador</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <div className="space-y-4">
            <Select label="Tipo de servicio" value={serviceType} onChange={e => changeService(e.target.value as ServiceType)} options={serviceOptions} />
            <Select label="Máquina" value={machineId} onChange={e => setMachineId(e.target.value)} options={machineOptions} placeholder="Seleccionar máquina" />
            <Select label="Material" value={materialId} onChange={e => setMaterialId(e.target.value)} options={materialOptions} placeholder="Seleccionar material" />
            {serviceType === 'impresion_3d' && availableMaterials.length === 0 && (
              <p className="text-sm text-amber-700">No hay filamentos cargados. Agregalos en Inventario.</p>
            )}

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-1">⚡ Estimación rápida (sin slicer)</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyCategory(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      category === key ? 'bg-vertice-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Completa los campos de abajo con valores típicos. Si tenés datos del slicer, cargalos directo.</p>
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" className="mt-0.5 rounded border-gray-300" checked={batch} onChange={e => setBatch(e.target.checked)} />
              <span>
                Los valores son de la <strong>tanda completa</strong>
                <span className="block text-xs text-gray-500">Ej: 12 llaveros en una sola impresión de 3 h y 60 g.</span>
              </span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <Input label={minutesLabel} type="number" min={0} value={timeMinutes} onChange={e => { setTimeMinutes(Number(e.target.value)); setCategory(null); }} hint={perLabel} />
              <Input
                label={`Material (${unit.label})`}
                type="number"
                min={0}
                step={unit.factor === 1 ? 0.01 : 1}
                value={materialAmount}
                disabled={!material}
                onChange={e => { setMaterialAmount(Number(e.target.value)); setCategory(null); }}
                hint={perLabel}
              />
              <Input label="Mano de obra (min)" type="number" min={0} value={laborMinutes} onChange={e => { setLaborMinutes(Number(e.target.value)); setCategory(null); }} hint={`${perLabel} — diseño, preparación, post-proceso`} />
              <Input label={batch ? 'Unidades en la tanda' : 'Cantidad'} type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} />
            </div>

            <Input label="Margen de ganancia (%)" type="number" min={0} value={marginPercent} onChange={e => setMarginPercent(Number(e.target.value))} hint="Se aplica a toda la cotización" />
          </div>
        </Card>

        <Card>
          <CardTitle>Desglose</CardTitle>
          {!result ? (
            <p className="mt-4 text-sm text-gray-500">Elegí máquina y material para ver el cálculo.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {rows.map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium text-gray-900">{CURRENCY_FORMAT.format(value)}</span>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Costo total</span>
                <span className="font-semibold text-gray-900">{CURRENCY_FORMAT.format(result.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ganancia ({result.margin_percent}%)</span>
                <span className="font-medium text-vertice-600">+{CURRENCY_FORMAT.format(result.margin_amount)}</span>
              </div>

              <div className="border-t-2 border-vertice-600 pt-3 flex justify-between items-baseline">
                <span className="text-lg font-bold text-gray-900">Precio a cobrar</span>
                <span className="text-2xl font-bold text-vertice-600">{CURRENCY_FORMAT.format(result.total)}</span>
              </div>

              {quantity > 1 && (
                <p className="text-sm text-gray-500 text-right">
                  {CURRENCY_FORMAT.format(result.total / quantity)} por unidad (costo {CURRENCY_FORMAT.format(result.subtotal / quantity)}) × {quantity}
                </p>
              )}

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <Input label="Descripción del ítem" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Llavero logo, PLA negro" />
                <Button onClick={handleAddItem} className="w-full">
                  <Plus className="h-4 w-4" /> Agregar a la cotización
                </Button>
              </div>

              {machine && (
                <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
                  <p>Parámetros usados:</p>
                  <p>• {machine.name}: desgaste {CURRENCY_FORMAT.format(machineWearPerHour(machine))}/h, luz {CURRENCY_FORMAT.format(electricityCostPerHour(machine, settings))}/h ({machine.wattage} W × {CURRENCY_FORMAT.format(settings.electricity_cost_kwh)}/kWh)</p>
                  <p>• Mano de obra: {CURRENCY_FORMAT.format(settings.labor_cost_hour)}/h</p>
                  <p>Se editan en Máquinas, Inventario y Configuración.</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Cotización en armado */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Cotización en armado</CardTitle>
          {draft.items.length > 0 && (
            <button type="button" onClick={reset} className="text-sm text-gray-500 hover:text-red-600">Vaciar</button>
          )}
        </div>

        {draft.items.length === 0 ? (
          <p className="text-sm text-gray-500">Calculá un ítem y tocá “Agregar a la cotización”. Podés sumar varios ítems antes de guardar.</p>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2 pr-4">Ítem</th>
                    <th className="py-2 pr-4 text-right">Cant.</th>
                    <th className="py-2 pr-4 text-right">Costo</th>
                    <th className="py-2 pr-4 text-right">Precio unit.</th>
                    <th className="py-2 pr-4 text-right">Precio total</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {draft.items.map(i => {
                    const price = i.cost.subtotal * marginFactor;
                    return (
                      <tr key={i.key}>
                        <td className="py-2 pr-4">
                          <p className="font-medium text-gray-900">{i.description}</p>
                          <p className="text-xs text-gray-500">
                            {machines.find(m => m.id === i.machine_id)?.name ?? '—'}
                            {i.batch ? ' · tanda' : ''}
                          </p>
                        </td>
                        <td className="py-2 pr-4 text-right">{i.quantity}</td>
                        <td className="py-2 pr-4 text-right text-gray-600">{CURRENCY_FORMAT.format(i.cost.subtotal)}</td>
                        <td className="py-2 pr-4 text-right">{CURRENCY_FORMAT.format(price / i.quantity)}</td>
                        <td className="py-2 pr-4 text-right font-medium">{CURRENCY_FORMAT.format(price)}</td>
                        <td className="py-2 text-right">
                          <button type="button" onClick={() => removeItem(i.key)} className="p-1 text-gray-400 hover:text-red-600" aria-label="Quitar ítem">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-gray-200">
                  <tr>
                    <td className="pt-3 font-semibold" colSpan={2}>Total ({marginPercent}% de margen)</td>
                    <td className="pt-3 pr-4 text-right text-gray-600">{CURRENCY_FORMAT.format(draftCost)}</td>
                    <td />
                    <td className="pt-3 pr-4 text-right text-lg font-bold text-vertice-600">{CURRENCY_FORMAT.format(draftCost * marginFactor)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Cliente" value={draft.clientId} onChange={e => update({ clientId: e.target.value })} options={clientOptions} />
              <Input label="Validez (días)" type="number" min={1} value={draft.validDays} onChange={e => update({ validDays: Math.max(1, Number(e.target.value)) })} />
              {draft.clientId === NEW_CLIENT && (
                <>
                  <Input label="Nombre del cliente" value={draft.newClientName} onChange={e => update({ newClientName: e.target.value })} />
                  <Input label="Teléfono / WhatsApp" value={draft.newClientPhone} onChange={e => update({ newClientPhone: e.target.value })} placeholder="Ej: 3511234567" />
                </>
              )}
              <div className="md:col-span-2">
                <Input label="Notas para el cliente" value={draft.notes} onChange={e => update({ notes: e.target.value })} placeholder="Ej: Incluye argollas. Entrega en 5 días hábiles." />
              </div>
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            <Button onClick={handleSaveQuote} loading={saving} className="w-full md:w-auto">
              <Save className="h-4 w-4" /> Guardar cotización
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
