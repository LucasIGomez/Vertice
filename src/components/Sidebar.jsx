import React from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  Layers, 
  ClipboardList, 
  Image, 
  Database,
  Menu,
  X
} from 'lucide-react';
import { isSupabaseConfigured } from '../supabase';

export default function Sidebar({ activePage, setActivePage }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', label: 'Cotizador', icon: Calculator },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList },
    { id: 'inventory', label: 'Inventario', icon: Layers },
    { id: 'vectorizer', label: 'Vectorizador', icon: Image },
  ];

  return (
    <>
      {/* Botón para Móviles */}
      <button 
        className="mobile-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.5rem',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer'
        }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <style>{`
        @media (max-width: 768px) {
          .mobile-toggle-btn { display: block !important; }
          .sidebar {
            transform: translateX(${isOpen ? '0' : '-100%'});
            transition: transform 0.3s ease-in-out;
            position: fixed !important;
            height: 100vh;
            width: 260px;
          }
        }
      `}</style>

      <div className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #9333ea 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '1.25rem',
            color: '#fff',
            boxShadow: '0 4px 10px rgba(147, 51, 234, 0.3)'
          }}>
            V
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', tracking: '-0.03em' }}>VÉRTICE</h2>
            <p style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estudio de Diseño</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: isActive ? 'rgba(147, 51, 234, 0.12)' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.95rem',
                  borderLeft: isActive ? '3px solid hsl(var(--primary))' : '3px solid transparent',
                  borderTopLeftRadius: isActive ? '0' : '10px',
                  borderBottomLeftRadius: isActive ? '0' : '10px',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))' }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Indicador de conexión */}
        <div style={{
          marginTop: 'auto',
          padding: '0.85rem',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem'
        }}>
          <Database size={14} style={{ color: isSupabaseConfigured ? 'hsl(var(--success))' : 'hsl(var(--warning))' }} />
          <div>
            <p style={{ fontWeight: '600', color: 'hsl(var(--text-primary))' }}>
              {isSupabaseConfigured ? 'Base de Datos Activa' : 'Base de Datos Local'}
            </p>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.65rem' }}>
              {isSupabaseConfigured ? 'Supabase Cloud (Postgres)' : 'LocalStorage (Fácil Migración)'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
