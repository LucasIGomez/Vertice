// ═══════════════════════════════════════════════
// Vértice — Tipos de Base de Datos
// ═══════════════════════════════════════════════

// ── Enums ──────────────────────────────────────

export type MaterialType = 'filamento' | 'resina' | 'madera' | 'acrilico' | 'cuero' | 'mdf' | 'otro';

export type OrderStatus =
  | 'consulta'
  | 'cotizando'
  | 'esperando_confirmacion'
  | 'confirmado'
  | 'en_produccion'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export type QuoteStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida';

export type MachineType = 'printer_fdm' | 'printer_sla' | 'laser';

export type ServiceType = 'impresion_3d' | 'grabado_laser';

// ── Tablas ─────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  color: string | null;
  brand: string | null;
  unit_cost: number;       // costo por unidad (ej: por kg, por metro)
  unit_label: string;      // 'kg', 'ml', 'metro', 'pliego'
  stock_quantity: number;
  stock_min_alert: number;
  supplier: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  brand: string | null;
  model: string | null;
  purchase_cost: number;
  lifespan_hours: number;      // vida útil estimada en horas
  wattage: number;             // consumo en watts
  maintenance_cost_monthly: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: number;                  // siempre 1
  electricity_cost_kwh: number;
  labor_cost_hour: number;
  default_margin_percent: number;
  currency: string;
  business_name: string;
  business_phone: string | null;
  business_instagram: string | null;
  mercadopago_enabled: boolean;
  whatsapp_enabled: boolean;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  service_type: ServiceType;
  description: string;
  quantity: number;
  // Parámetros de cálculo
  material_id: string | null;
  machine_id: string | null;
  estimated_time_minutes: number;  // tiempo estimado (cotización rápida)
  exact_time_minutes: number | null; // tiempo exacto (post-slicer)
  material_grams: number | null;
  // Costos desglosados
  material_cost: number;
  electricity_cost: number;
  machine_wear_cost: number;
  labor_cost: number;
  subtotal: number;
  created_at: string;
}

export interface Quote {
  id: string;
  client_id: string | null;
  status: QuoteStatus;
  items: QuoteItem[];         // join virtual
  total: number;
  margin_percent: number;
  final_price: number;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  client?: Client;
}

export interface Order {
  id: string;
  quote_id: string | null;
  client_id: string | null;
  status: OrderStatus;
  priority: number;           // 1=urgente, 2=normal, 3=baja
  assigned_machine_id: string | null;
  payment_status: 'pendiente' | 'parcial' | 'pagado';
  payment_amount: number;
  payment_link: string | null;
  delivery_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  client?: Client;
  quote?: Quote;
  machine?: Machine;
}

// ── Tipos auxiliares ───────────────────────────

export interface CostBreakdown {
  material: number;
  electricity: number;
  machine_wear: number;
  labor: number;
  subtotal: number;
  margin_percent: number;
  margin_amount: number;
  total: number;
}

export interface QuickEstimateParams {
  service_type: ServiceType;
  category: string;         // 'pequeño', 'mediano', 'grande', 'personalizado'
  material_id: string;
  machine_id: string;
  quantity: number;
}

export interface ExactCostParams {
  service_type: ServiceType;
  material_id: string;
  machine_id: string;
  time_minutes: number;
  material_grams: number;
  quantity: number;
  margin_percent: number;
}
