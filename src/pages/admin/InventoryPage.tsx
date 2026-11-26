import { useState, useEffect, useCallback } from 'react';
import { Plus, Package, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, Input, Select, Badge, EmptyState, PageLoader } from '@/components/ui';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '@/services/materials';
import { MATERIAL_TYPE_LABELS } from '@/lib/constants';
import type { Material, MaterialType } from '@/types';

type FormData = Omit<Material, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: FormData = {
  name: '', type: 'filamento', color: '', brand: '', unit_cost: 0,
  unit_label: 'kg', stock_quantity: 0, stock_min_alert: 1, supplier: '', notes: '',
};

export function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      const data = await getMaterials();
      setMaterials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(m: Material) {
    setForm({
      name: m.name, type: m.type, color: m.color ?? '', brand: m.brand ?? '',
      unit_cost: m.unit_cost, unit_label: m.unit_label, stock_quantity: m.stock_quantity,
      stock_min_alert: m.stock_min_alert, supplier: m.supplier ?? '', notes: m.notes ?? '',
    });
    setEditing(m.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await updateMaterial(editing, form);
      } else {
        await createMaterial(form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este material?')) return;
    try {
      await deleteMaterial(id);
      await load();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = filterType === 'all'
    ? materials
    : materials.filter(m => m.type === filterType);

  if (loading) return <PageLoader />;

  const typeOptions = [
    { value: 'all', label: 'Todos' },
    ...Object.entries(MATERIAL_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const materialTypeOptions = Object.entries(MATERIAL_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Agregar material
        </Button>
      </div>

      {/* Filtro */}
      <div className="flex gap-2 flex-wrap">
        {typeOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterType(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterType === opt.value
                ? 'bg-vertice-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <Card>
          <CardTitle>{editing ? 'Editar material' : 'Nuevo material'}</CardTitle>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Select label="Tipo" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MaterialType }))} options={materialTypeOptions} />
            <Input label="Color" value={form.color ?? ''} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            <Input label="Marca" value={form.brand ?? ''} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
            <Input label="Costo por unidad ($)" type="number" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: Number(e.target.value) }))} />
            <Input label="Unidad" value={form.unit_label} onChange={e => setForm(f => ({ ...f, unit_label: e.target.value }))} hint="kg, ml, metro, pliego" />
            <Input label="Stock actual" type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: Number(e.target.value) }))} />
            <Input label="Alerta mínimo" type="number" value={form.stock_min_alert} onChange={e => setForm(f => ({ ...f, stock_min_alert: Number(e.target.value) }))} />
            <Input label="Proveedor" value={form.supplier ?? ''} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} />
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Guardar cambios' : 'Agregar'}</Button>
          </div>
        </Card>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Sin materiales"
          description="Agregá tu primer material para empezar a gestionar tu inventario."
          actionLabel="Agregar material"
          onAction={openNew}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Material</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Costo</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Proveedor</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{m.name}</p>
                        {m.color && <p className="text-xs text-gray-500">{m.color} {m.brand ? `· ${m.brand}` : ''}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge>{MATERIAL_TYPE_LABELS[m.type]}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      ${m.unit_cost.toLocaleString('es-AR')}/{m.unit_label}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={m.stock_quantity <= m.stock_min_alert ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {m.stock_quantity}
                        </span>
                        {m.stock_quantity <= m.stock_min_alert && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{m.supplier ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
