import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { Card, Badge, EmptyState, PageLoader } from '@/components/ui';
import { getOrders, updateOrderStatus } from '@/services/orders';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, CURRENCY_FORMAT } from '@/lib/constants';
import type { Order, OrderStatus } from '@/types';

const KANBAN_COLUMNS: OrderStatus[] = [
  'consulta', 'cotizando', 'esperando_confirmacion',
  'confirmado', 'en_produccion', 'listo', 'entregado',
];

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setOrders(await getOrders());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function moveOrder(orderId: string, newStatus: OrderStatus) {
    try {
      await updateOrderStatus(orderId, newStatus);
      await load();
    } catch (err) { console.error(err); }
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
      <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(status => {
          const columnOrders = orders.filter(o => o.status === status);
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
                  <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {order.client?.name ?? 'Sin cliente'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-vertice-600">
                        {CURRENCY_FORMAT.format(order.total_price)}
                      </p>
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
                      {/* Avanzar / retroceder */}
                      <div className="flex gap-1 pt-1">
                        {KANBAN_COLUMNS.indexOf(status) > 0 && (
                          <button
                            onClick={() => moveOrder(order.id, KANBAN_COLUMNS[KANBAN_COLUMNS.indexOf(status) - 1]!)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            ← Anterior
                          </button>
                        )}
                        {KANBAN_COLUMNS.indexOf(status) < KANBAN_COLUMNS.length - 1 && (
                          <button
                            onClick={() => moveOrder(order.id, KANBAN_COLUMNS[KANBAN_COLUMNS.indexOf(status) + 1]!)}
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
    </div>
  );
}
