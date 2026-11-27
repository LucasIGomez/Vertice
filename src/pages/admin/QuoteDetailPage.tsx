import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, MessageCircle, Check, X, Trash2, ClipboardList } from 'lucide-react';
import { Card, Button, Badge, PageLoader } from '@/components/ui';
import { getQuote, updateQuoteStatus, acceptQuote, deleteQuote, getOrderForQuote } from '@/services/quotes';
import { getSettings } from '@/services/settings';
import { CURRENCY_FORMAT, QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '@/lib/constants';
import { waLink } from '@/lib/whatsapp';
import type { Order, Quote, Settings } from '@/types';

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('es-AR') : '—';
}

function whatsappText(quote: Quote, settings: Settings | null) {
  const lines = [
    `¡Hola${quote.client?.name ? ` ${quote.client.name}` : ''}! Te paso la cotización #${quote.number} de ${settings?.business_name ?? 'Vértice'}:`,
    '',
    ...quote.items.map(i => `• ${i.quantity} × ${i.description}: ${CURRENCY_FORMAT.format(i.price)}${i.quantity > 1 ? ` (${CURRENCY_FORMAT.format(i.price / i.quantity)} c/u)` : ''}`),
    '',
    `*Total: ${CURRENCY_FORMAT.format(quote.final_price)}*`,
  ];
  if (quote.valid_until) lines.push(`Válida hasta el ${formatDate(quote.valid_until)}.`);
  if (quote.notes) lines.push('', quote.notes);
  return lines.join('\n');
}

