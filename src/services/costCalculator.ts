import type { CostBreakdown, Material, Machine, Settings, ExactCostParams } from '@/types';

/** Recargo sobre el costo de compra para cubrir repuestos (boquillas, PEI, correas...). 1.05 = +5%. */
export const SPARE_PARTS_FACTOR = 1.05;

/**
 * Desgaste de máquina por hora.
 * Fórmula: (costo_compra × SPARE_PARTS_FACTOR + mantenimiento_mensual × meses_vida) / horas_para_recuperar
 */
export function machineWearPerHour(machine: Machine): number {
  if (!machine.lifespan_hours) return 0;
  const monthsLife = machine.lifespan_hours / (8 * 22); // 8h/día, 22 días/mes
  const totalCost = machine.purchase_cost * SPARE_PARTS_FACTOR + machine.maintenance_cost_monthly * monthsLife;
  return totalCost / machine.lifespan_hours;
}

/** Costo de electricidad por hora de máquina. */
export function electricityCostPerHour(machine: Machine, settings: Settings): number {
  return (machine.wattage / 1000) * settings.electricity_cost_kwh;
}

/**
 * Cómo se carga la cantidad de material según la unidad con la que se compra.
 * Filamento ($/kg) se carga en gramos; resina ($/litro) en ml; el resto
 * (pliego, metro, unidad) se carga directamente en esa unidad (admite fracciones, ej. 0.25 pliego).
 */
export function materialInputUnit(material: Material | null | undefined): { label: string; factor: number } {
  const unit = (material?.unit_label ?? '').trim().toLowerCase();
  if (unit === 'kg') return { label: 'gramos', factor: 1 / 1000 };
  if (unit === 'l' || unit === 'litro' || unit === 'litros') return { label: 'ml', factor: 1 / 1000 };
  return { label: unit || 'unidad', factor: 1 };
}

/**
 * Calcula costo y precio sugerido de un trabajo.
 * - Tiempo de máquina → electricidad + desgaste.
 * - Tiempo de mano de obra (preparación, diseño, post-proceso) → mano de obra.
 *   No se cobra mano de obra por todo el tiempo de impresión porque la máquina trabaja sola.
 * - material = null → el cliente trae el objeto (ej. grabado sobre un mate).
 */
export function calculateCost(
  params: ExactCostParams,
  material: Material | null,
  machine: Machine,
  settings: Settings,
): CostBreakdown {
  const machineHours = Math.max(0, params.time_minutes) / 60;
  const laborHours = Math.max(0, params.labor_minutes) / 60;
  const quantity = Math.max(1, params.quantity);

  const materialCost = material
    ? Math.max(0, params.material_amount) * materialInputUnit(material).factor * material.unit_cost
    : 0;
  const electricityCost = machineHours * electricityCostPerHour(machine, settings);
  const machineWearCost = machineHours * machineWearPerHour(machine);
  const laborCost = laborHours * settings.labor_cost_hour;

  const subtotal = (materialCost + electricityCost + machineWearCost + laborCost) * quantity;
  const marginAmount = subtotal * (params.margin_percent / 100);

  return {
    material: materialCost * quantity,
    electricity: electricityCost * quantity,
    machine_wear: machineWearCost * quantity,
    labor: laborCost * quantity,
    subtotal,
    margin_percent: params.margin_percent,
    margin_amount: marginAmount,
    total: subtotal + marginAmount,
  };
}
