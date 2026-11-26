import React, { useEffect, useState } from 'react';
import { db } from '../supabase';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle2, 
  ShoppingCart,
  Mail,
  ArrowUpRight
} from 'lucide-react';

export default function Dashboard({ setActivePage }) {
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [emailAlerts, setEmailAlerts] = useState([]);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allOrders = await db.orders.getAll();
      const allMaterials = await db.materials.getAll();
      
      setOrders(allOrders);
      setMaterials(allMaterials);

      // Calcular cantidad de items con stock bajo
      const lowStock = allMaterials.filter(m => m.stock_qty <= m.stock_min);
      setLowStockCount(lowStock.length);

      // Cargar alertas de email simuladas
      const alerts = JSON.parse(localStorage.getItem('vt_email_alerts') || '[]');
      setEmailAlerts(alerts.slice(-5).reverse()); // últimas 5 alertas
    } catch (e) {
      console.error("Error al cargar datos en Dashboard", e);
    }
  };

  // Calcular estadísticas básicas
  const totalRevenue = orders
    .filter(o => o.status !== 'Consulta')
    .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

  const pendingOrders = orders.filter(o => !['Entregado', 'Listo para entrega'].includes(o.status)).length;
  
  // Calcular margen de ganancia promedio
  const ordersWithBreakdown = orders.filter(o => o.cost_breakdown);
  const averageMargin = ordersWithBreakdown.length > 0
    ? (ordersWithBreakdown.reduce((sum, o) => sum + (Number(o.cost_breakdown.margin) || 0), 0) / ordersWithBreakdown.length).toFixed(0)
    : '120';

  // Productos más populares (simulado a partir de las descripciones y tipos de pedidos)
  const popularProducts = [
    { name: 'Etiquetas de cuerina', orders: 15, avgPrice: 12000, margin: '150%' },
    { name: 'Cajas MDF grabadas', orders: 12, avgPrice: 8500, margin: '125%' },
    { name: 'Llaveros impresión 3D', orders: 8, avgPrice: 3500, margin: '140%' },
    { name: 'Tablas de asado grabadas', orders: 6, avgPrice: 18500, margin: '95%' }
  ];

  return (
    <div className="fade-in">
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }} className="gradient-text">
            Panel de Control
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
            Resumen operativo y financiero de Vértice.
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          Actualizado: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Grid de Tarjetas Estadísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Tarjeta 1 */}
        <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>INGRESOS TOTALES</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>${totalRevenue.toLocaleString()}</h3>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.5rem', borderRadius: '10px' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={14} /> Activos + Concretados
          </p>
        </div>

        {/* Tarjeta 2 */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>PEDIDOS ACTIVOS</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>{pendingOrders}</h3>
            </div>
            <div style={{ background: 'rgba(147, 51, 234, 0.1)', color: 'hsl(var(--primary))', padding: '0.5rem', borderRadius: '10px' }}>
              <ShoppingCart size={20} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }} onClick={() => setActivePage('orders')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'hsl(var(--primary))' }}>
            Ver tablero Kanban <ArrowUpRight size={12} />
          </p>
        </div>

        {/* Tarjeta 3 */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>STOCK EN ALERTA</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem', color: lowStockCount > 0 ? 'hsl(var(--warning))' : 'inherit' }}>
                {lowStockCount}
              </h3>
            </div>
            <div style={{ 
              background: lowStockCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
              color: lowStockCount > 0 ? '#f59e0b' : 'hsl(var(--text-muted))', 
              padding: '0.5rem', 
              borderRadius: '10px' 
            }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }} onClick={() => setActivePage('inventory')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b' }}>
            {lowStockCount > 0 ? 'Reponer stock inmediatamente' : 'Todos los niveles normales'} <ArrowUpRight size={12} />
          </p>
        </div>

        {/* Tarjeta 4 */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: '600' }}>MARGEN PROM. SUGERIDO</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '0.25rem' }}>{averageMargin}%</h3>
            </div>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', padding: '0.5rem', borderRadius: '10px' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))' }}>
            Multiplicador base: x{((Number(averageMargin) / 100) + 1).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Fila de Contenido Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Lado Izquierdo: Alertas de Correo y Pedidos Recientes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Historial de Emails Enviados */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={18} style={{ color: 'hsl(var(--primary))' }} />
              Alertas Automáticas de Stock (Enviadas a Gmail)
            </h3>
            
            {emailAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'hsl(var(--text-muted))' }}>
                <CheckCircle2 size={36} style={{ color: 'hsl(var(--success))', marginBottom: '0.5rem', opacity: 0.7 }} />
                <p>No se enviaron alertas recientes.</p>
                <p style={{ fontSize: '0.75rem' }}>Las alertas automáticas se enviarán a <b>verticegrabado@gmail.com</b> cuando el stock baje del mínimo.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {emailAlerts.map((alert) => (
                  <div key={alert.id} style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '700', color: 'hsl(var(--warning))' }}>{alert.subject}</span>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '0.5rem' }}>Enviado a: <b>{alert.to}</b></p>
                    <pre style={{ 
                      fontFamily: 'monospace', 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '0.5rem', 
                      borderRadius: '6px', 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.75rem',
                      color: 'hsl(var(--text-secondary))'
                    }}>{alert.body}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Últimos Pedidos */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Pedidos Recientes</h3>
            {orders.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '2rem' }}>No hay pedidos registrados.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'hsl(var(--text-muted))' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>ID</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Cliente</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Tipo</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Estado</th>
                      <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>{order.id}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div>{order.client_name}</div>
                          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{order.client_phone}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span className={`badge ${order.type === '3d' ? 'badge-info' : 'badge-primary'}`}>
                            {order.type === '3d' ? 'Impresión 3D' : 'Láser'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span className={`badge ${
                            order.status === 'Entregado' ? 'badge-success' :
                            order.status === 'Imprimiendo/Cortando' ? 'badge-info' :
                            order.status === 'En espera de confirmación' ? 'badge-warning' : 'badge-primary'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '700' }}>
                          ${order.total_price.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Análisis de Margen y Popularidad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Productos Populares vs Rentables */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Análisis de Portafolio</h3>
            <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '1.25rem' }}>
              Optimización de ventas e inventario fluido.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {popularProducts.map((p, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.name}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                      Margen: {p.margin}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                    <span>Pedidos: <b>{p.orders} veces</b></span>
                    <span>Precio Prom: <b>${p.avgPrice.toLocaleString()}</b></span>
                  </div>
                  {/* Barra de popularidad */}
                  <div style={{ 
                    height: '6px', 
                    width: '100%', 
                    background: 'rgba(255,255,255,0.05)', 
                    borderRadius: '3px',
                    marginTop: '0.5rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${(p.orders / 15) * 100}%`, 
                      background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ 
              marginTop: '1.25rem', 
              padding: '0.85rem', 
              background: 'rgba(147, 51, 234, 0.05)', 
              border: '1px solid rgba(147, 51, 234, 0.15)',
              borderRadius: '10px',
              fontSize: '0.75rem',
              color: 'hsl(var(--text-secondary))'
            }}>
              💡 <b>Tip de Ventas:</b> Las <i>etiquetas de cuerina</i> tienen el mayor margen ({popularProducts[0].margin}) y una demanda fluida. Se recomienda promocionarlas en redes para maximizar ganancias.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