export function QuoteDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [q, s, o] = await Promise.all([getQuote(id), getSettings(), getOrderForQuote(id)]);
      setQuote(q);
      setSettings(s);
      setOrder(o);
    } catch (err) {
      console.error(err);
      setError('No se encontró la cotización.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String((err as { message?: string })?.message ?? err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!quote) return <p className="text-red-600">{error ?? 'No se encontró la cotización.'}</p>;

  const totalCost = quote.items.reduce((s, i) => s + Number(i.subtotal), 0);
  const waUrl = waLink(quote.client?.phone, whatsappText(quote, settings));

  function sendWhatsapp() {
    window.open(waUrl, '_blank', 'noopener');
    if (quote!.status === 'borrador') run(() => updateQuoteStatus(quote!.id, 'enviada'));
  }

  function handleDelete() {
    if (!window.confirm(`¿Eliminar la cotización #${quote!.number}? No se puede deshacer.`)) return;
    run(async () => {
      await deleteQuote(quote!.id);
      navigate('/admin/cotizaciones');
    });
  }

  return (
    <div className="space-y-6">
      {/* Barra de acciones (no se imprime) */}
      <div className="print:hidden flex flex-wrap items-center gap-2">
        <Link to="/admin/cotizaciones" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mr-auto">
          <ArrowLeft className="h-4 w-4" /> Cotizaciones
        </Link>
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimir / PDF
        </Button>
        <Button variant="secondary" size="sm" onClick={sendWhatsapp} disabled={busy}>
          <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
        </Button>
        {quote.status !== 'aceptada' && (
          <Button size="sm" onClick={() => run(() => acceptQuote(quote))} loading={busy}>
            <Check className="h-4 w-4" /> Aceptada → crear pedido
          </Button>
        )}
        {quote.status !== 'rechazada' && quote.status !== 'aceptada' && (
          <Button variant="ghost" size="sm" onClick={() => run(() => updateQuoteStatus(quote.id, 'rechazada'))} disabled={busy}>
            <X className="h-4 w-4" /> Rechazada
          </Button>
        )}
        {!order && (
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={busy} aria-label="Eliminar cotización">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && <p className="print:hidden text-sm text-red-600">{error}</p>}
      {order && (
        <div className="print:hidden flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <ClipboardList className="h-4 w-4" />
          Pedido creado el {formatDate(order.created_at)}.
          <Link to="/admin/pedidos" className="font-medium underline ml-1">Ver pedidos</Link>
        </div>
      )}

      {/* Documento para el cliente */}
      <Card className="print:border-0 print:shadow-none">
        <div className="flex flex-wrap justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <p className="text-2xl font-bold text-vertice-700">{settings?.business_name ?? 'Vértice'}</p>
            <p className="text-sm text-gray-500">Impresión 3D y grabado láser</p>
            {settings?.business_phone && <p className="text-sm text-gray-500">WhatsApp: {settings.business_phone}</p>}
            {settings?.business_instagram && <p className="text-sm text-gray-500">Instagram: {settings.business_instagram}</p>}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">Cotización #{quote.number}</p>
            <p className="text-sm text-gray-500">Fecha: {formatDate(quote.created_at)}</p>
            <p className="text-sm text-gray-500">Válida hasta: {formatDate(quote.valid_until)}</p>
            <Badge className={`print:hidden mt-2 ${QUOTE_STATUS_COLORS[quote.status] ?? ''}`}>
              {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
            </Badge>
          </div>
        </div>

        <div className="py-4">
          <p className="text-xs uppercase text-gray-500">Cliente</p>
          <p className="font-medium text-gray-900">{quote.client?.name ?? 'Consumidor final'}</p>
          {quote.client?.phone && <p className="text-sm text-gray-500">{quote.client.phone}</p>}
        </div>

        <table className="w-full text-sm">
          <thead className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
            <tr>
              <th className="py-2 pr-4">Descripción</th>
              <th className="py-2 pr-4 text-right">Cant.</th>
              <th className="py-2 pr-4 text-right">Precio unit.</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quote.items.map(i => (
              <tr key={i.id}>
                <td className="py-3 pr-4 text-gray-900">{i.description}</td>
                <td className="py-3 pr-4 text-right">{i.quantity}</td>
                <td className="py-3 pr-4 text-right">{CURRENCY_FORMAT.format(i.price / i.quantity)}</td>
                <td className="py-3 text-right font-medium">{CURRENCY_FORMAT.format(i.price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-900">
              <td className="pt-4 text-lg font-bold" colSpan={3}>Total</td>
              <td className="pt-4 text-right text-2xl font-bold text-vertice-700">{CURRENCY_FORMAT.format(quote.final_price)}</td>
            </tr>
          </tfoot>
        </table>

        {quote.notes && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-line">{quote.notes}</div>
        )}
      </Card>

      {/* Datos internos (no se imprimen) */}
      <Card className="print:hidden">
        <p className="text-sm font-semibold text-gray-900 mb-3">Interno — costos y ganancia</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th className="py-2 pr-4">Ítem</th>
                <th className="py-2 pr-4 text-right">Material</th>
                <th className="py-2 pr-4 text-right">Luz</th>
                <th className="py-2 pr-4 text-right">Desgaste</th>
                <th className="py-2 pr-4 text-right">Mano de obra</th>
                <th className="py-2 text-right">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quote.items.map(i => (
                <tr key={i.id}>
                  <td className="py-2 pr-4">{i.description}</td>
                  <td className="py-2 pr-4 text-right">{CURRENCY_FORMAT.format(i.material_cost)}</td>
                  <td className="py-2 pr-4 text-right">{CURRENCY_FORMAT.format(i.electricity_cost)}</td>
                  <td className="py-2 pr-4 text-right">{CURRENCY_FORMAT.format(i.machine_wear_cost)}</td>
                  <td className="py-2 pr-4 text-right">{CURRENCY_FORMAT.format(i.labor_cost)}</td>
                  <td className="py-2 text-right font-medium">{CURRENCY_FORMAT.format(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <span className="text-gray-600">Costo total: <strong>{CURRENCY_FORMAT.format(totalCost)}</strong></span>
          <span className="text-gray-600">Margen: <strong>{quote.margin_percent}%</strong></span>
          <span className="text-vertice-700">Ganancia: <strong>{CURRENCY_FORMAT.format(quote.final_price - totalCost)}</strong></span>
        </div>
      </Card>
    </div>
  );
}
