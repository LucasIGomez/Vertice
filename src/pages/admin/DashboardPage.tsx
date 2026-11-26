import { useEffect, useState } from 'react';
import {
  DollarSign,
  ClipboardList,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardTitle, PageLoader } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { CURRENCY_FORMAT, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';
import { Badge } from '@/components/ui';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  monthRevenue: number;
  lowStockCount: number;
  recentOrders: Array<{
    id: string;
    status: string;
    client_name: string | null;
    created_at: string;
    total: number;
  }>;
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Pedidos activos
        const { data: orders } = await supabase
          .from('orders')
          .select('id, status, payment_amount, created_at, client:clients(name)')
          .order('created_at', { ascending: false });

        // Materiales con bajo stock
        const { count: lowStock } = await supabase
          .from('materials')
          .select('*', { count: 'exact', head: true })
          .lte('stock_quantity', 0); // se compara con stock_min_alert en RPC

        const allOrders = orders ?? [];
        const active = allOrders.filter(o =>
          !['entregado', 'cancelado'].includes(o.status)
        );

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthRevenue = allOrders
          .filter(o => o.status === 'entregado' && o.created_at >= monthStart)
          .reduce((sum, o) => sum + (o.payment_amount ?? 0), 0);

        setStats({
          totalOrders: allOrders.length,
          activeOrders: active.length,
          monthRevenue,
          lowStockCount: lowStock ?? 0,
          recentOrders: allOrders.slice(0, 5).map(o => ({
            id: o.id,
            status: o.status,
            client_name: (o.client as { name: string } | null)?.name ?? 'Sin cliente',
            created_at: o.created_at,
            total: o.payment_amount ?? 0,
          })),
        });
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) return <PageLoader />;

  const statCards = [
    {
      label: 'Ingresos del mes',
      value: CURRENCY_FORMAT.format(stats?.monthRevenue ?? 0),
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Pedidos activos',
      value: stats?.activeOrders ?? 0,
      icon: ClipboardList,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Total pedidos',
      value: stats?.totalOrders ?? 0,
      icon: Package,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Stock bajo',
      value: stats?.lowStockCount ?? 0,
      icon: AlertTriangle,
      color: stats?.lowStockCount ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pedidos recientes */}
      <Card>
        <CardTitle>Pedidos recientes</CardTitle>
        <div className="mt-4 divide-y divide-gray-100">
          {stats?.recentOrders.map(order => (
            <div key={order.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{order.client_name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={ORDER_STATUS_COLORS[order.status] ?? ''}>
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </Badge>
                <span className="text-sm font-medium text-gray-900">
                  {CURRENCY_FORMAT.format(order.total)}
                </span>
              </div>
            </div>
          ))}
          {!stats?.recentOrders.length && (
            <p className="py-4 text-sm text-gray-500 text-center">No hay pedidos todavía</p>
          )}
        </div>
      </Card>
    </div>
  );
}
