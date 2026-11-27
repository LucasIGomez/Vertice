import { useState } from 'react';
import { X, Copy, Check, MessageCircle, ExternalLink } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { createPaymentLink } from '@/services/integrations';
import { waLink } from '@/lib/whatsapp';
import { CURRENCY_FORMAT } from '@/lib/constants';
import type { Order } from '@/types';

interface Props {
  order: Order;
  businessName: string;
  onClose: () => void;
  onCreated: () => void;
}

/** Genera un link de pago de Mercado Pago (total, saldo o seña) y permite compartirlo. */
export function PaymentDialog({ order, businessName, onClose, onCreated }: Props) {
  const pending = Math.max(0, Number(order.total_price) - Number(order.payment_amount));
  const [amount, setAmount] = useState(String(Math.round(pending)));
  const [link, setLink] = useState<string | null>(null);
  const [charged, setCharged] = useState(0);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const r = await createPaymentLink(order.id, Number(amount));
      setLink(r.link);
      setCharged(r.amount);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const ref = order.quote?.number ? ` #${order.quote.number}` : '';
  const message = `¡Hola${order.client?.name ? ` ${order.client.name.split(' ')[0]}` : ''}! Te paso el link para pagar ${CURRENCY_FORMAT.format(charged)} de tu pedido${ref} en ${businessName} con Mercado Pago:\n${link}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cobrar con Mercado Pago</h2>
            <p className="text-sm text-gray-500">
              {order.client?.name ?? 'Sin cliente'} · Total {CURRENCY_FORMAT.format(order.total_price)}
              {order.payment_amount > 0 && ` · Cobrado ${CURRENCY_FORMAT.format(order.payment_amount)}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!link ? (
          <>
            <Input
              label="Monto a cobrar ($)"
              type="number"
              min={1}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              hint={`Saldo pendiente: ${CURRENCY_FORMAT.format(pending)}`}
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setAmount(String(Math.round(pending / 2)))}>Seña 50%</Button>
              <Button variant="secondary" size="sm" onClick={() => setAmount(String(Math.round(pending)))}>Saldo total</Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" onClick={generate} loading={busy} disabled={!(Number(amount) > 0)}>
              Generar link de pago
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-700">
              Link por <strong>{CURRENCY_FORMAT.format(charged)}</strong> listo. Cuando el cliente pague,
              el pedido se actualiza solo.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="flex-1 truncate text-xs text-gray-600">{link}</span>
              <button onClick={copy} className="text-gray-500 hover:text-gray-800" aria-label="Copiar link">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
              <a href={link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-800" aria-label="Abrir link">
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <Button className="w-full" onClick={() => window.open(waLink(order.client?.phone, message), '_blank', 'noopener')}>
              <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
