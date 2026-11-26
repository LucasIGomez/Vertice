import { useState, useEffect, useCallback } from 'react';
import { Plus, Cpu, Pencil, Trash2 } from 'lucide-react';
import { Card, CardTitle, Button, Input, Select, Badge, EmptyState, PageLoader } from '@/components/ui';
import { getMachines, createMachine, updateMachine, deleteMachine } from '@/services/machines';
import { MACHINE_TYPE_LABELS, CURRENCY_FORMAT } from '@/lib/constants';
import type { Machine, MachineType } from '@/types';

type FormData = Omit<Machine, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: FormData = {
  name: '', type: 'printer_fdm', brand: '', model: '',
  purchase_cost: 0, lifespan_hours: 5000, wattage: 200,
  maintenance_cost_monthly: 0, is_active: true, notes: '',
};

export function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setMachines(await getMachines());
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

  function openEdit(m: Machine) {
    setForm({
      name: m.name, type: m.type, brand: m.brand ?? '', model: m.model ?? '',
      purchase_cost: m.purchase_cost, lifespan_hours: m.lifespan_hours,
      wattage: m.wattage, maintenance_cost_monthly: m.maintenance_cost_monthly,
      is_active: m.is_active, notes: m.notes ?? '',
    });
    setEditing(m.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await updateMachine(editing, form);
      } else {
        await createMachine(form);
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
    if (!confirm('¿Eliminar esta máquina?')) return;
    try {
      await deleteMachine(id);
      await load();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <PageLoader />;

  const typeOptions = Object.entries(MACHINE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Máquinas</h1>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Agregar máquina
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardTitle>{editing ? 'Editar máquina' : 'Nueva máquina'}</CardTitle>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Select label="Tipo" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MachineType }))} options={typeOptions} />
            <Input label="Marca" value={form.brand ?? ''} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
            <Input label="Modelo" value={form.model ?? ''} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
            <Input label="Costo de compra ($)" type="number" value={form.purchase_cost} onChange={e => setForm(f => ({ ...f, purchase_cost: Number(e.target.value) }))} />
            <Input label="Vida útil (horas)" type="number" value={form.lifespan_hours} onChange={e => setForm(f => ({ ...f, lifespan_hours: Number(e.target.value) }))} />
            <Input label="Consumo (watts)" type="number" value={form.wattage} onChange={e => setForm(f => ({ ...f, wattage: Number(e.target.value) }))} />
            <Input label="Mantenimiento mensual ($)" type="number" value={form.maintenance_cost_monthly} onChange={e => setForm(f => ({ ...f, maintenance_cost_monthly: Number(e.target.value) }))} />
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Guardar cambios' : 'Agregar'}</Button>
          </div>
        </Card>
      )}

      {machines.length === 0 ? (
        <EmptyState
          icon={<Cpu className="h-12 w-12" />}
          title="Sin máquinas"
          description="Agregá tus impresoras y grabadora láser para habilitar el cotizador."
          actionLabel="Agregar máquina"
          onAction={openNew}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map(m => (
            <Card key={m.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{m.name}</h3>
                  <p className="text-sm text-gray-500">{m.brand} {m.model}</p>
                </div>
                <Badge className={m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                  {m.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Tipo:</span> {MACHINE_TYPE_LABELS[m.type]}</p>
                <p><span className="font-medium">Costo:</span> {CURRENCY_FORMAT.format(m.purchase_cost)}</p>
                <p><span className="font-medium">Consumo:</span> {m.wattage}W</p>
                <p><span className="font-medium">Vida útil:</span> {m.lifespan_hours.toLocaleString()} hs</p>
              </div>
              <div className="mt-4 flex gap-1 justify-end">
                <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
