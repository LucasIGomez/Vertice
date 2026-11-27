import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, CreditCard } from 'lucide-react';
import { Card, Badge, EmptyState, PageLoader } from '@/components/ui';
import { PaymentDialog } from '@/components/orders/PaymentDialog';
import { getOrders, updateOrderStatus } from '@/services/orders';
import { getSettings } from '@/services/settings';
import { notifyOrderWhatsapp, NOTIFIED_STATUSES } from '@/services/integrations';
import {
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, CURRENCY_FORMAT,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
} from '@/lib/constants';
import type { Order, OrderStatus, Settings } from '@/types';

const KANBAN_COLUMNS: OrderStatus[] = [
  'consulta', 'cotizando', 'esperando_confirmacion',
  'confirmado', 'en_produccion', 'listo', 'entregado',
];

type Flash = { kind: 'ok' | 'warn'; text: string } | null;

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<Order | null>(null);
  const [flash, setFlash] = useState<Flash>(null);

  const load = useCallback(async () => {
    try {
      setOrders(await getOrders());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    getSettings().then(setSettings).catch(console.error);
  }, [load]);

  function showFlash(f: Flash) {
    setFlash(f);
    setTimeout(() => setFlash(null), 5000);
  }

  async function moveOrder(order: Order, newStatus: OrderStatus) {
    try {
      await updateOrderStatus(order.id, newStatus);
      await load();
    } catch (err) {
      console.error(err);
      return;
    }

    // Aviso automático al cliente por WhatsApp (no bloquea el tablero)
    if (settings?.whatsapp_enabled && NOTIFIED_STATUSES.includes(newStatus)) {
      try {
        const r = await notifyOrderWhatsapp(order.id, newStatus);
        if (r.status === 'sent') showFlash({ kind: 'ok', text: `WhatsApp enviado a ${order.client?.name ?? 'el cliente'}.` });
        else showFlash({ kind: 'warn', text: `No se envió el WhatsApp: ${r.error ?? r.status}` });
      } catch (err) {
        showFlash({ kind: 'warn', text: `No se envió el WhatsApp: ${err instanceof Error ? err.message : String(err)}` });
      }
    }
  }

  if (loading) return <PageLoader />;

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <EmptyState
          icon={<ClipboardList className="h-12 w-12" />}
          title="Sin pedidos"
          description="Los pedidos se crean cuando un cliente confirma una cotización."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 mr-auto">Pedidos</h1>
        {settings && (
          <span className="text-xs text-gray-500">
            Avisos por WhatsApp: {settings.whatsapp_enabled ? 'activados' : 'desactivados'}
          </span>
        )}
      </div>

      {flash && (
        <div className={`rounded-lg border px-4 py-2 text-sm ${flash.kind === 'ok'
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-yellow-200 bg-yellow-50 text-yellow-800'}`}>
          {flash.text}
        </div>
      )}

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(status => {
          const columnOrders = orders.filter(o => o.status === status);
          const idx = KANBAN_COLUMNS.indexOf(status);
          return (
            <div key={status} className="flex-shrink-0 w-72">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={ORDER_STATUS_COLORS[status]}>
                  {ORDER_STATUS_LABELS[status]}
                </Badge>
                <span className="text-xs text-gray-400">{columnOrders.length}</span>
              </div>
              <div className="space-y-3">
                {columnOrders.map(order => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {order.client?.name ?? 'Sin cliente'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-lg font-bold text-vertice-600">
                          {CURRENCY_FORMAT.format(order.total_price)}
                        </p>
                        <Badge className={PAYMENT_STATUS_COLORS[order.payment_status]}>
                          {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                        </Badge>
                      </div>
                      {order.quote && (
                        <Link to={`/admin/cotizaciones/${order.quote.id}`} className="block text-xs text-gray-500 hover:text-vertice-700">
                          Cotización #{order.quote.number}
                        </Link>
                      )}
                      {order.payment_amount > 0 && (
                        <p className="text-xs text-gray-500">Cobrado: {CURRENCY_FORMAT.format(order.payment_amount)}</p>
                      )}
                      {order.notes && (
                        <p className="text-xs text-gray-500 line-clamp-2">{order.notes}</p>
                      )}
                      {order.payment_status !== 'pagado' && order.total_price > 0 && (
                        <button
                          onClick={() => setPaying(order)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-900"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Cobrar con Mercado Pago
                        </button>
                      )}
                      {/* Avanzar / retroceder */}
                      <div className="flex gap-1 pt-1">
                        {idx > 0 && (
                          <button
                            onClick={() => moveOrder(order, KANBAN_COLUMNS[idx - 1]!)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            ← Anterior
                          </button>
                        )}
                        {idx < KANBAN_COLUMNS.length - 1 && (
                          <button
                            onClick={() => moveOrder(order, KANBAN_COLUMNS[idx + 1]!)}
                            className="text-xs text-vertice-600 hover:text-vertice-700 ml-auto"
                          >
                            Siguiente →
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {paying && (
        <PaymentDialog
          order={paying}
          businessName={settings?.business_name ?? 'Vértice'}
          onClose={() => setPaying(null)}
          onCreated={load}
        />
      )}
    </div>
  );
}
