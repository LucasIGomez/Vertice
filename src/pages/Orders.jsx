import React, { useEffect, useState } from 'react';
import { db } from '../supabase';
import { 
  MessageSquare, 
  CreditCard, 
  Check, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';

const STATUS_COLUMNS = [
  'Consulta',
  'Diseñando',
  'En espera de confirmación',
  'Confirmado',
  'Imprimiendo/Cortando',
  'Listo para entrega',
  'Entregado'
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [editingProgressId, setEditingProgressId] = useState(null);
  const [tempProgress, setTempProgress] = useState(0);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await db.orders.getAll();
      setOrders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      const updated = { ...order, status: newStatus };
      
      // Ajustar progreso según el estado automáticamente
      if (newStatus === 'Consulta') updated.progress = 10;
      else if (newStatus === 'Diseñando') updated.progress = 30;
      else if (newStatus === 'En espera de confirmación') updated.progress = 50;
      else if (newStatus === 'Confirmado') updated.progress = 60;
      else if (newStatus === 'Imprimiendo/Cortando') updated.progress = 80;
      else if (newStatus === 'Listo para entrega') updated.progress = 95;
      else if (newStatus === 'Entregado') {
        updated.progress = 100;
        updated.payment_status = 'paid'; // Se asume pago si está entregado
      }

      await db.orders.save(updated);
      
      // Notificación de producción si pasa a "Imprimiendo/Cortando"
      if (newStatus === 'Imprimiendo/Cortando') {
        triggerStatusNotification(updated, '¡Comenzamos la producción!');
      }

      loadOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleProgressSave = async (order) => {
    try {
      const updated = { ...order, progress: Number(tempProgress) };
      if (Number(tempProgress) === 100) {
        updated.status = 'Entregado';
        updated.payment_status = 'paid';
      }
      await db.orders.save(updated);
      setEditingProgressId(null);
      loadOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Desea eliminar permanentemente este pedido?')) {
      try {
        await db.orders.delete(id);
        loadOrders();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // --- Integración Simulada de Mercado Pago ---
  const handleGeneratePaymentLink = async (order) => {
    try {
      const mockLink = `https://link.mercadopago.com.ar/vertice-mock-pay-${order.id}`;
      const updated = { ...order, payment_link: mockLink };
      await db.orders.save(updated);
      loadOrders();
      alert(`Link de Mercado Pago generado para ${order.client_name}:\n${mockLink}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulatePaymentWebhook = async (order) => {
    try {
      // Simula la llamada del Webhook/IPN de Mercado Pago
      const updated = { 
        ...order, 
        payment_status: 'paid',
        status: 'Confirmado', // Pasa de esperando confirmación a confirmado automáticamente
        progress: 60
      };
      await db.orders.save(updated);
      loadOrders();
      alert(`¡WEBHOOK RECIBIDO! Mercado Pago confirmó el pago de ${order.client_name}. El pedido pasó automáticamente a "Confirmado".`);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Envío de Avisos por WhatsApp ---
  const handleSendWhatsAppUpdate = (order) => {
    let message = '';
    
    if (order.status === 'Imprimiendo/Cortando') {
      message = `Hola ${order.client_name}! Te escribimos de Vértice Grabados y 3D para contarte que ya iniciamos la producción de tu pedido: "${order.description}". ¡Te avisaremos cuando esté listo!`;
    } else {
      message = `Hola ${order.client_name}! Te queríamos actualizar sobre el estado de tu pedido "${order.description}". Actualmente se encuentra en la etapa de *${order.status}* con un avance del *${order.progress}%*. ¡Cualquier duda nos consultás!`;
    }

    const cleanPhone = order.client_phone.replace(/[^0-9+]/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const triggerStatusNotification = (order, reason) => {
    console.log(`📱 NOTIFICACIÓN CLIENTE: (${order.client_name}) - ${reason}`);
  };

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }} className="gradient-text">
            Flujo de Contratación (Tablero Kanban)
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
            Gestioná y actualizá los pedidos en tiempo real. Hacé clic en las flechas o cambiá el estado directamente.
          </p>
        </div>
      </div>

      {/* Tablero Kanban */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        overflowX: 'auto',
        paddingBottom: '1.5rem',
        minHeight: '70vh',
        alignItems: 'flex-start'
      }}>
        {STATUS_COLUMNS.map((column) => {
          const columnOrders = orders.filter(o => o.status === column);
          return (
            <div 
              key={column} 
              style={{
                width: '320px',
                minWidth: '320px',
                background: 'rgba(30, 41, 59, 0.25)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              {/* Cabecera Columna */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'hsl(var(--text-primary))' }}>{column}</h4>
                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{columnOrders.length}</span>
              </div>

              {/* Lista de Pedidos en Columna */}
              {columnOrders.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem 1rem', 
                  color: 'hsl(var(--text-muted))', 
                  fontSize: '0.8rem',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '10px'
                }}>
                  Sin pedidos
                </div>
              ) : (
                columnOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '1rem', 
                      background: 'rgba(30, 41, 59, 0.5)',
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.75rem' 
                    }}
                  >
                    {/* ID y Tipo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'hsl(var(--secondary))' }}>{order.id}</span>
                      <span className={`badge ${order.type === '3d' ? 'badge-info' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>
                        {order.type === '3d' ? '3D' : 'Láser'}
                      </span>
                    </div>

                    {/* Cliente */}
                    <div>
                      <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>{order.client_name}</h5>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{order.client_phone}</span>
                    </div>

                    {/* Descripción */}
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.3' }}>
                      {order.description}
                    </p>

                    {/* Barra de Progreso */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Avance</span>
                        <span style={{ fontWeight: '700', color: 'hsl(var(--secondary))' }}>{order.progress}%</span>
                      </div>
                      
                      {editingProgressId === order.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            style={{ flex: 1 }}
                            value={tempProgress} 
                            onChange={(e) => setTempProgress(e.target.value)} 
                          />
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleProgressSave(order)}
                          >
                            Ok
                          </button>
                        </div>
                      ) : (
                        <div 
                          style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', cursor: 'pointer' }}
                          onClick={() => {
                            setEditingProgressId(order.id);
                            setTempProgress(order.progress);
                          }}
                          title="Haga clic para editar progreso"
                        >
                          <div style={{ height: '100%', width: `${order.progress}%`, background: 'linear-gradient(90deg, #9333ea 0%, #06b6d4 100%)', borderRadius: '3px' }} />
                        </div>
                      )}
                    </div>

                    {/* Pago y Mercado Pago */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Pago:</span>
                      <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                        {order.payment_status === 'paid' ? 'Cobrado' : 'Pendiente'}
                      </span>
                    </div>

                    {/* Botones Especiales de Mercado Pago */}
                    {order.status === 'En espera de confirmación' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {!order.payment_link ? (
                          <button 
                            className="btn btn-secondary" 
                            style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }}
                            onClick={() => handleGeneratePaymentLink(order)}
                          >
                            <CreditCard size={12} /> Generar Link MP
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <a 
                              href={order.payment_link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-secondary" 
                              style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', textDecoration: 'none', display: 'inline-flex', justifyContent: 'center' }}
                            >
                              Link MP <ExternalLink size={10} style={{ marginLeft: '2px' }} />
                            </a>
                            <button 
                              className="btn btn-primary" 
                              style={{ flex: 1, fontSize: '0.7rem', padding: '0.4rem', background: '#16a34a' }}
                              onClick={() => handleSimulatePaymentWebhook(order)}
                            >
                              Simular Webhook
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Acciones de Pedido */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', borderRadius: '6px' }}
                          title="Actualizar cliente por WhatsApp"
                          onClick={() => handleSendWhatsAppUpdate(order)}
                        >
                          <MessageSquare size={14} style={{ color: '#25D366' }} />
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '0.4rem', borderRadius: '6px' }}
                          onClick={() => handleDelete(order.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {/* Controles de Kanban manual */}
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {STATUS_COLUMNS.indexOf(order.status) > 0 && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            onClick={() => handleStatusChange(order, STATUS_COLUMNS[STATUS_COLUMNS.indexOf(order.status) - 1])}
                          >
                            <ArrowLeft size={12} />
                          </button>
                        )}
                        {STATUS_COLUMNS.indexOf(order.status) < STATUS_COLUMNS.length - 1 && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            onClick={() => handleStatusChange(order, STATUS_COLUMNS[STATUS_COLUMNS.indexOf(order.status) + 1])}
                          >
                            <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
