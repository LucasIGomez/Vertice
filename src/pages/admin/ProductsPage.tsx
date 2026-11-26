import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Tag, Copy, Check, AlertTriangle } from 'lucide-react';
import { Card, CardTitle, Button, Input, Select, EmptyState, PageLoader } from '@/components/ui';
import { getProducts, createProduct, updateProduct, deleteProduct, type ProductInput } from '@/services/products';
import { getMachines } from '@/services/machines';
import { getMaterials } from '@/services/materials';
import { getSettings } from '@/services/settings';
import { productSetCost, materialInputUnit } from '@/services/costCalculator';
import { CURRENCY_FORMAT } from '@/lib/constants';
import type { Machine, Material, Product, Settings } from '@/types';

const NO_MATERIAL = '';

const emptyForm: ProductInput = {
  name: '',
  description: '',
  category: 'General',
  service_type: 'grabado_laser',
  machine_id: null,
  material_id: null,
  units_per_set: 1,
  time_minutes: 0,
  labor_minutes: 0,
  material_amount: 0,
  extra_cost: 0,
  price: 0,
  is_active: true,
  notes: '',
};

function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return String((err as { message?: string })?.message ?? err);
}

/** Ganancia sobre el costo, igual que el margen del cotizador. */
function profitPercent(price: number, cost: number) {
  return cost > 0 ? ((price - cost) / cost) * 100 : null;
}

