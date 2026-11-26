import { useState, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { Card, Badge, EmptyState, PageLoader } from '@/components/ui';
import { getQuotes } from '@/services/quotes';
import { CURRENCY_FORMAT } from '@/lib/constants';
import type { Quote } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  vencida: 'Vencida',
};

const STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-blue-100 text-blue-700',
  aceptada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
  vencida: 'bg-yellow-100 text-yellow-700',
};

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { setQuotes(await getQuotes()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;

  if (quotes.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="Sin cotizaciones"
          description="Usá el cotizador para crear tu primera cotización."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Precio final</th>
                <th className="px-6 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {q.client?.name ?? 'Sin cliente'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={STATUS_COLORS[q.status] ?? ''}>
                      {STATUS_LABELS[q.status] ?? q.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{CURRENCY_FORMAT.format(q.total)}</td>
                  <td className="px-6 py-4 font-medium text-vertice-600">{CURRENCY_FORMAT.format(q.final_price)}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(q.created_at).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
