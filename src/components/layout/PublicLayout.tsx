import { Outlet, Link } from 'react-router-dom';
import { Triangle } from 'lucide-react';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header público */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Triangle className="h-6 w-6 text-vertice-600" fill="currentColor" />
            <span className="text-xl font-bold text-gray-900">Vértice</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/catalogo" className="text-sm text-gray-600 hover:text-gray-900">
              Catálogo
            </Link>
            <Link to="/login" className="text-sm text-vertice-600 hover:text-vertice-700 font-medium">
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Vértice — Impresión 3D y Grabado Láser
        </div>
      </footer>
    </div>
  );
}
