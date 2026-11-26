import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Admin pages
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { CalculatorPage } from '@/pages/admin/CalculatorPage';
import { QuotesPage } from '@/pages/admin/QuotesPage';
import { OrdersPage } from '@/pages/admin/OrdersPage';
import { InventoryPage } from '@/pages/admin/InventoryPage';
import { MachinesPage } from '@/pages/admin/MachinesPage';
import { ClientsPage } from '@/pages/admin/ClientsPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';

// Public pages
import { HomePage } from '@/pages/public/HomePage';
import { CatalogPage } from '@/pages/public/CatalogPage';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="catalogo" element={<CatalogPage />} />
        </Route>

        {/* Login */}
        <Route path="login" element={<LoginPage />} />

        {/* Panel de administración (protegido) */}
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="cotizador" element={<CalculatorPage />} />
          <Route path="cotizaciones" element={<QuotesPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="inventario" element={<InventoryPage />} />
          <Route path="maquinas" element={<MachinesPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
