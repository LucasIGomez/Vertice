import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui';

const STATES = {
  aprobado: {
    icon: CheckCircle2,
    color: 'text-green-600',
    title: '¡Pago recibido!',
    text: 'Gracias. Ya registramos tu pago y te avisamos por WhatsApp cuando tu pedido avance.',
  },
  pendiente: {
    icon: Clock,
    color: 'text-yellow-600',
    title: 'Pago en proceso',
    text: 'Mercado Pago está procesando tu pago. Cuando se acredite lo vamos a ver automáticamente.',
  },
  rechazado: {
    icon: XCircle,
    color: 'text-red-600',
    title: 'El pago no se pudo completar',
    text: 'No se realizó ningún cobro. Podés volver a intentarlo con el mismo link o escribirnos por WhatsApp.',
  },
} as const;

/** Página a la que vuelve el cliente después de pagar en Mercado Pago. */
export function PaymentResultPage() {
  const [params] = useSearchParams();
  const key = (params.get('estado') ?? 'pendiente') as keyof typeof STATES;
  const s = STATES[key] ?? STATES.pendiente;
  const Icon = s.icon;

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <Card className="text-center py-10">
        <Icon className={`h-16 w-16 mx-auto mb-4 ${s.color}`} />
        <h1 className="text-2xl font-bold text-gray-900">{s.title}</h1>
        <p className="mt-3 text-gray-600">{s.text}</p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-vertice-700 hover:underline">
          Volver al inicio
        </Link>
      </Card>
    </div>
  );
}