function profitClass(p: number | null) {
  if (p === null) return 'text-gray-400';
  if (p < 0) return 'text-red-600 font-semibold';
  if (p < 30) return 'text-amber-600 font-medium';
  return 'text-vertice-700 font-medium';
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, m, mat, s] = await Promise.all([getProducts(), getMachines(), getMaterials(), getSettings()]);
      setProducts(p);
      setMachines(m);
      setMaterials(mat);
      setSettings(s);
    } catch (err) {
      console.error(err);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const laserMachines = useMemo(() => machines.filter(m => m.type === 'laser'), [machines]);
  const laserMaterials = useMemo(() => materials.filter(m => m.type !== 'filamento' && m.type !== 'resina'), [materials]);
  const categories = useMemo(() => [...new Set(products.map(p => p.category))].sort(), [products]);

  function costOf(p: Pick<Product, 'machine_id' | 'material_id' | 'service_type' | 'time_minutes' | 'labor_minutes' | 'material_amount' | 'extra_cost'>) {
    const machine = machines.find(m => m.id === p.machine_id);
    if (!machine || !settings) return null;
    const material = materials.find(m => m.id === p.material_id) ?? null;
    return productSetCost(p, material, machine, settings);
  }

  function openNew() {
    setForm({ ...emptyForm, machine_id: laserMachines[0]?.id ?? null });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = p;
    setForm({ ...rest, description: rest.description ?? '', notes: rest.notes ?? '' });
    setEditing(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('El producto necesita un nombre.'); return; }
    setSaving(true);
    setError(null);
    const payload: ProductInput = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim() || 'General',
      description: form.description?.trim() || null,
      notes: form.notes?.trim() || null,
      material_id: form.material_id || null,
    };
    try {
      if (editing) await updateProduct(editing, payload);
      else await createProduct(payload);
      setShowForm(false);
      await load();
    } catch (err) {
      console.error(err);
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Product) {
    if (!window.confirm(`¿Eliminar "${p.name}" del catálogo? No se puede deshacer.`)) return;
    try { await deleteProduct(p.id); await load(); }
    catch (err) { setError(errorMessage(err)); }
  }

  async function toggleActive(p: Product) {
    try { await updateProduct(p.id, { is_active: !p.is_active }); await load(); }
    catch (err) { setError(errorMessage(err)); }
  }

  async function copyPriceList() {
    const active = products.filter(p => p.is_active);
    const lines = [`*${settings?.business_name ?? 'Vértice'} — Grabado y corte láser*`, ''];
    for (const cat of [...new Set(active.map(p => p.category))]) {
      lines.push(`*${cat}*`);
      for (const p of active.filter(x => x.category === cat)) {
        const unit = p.units_per_set > 1 ? ` (${p.units_per_set} u. — ${CURRENCY_FORMAT.format(p.price / p.units_per_set)} c/u)` : '';
        lines.push(`• ${p.name}: ${CURRENCY_FORMAT.format(p.price)}${unit}`);
        if (p.description) lines.push(`   ${p.description}`);
      }
      lines.push('');
    }
    lines.push('Consultá por personalizaciones y cantidades mayores.');
    await navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <PageLoader />;

  const formMaterial = materials.find(m => m.id === form.material_id) ?? null;
  const formCost = costOf(form);
  const formProfit = formCost ? profitPercent(form.price, formCost.subtotal) : null;
  const num = (v: string) => (v === '' ? 0 : Number(v));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo láser</h1>
          <p className="text-sm text-gray-500">Juegos estándar con precio fijo. Los tiempos y el material son por juego completo.</p>
        </div>
        <div className="flex gap-2">
          {products.some(p => p.is_active) && (
            <Button variant="secondary" size="sm" onClick={copyPriceList}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiada' : 'Copiar lista de precios'}
            </Button>
          )}
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4" /> Nuevo producto</Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showForm && (
        <Card>
          <CardTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</CardTitle>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Topper de torta MDF" />
            <div className="space-y-1">
              <Input label="Categoría" list="product-categories" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              <datalist id="product-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="md:col-span-2">
              <Input label="Descripción (la ve el cliente)" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: Nombre y número, hasta 20 cm, MDF 3 mm" />
            </div>
            <Select
              label="Máquina"
              value={form.machine_id ?? ''}
              onChange={e => setForm(f => ({ ...f, machine_id: e.target.value || null }))}
              options={laserMachines.map(m => ({ value: m.id, label: m.name }))}
              placeholder="Seleccionar láser"
            />
            <Select
              label="Material"
              value={form.material_id ?? NO_MATERIAL}
              onChange={e => setForm(f => ({ ...f, material_id: e.target.value || null }))}
              options={[
                { value: NO_MATERIAL, label: 'Sin material (objeto del cliente o insumo extra)' },
                ...laserMaterials.map(m => ({ value: m.id, label: `${m.name}${m.color ? ` (${m.color})` : ''} — ${CURRENCY_FORMAT.format(m.unit_cost)}/${m.unit_label}` })),
              ]}
            />
            <Input label="Unidades por juego" type="number" min={1} value={form.units_per_set} onChange={e => setForm(f => ({ ...f, units_per_set: Math.max(1, num(e.target.value)) }))} />
            <Input label="Tiempo de láser (min)" type="number" min={0} value={form.time_minutes} onChange={e => setForm(f => ({ ...f, time_minutes: num(e.target.value) }))} hint="Del juego completo" />
            <Input label="Mano de obra (min)" type="number" min={0} value={form.labor_minutes} onChange={e => setForm(f => ({ ...f, labor_minutes: num(e.target.value) }))} hint="Diseño, armado, lijado, packaging" />
            <Input
              label={`Material (${materialInputUnit(formMaterial).label})`}
              type="number"
              min={0}
              step={0.01}
              disabled={!formMaterial}
              value={form.material_amount}
              onChange={e => setForm(f => ({ ...f, material_amount: num(e.target.value) }))}
              hint="Del juego completo, ej. 0.1 pliego"
            />
            <Input label="Otros insumos ($)" type="number" min={0} value={form.extra_cost} onChange={e => setForm(f => ({ ...f, extra_cost: num(e.target.value) }))} hint="Argollas, imanes, bolsitas, termo comprado..." />
            <Input label="Precio fijo del juego ($)" type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: num(e.target.value) }))} />
            <div className="md:col-span-2">
              <Input label="Notas internas" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm">
            {!formCost ? (
              <p className="text-gray-500">Elegí una máquina para ver el costo.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span>Costo del juego: <strong>{CURRENCY_FORMAT.format(formCost.subtotal)}</strong></span>
                <span className="text-gray-500">
                  (láser {CURRENCY_FORMAT.format(formCost.machine_wear + formCost.electricity)} · mano de obra {CURRENCY_FORMAT.format(formCost.labor)} · material {CURRENCY_FORMAT.format(formCost.material)} · insumos {CURRENCY_FORMAT.format(formCost.extra)})
                </span>
                <span className={profitClass(formProfit)}>
                  Ganancia: {formProfit === null ? '—' : `${Math.round(formProfit)}%`}
                </span>
                <span className="flex gap-1">
                  {[50, 100, 150].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, price: Math.ceil((formCost.subtotal * (1 + pct / 100)) / 100) * 100 }))}
                      className="px-2 py-0.5 rounded bg-white border border-gray-300 text-xs hover:bg-gray-100"
                    >
                      +{pct}%
                    </button>
                  ))}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleSave} loading={saving}>Guardar</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </Card>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-12 w-12" />}
          title="Catálogo vacío"
          description="Cargá tus juegos estándar de grabado láser con su precio fijo."
        />
      ) : (
        categories.map(cat => (
          <Card key={cat} padding={false}>
            <div className="px-6 py-3 border-b border-gray-100 font-semibold text-gray-900">{cat}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-2">Producto</th>
                    <th className="px-4 py-2 text-right">Costo</th>
                    <th className="px-4 py-2 text-right">Precio</th>
                    <th className="px-4 py-2 text-right">C/u</th>
                    <th className="px-4 py-2 text-right">Ganancia</th>
                    <th className="px-4 py-2 text-center">Activo</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.filter(p => p.category === cat).map(p => {
                    const cost = costOf(p);
                    const profit = cost ? profitPercent(p.price, cost.subtotal) : null;
                    return (
                      <tr key={p.id} className={p.is_active ? '' : 'opacity-50'}>
                        <td className="px-6 py-3 min-w-[220px]">
                          <p className="font-medium text-gray-900">
                            {p.name}
                            {p.units_per_set > 1 && <span className="ml-2 text-xs font-normal text-gray-500">× {p.units_per_set}</span>}
                          </p>
                          {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
                          {!p.machine_id && (
                            <p className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Sin máquina asignada</p>
                          )}
                          {p.notes && <p className="text-xs text-gray-400 italic">{p.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{cost ? CURRENCY_FORMAT.format(cost.subtotal) : '—'}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{CURRENCY_FORMAT.format(p.price)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{p.units_per_set > 1 ? CURRENCY_FORMAT.format(p.price / p.units_per_set) : '—'}</td>
                        <td className={`px-4 py-3 text-right ${profitClass(profit)}`}>{profit === null ? '—' : `${Math.round(profit)}%`}</td>
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" checked={p.is_active} onChange={() => toggleActive(p)} className="rounded border-gray-300" aria-label="Activo" />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button type="button" onClick={() => openEdit(p)} className="p-1 text-gray-400 hover:text-gray-700" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
                          <button type="button" onClick={() => handleDelete(p)} className="p-1 text-gray-400 hover:text-red-600" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
