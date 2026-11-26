import { Card, CardTitle } from '@/components/ui';
import { Printer, Scan } from 'lucide-react';

export function CatalogPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo</h1>
      <p className="text-gray-600 mb-8">Explorá nuestros servicios y pedí tu cotización.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="text-center py-8">
            <Printer className="h-16 w-16 text-vertice-600 mx-auto mb-4" />
            <CardTitle className="text-center">Impresión 3D</CardTitle>
            <p className="text-gray-500 mt-2">
              Piezas a medida en PLA, PETG, ABS y más.
            </p>
            <p className="mt-4 text-sm text-gray-400">
              Contactanos por WhatsApp para cotizar tu pieza.
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center py-8">
            <Scan className="h-16 w-16 text-vertice-600 mx-auto mb-4" />
            <CardTitle className="text-center">Grabado Láser</CardTitle>
            <p className="text-gray-500 mt-2">
              Personalización en madera, acrílico, cuero y MDF.
            </p>
            <p className="mt-4 text-sm text-gray-400">
              Contactanos por WhatsApp para cotizar tu diseño.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
