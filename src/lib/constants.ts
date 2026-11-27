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

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Sin pagar',
  parcial: 'Seña pagada',
  pagado: 'Pagado',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-gray-100 text-gray-600',
  parcial: 'bg-sky-100 text-sky-700',
  pagado: 'bg-green-100 text-green-700',
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  vencida: 'Vencida',
};

export const QUOTE_STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-700',
  enviada: 'bg-blue-100 text-blue-700',
  aceptada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
  vencida: 'bg-yellow-100 text-yellow-700',
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

// Categorías para cotización rápida (valores por unidad, editables después en el formulario).
// minutes = tiempo de máquina, labor = minutos de trabajo humano,
// material = gramos (filamento) o fracción de la unidad del material (ej. 0.25 pliego).
export interface QuickEstimateCategory {
  label: string;
  minutes: number;
  labor: number;
  material: number;
}

export const QUICK_ESTIMATE_CATEGORIES: Record<'impresion_3d' | 'grabado_laser', Record<string, QuickEstimateCategory>> = {
  impresion_3d: {
    pequeno: { label: 'Pequeño (llavero, dado)', minutes: 30, labor: 10, material: 15 },
    mediano: { label: 'Mediano (figura, soporte)', minutes: 120, labor: 20, material: 80 },
    grande: { label: 'Grande (carcasa, maceta)', minutes: 360, labor: 30, material: 250 },
    muy_grande: { label: 'Muy grande (escultura, pieza técnica)', minutes: 720, labor: 45, material: 500 },
  },
  grabado_laser: {
    pequeno: { label: 'Pequeño (llavero, grabado simple)', minutes: 5, labor: 10, material: 0.05 },
    mediano: { label: 'Mediano (cartel chico, caja)', minutes: 20, labor: 15, material: 0.25 },
    grande: { label: 'Grande (cartel, pieza compleja)', minutes: 60, labor: 30, material: 1 },
  },
};

export const CURRENCY_FORMAT = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
