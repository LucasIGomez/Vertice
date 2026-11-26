import { Link } from 'react-router-dom';
import { Triangle, Printer, Scan, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-vertice-600 to-vertice-800 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Triangle className="h-10 w-10" fill="currentColor" />
              <h1 className="text-4xl sm:text-5xl font-bold">Vértice</h1>
            </div>
            <p className="text-xl sm:text-2xl text-vertice-100 mb-8">
              Impresión 3D y grabado láser a medida. Desde prototipos hasta producción.
            </p>
            <div className="flex gap-4">
              <Link to="/catalogo">
                <Button size="lg" className="bg-white text-vertice-700 hover:bg-vertice-50">
                  Ver catálogo <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Nuestros servicios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Printer className="h-12 w-12 text-vertice-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Impresión 3D</h3>
            <p className="text-gray-600">
              FDM con múltiples materiales y colores. Piezas funcionales, prototipos, figuras decorativas y más.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Scan className="h-12 w-12 text-vertice-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Grabado Láser</h3>
            <p className="text-gray-600">
              Personalización en madera, acrílico, cuero y MDF. Logos, regalos, señalética.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
