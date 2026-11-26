import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Pencil } from 'lucide-react';
import { Card, CardTitle, Button, Input, EmptyState, PageLoader } from '@/components/ui';
import { getClients, createClient, updateClient } from '@/services/clients';
import type { Client } from '@/types';

type FormData = Omit<Client, 'id' | 'created_at' | 'updated_at'>;

const emptyForm: FormData = { name: '', phone: '', email: '', instagram: '', notes: '' };

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setClients(await getClients());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setForm(emptyForm); setEditing(null); setShowForm(true); }

  function openEdit(c: Client) {
    setForm({ name: c.name, phone: c.phone ?? '', email: c.email ?? '', instagram: c.instagram ?? '', notes: c.notes ?? '' });
    setEditing(c.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) { await updateClient(editing, form); }
      else { await createClient(form); }
      setShowForm(false);
      await load();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  const filtered = search
    ? clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search))
    : clients;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Nuevo cliente</Button>
      </div>

      <Input placeholder="Buscar por nombre o teléfono..." value={search} onChange={e => setSearch(e.target.value)} />

      {showForm && (
        <Card>
          <CardTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</CardTitle>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <Input label="Teléfono" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+54 11..." />
            <Input label="Email" type="email" value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="Instagram" value={form.instagram ?? ''} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@usuario" />
            <div className="sm:col-span-2">
              <Input label="Notas" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Guardar' : 'Agregar'}</Button>
          </div>
        </Card>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Sin clientes"
          description="Los clientes se crean automáticamente al generar una cotización, o podés agregarlos manualmente."
          actionLabel="Agregar cliente"
          onAction={openNew}
        />
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Teléfono</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Instagram</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-gray-600">{c.phone ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{c.email ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{c.instagram ?? '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
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
