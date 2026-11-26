import type { CostBreakdown, Material, Machine, Settings, ExactCostParams } from '@/types';
import { QUICK_ESTIMATE_CATEGORIES } from '@/lib/constants';

/**
 * Calcula el desgaste de máquina por hora.
 * Fórmula Keitron: (costo_compra × 1.2 + mantenimiento_mensual × meses_vida) / vida_horas
 */
function machineWearPerHour(machine: Machine): number {
  const monthsLife = machine.lifespan_hours / (8 * 22); // 8h/día, 22 días/mes
  const totalCost = machine.purchase_cost * 1.2 + machine.maintenance_cost_monthly * monthsLife;
  return totalCost / machine.lifespan_hours;
}

/**
 * Costo de electricidad por hora.
 */
function electricityCostPerHour(machine: Machine, settings: Settings): number {
  return (machine.wattage / 1000) * settings.electricity_cost_kwh;
}

/**
 * Cotización rápida: estima costos basándose en categoría de tamaño.
 */
export function quickEstimate(
  category: string,
  material: Material,
  machine: Machine,
  settings: Settings,
  quantity: number = 1,
  marginPercent?: number,
): CostBreakdown {
  const cat = QUICK_ESTIMATE_CATEGORIES[category];
  if (!cat) throw new Error(`Categoría desconocida: ${category}`);

  return calculateCost({
    service_type: machine.type === 'laser' ? 'grabado_laser' : 'impresion_3d',
    material_id: material.id,
    machine_id: machine.id,
    time_minutes: cat.minutes,
    material_grams: cat.grams,
    quantity,
    margin_percent: marginPercent ?? settings.default_margin_percent,
  }, material, machine, settings);
}

/**
 * Cotización exacta: usa datos del slicer o medición real.
 */
export function calculateCost(
  params: ExactCostParams,
  material: Material,
  machine: Machine,
  settings: Settings,
): CostBreakdown {
  const hours = params.time_minutes / 60;

  // Costo de material: gramos × (costo_unitario / 1000)
  // unit_cost está en $/kg para filamento, $/litro para resina, etc.
  const materialCost = params.material_grams
    ? params.material_grams * (material.unit_cost / 1000)
    : 0;

  // Costo de electricidad
  const electricityCost = hours * electricityCostPerHour(machine, settings);

  // Desgaste de máquina
  const machineWearCost = hours * machineWearPerHour(machine);

  // Mano de obra (incluye tiempo de diseño/setup proporcional)
  const laborCost = hours * settings.labor_cost_hour;

  // Subtotal por unidad
  const subtotalUnit = materialCost + electricityCost + machineWearCost + laborCost;

  // Subtotal total
  const subtotal = subtotalUnit * params.quantity;

  // Margen
  const marginAmount = subtotal * (params.margin_percent / 100);

  return {
    material: materialCost * params.quantity,
    electricity: electricityCost * params.quantity,
    machine_wear: machineWearCost * params.quantity,
    labor: laborCost * params.quantity,
    subtotal,
    margin_percent: params.margin_percent,
    margin_amount: marginAmount,
    total: subtotal + marginAmount,
  };
}
