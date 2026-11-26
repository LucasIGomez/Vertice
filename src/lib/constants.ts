// ═══════════════════════════════════════════════
// Constantes del sistema
// ═══════════════════════════════════════════════

export const APP_NAME = 'Vértice';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  cotizando: 'Cotizando',
  esperando_confirmacion: 'Esperando confirmación',
  confirmado: 'Confirmado',
  en_produccion: 'En producción',
  listo: 'Listo para entrega',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  consulta: 'bg-gray-100 text-gray-700',
  cotizando: 'bg-blue-100 text-blue-700',
  esperando_confirmacion: 'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-green-100 text-green-700',
  en_produccion: 'bg-purple-100 text-purple-700',
  listo: 'bg-emerald-100 text-emerald-700',
  entregado: 'bg-gray-200 text-gray-500',
  cancelado: 'bg-red-100 text-red-700',
};

export const MATERIAL_TYPE_LABELS: Record<string, string> = {
  filamento: 'Filamento',
  resina: 'Resina',
  madera: 'Madera',
  acrilico: 'Acrílico',
  cuero: 'Cuero',
  mdf: 'MDF',
  otro: 'Otro',
};

export const MACHINE_TYPE_LABELS: Record<string, string> = {
  printer_fdm: 'Impresora FDM',
  printer_sla: 'Impresora SLA',
  laser: 'Grabadora Láser',
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  impresion_3d: 'Impresión 3D',
  grabado_laser: 'Grabado Láser',
};

// Categorías para cotización rápida con tiempos estimados (minutos)
export const QUICK_ESTIMATE_CATEGORIES: Record<string, { label: string; minutes: number; grams: number }> = {
  pequeno: { label: 'Pequeño (llavero, dado)', minutes: 30, grams: 15 },
  mediano: { label: 'Mediano (figura, soporte)', minutes: 120, grams: 80 },
  grande: { label: 'Grande (carcasa, maceta)', minutes: 360, grams: 250 },
  muy_grande: { label: 'Muy grande (escultura, pieza técnica)', minutes: 720, grams: 500 },
};

export const CURRENCY_FORMAT = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
