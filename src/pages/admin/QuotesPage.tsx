import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { Card, Badge, Button, EmptyState, PageLoader } from '@/components/ui';
import { getQuotes } from '@/services/quotes';
import { CURRENCY_FORMAT, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/lib/constants';
import type { Quote } from '@/types';

export function QuotesPage() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setQuotes(await getQuotes()); }
    catch (err) {
      console.error(err);
      setError(String((err as { message?: string })?.message ?? err));
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <PageLoader />;

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
      <Link to="/admin/cotizador">
        <Button size="sm"><Plus className="h-4 w-4" /> Nueva</Button>
      </Link>
    </div>
  );

  if (error) {
    return <div className="space-y-6">{header}<p className="text-sm text-red-600">{error}</p></div>;
  }

  if (quotes.length === 0) {
    return (
      <div className="space-y-6">
        {header}
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
      {header}

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Ítems</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-right">Costo</th>
                <th className="px-6 py-3 text-right">Precio</th>
                <th className="px-6 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map(q => (
                <tr key={q.id} onClick={() => navigate(`/admin/cotizaciones/${q.id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 text-gray-500">{q.number}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{q.client?.name ?? 'Sin cliente'}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                    {q.items.map(i => i.description).join(', ')}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={QUOTE_STATUS_COLORS[q.status] ?? ''}>
                      {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{CURRENCY_FORMAT.format(q.total)}</td>
                  <td className="px-6 py-4 text-right font-medium text-vertice-600">{CURRENCY_FORMAT.format(q.final_price)}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(q.created_at).toLocaleDateString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
