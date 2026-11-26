import React, { useEffect, useState } from 'react';
import { db } from '../supabase';
import { Settings as SettingsIcon, Calculator as CalcIcon, Save, Info, AlertCircle } from 'lucide-react';

export default function Calculator({ setActivePage }) {
  const [activeTab, setActiveTab] = useState('3d'); // '3d' | 'laser'
  const [materials, setMaterials] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Estados de Configuración
  const [settingsForm, setSettingsForm] = useState({});

  // --- Estados de Impresión 3D ---
  const [calc3d, setCalc3d] = useState({
    materialId: '',
    weightGrams: '',
    printHours: '',
    designHours: '',
    setupHours: 0.5, // Tiempo de Armado/Post-proceso por defecto (1/2 hora)
    marginPercent: '',
    includeShipping: false
  });
  const [result3d, setResult3d] = useState(null);

  // --- Estados de Corte/Grabado Láser ---
  const [calcLaser, setCalcLaser] = useState({
    materialId: '',
    partWidthMm: '',
    partHeightMm: '',
    machineMinutes: '',
    designHours: '',
    marginPercent: '',
    includeShipping: false
  });
  const [resultLaser, setResultLaser] = useState(null);

  // --- Estado para Guardar como Pedido ---
  const [orderForm, setOrderForm] = useState({
    clientName: '',
    clientPhone: '',
    description: '',
    status: 'Consulta'
  });
  const [showSaveOrderModal, setShowSaveOrderModal] = useState(false);
  const [tempBreakdown, setTempBreakdown] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allMaterials = await db.materials.getAll();
      const currentSettings = await db.settings.get();
      setMaterials(allMaterials);
      setSettings(currentSettings);
      setSettingsForm(currentSettings);

      // Pre-seleccionar primer material disponible
      const defaultFilament = allMaterials.find(m => m.type === 'filament');
      if (defaultFilament) {
        setCalc3d(prev => ({ 
          ...prev, 
          materialId: defaultFilament.id, 
          marginPercent: currentSettings.profit_margin_default,
          setupHours: 0.5 // Valor inicial por defecto para armado
        }));
      }

      const defaultLaserMat = allMaterials.find(m => ['mdf', 'cuerina', 'board'].includes(m.type));
      if (defaultLaserMat) {
        setCalcLaser(prev => ({ ...prev, materialId: defaultLaserMat.id, marginPercent: currentSettings.profit_margin_default }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Lógica del Calculador 3D ---
  useEffect(() => {
    if (!settings || !calc3d.materialId) return;

    const selectedMaterial = materials.find(m => m.id === calc3d.materialId);
    if (!selectedMaterial) return;

    const weight = Number(calc3d.weightGrams) || 0;
    const printTime = Number(calc3d.printHours) || 0;
    const designTime = Number(calc3d.designHours) || 0;
    const setupTime = Number(calc3d.setupHours) || 0;
    const margin = Number(calc3d.marginPercent) || 0;

    // Fórmulas de Keitron
    // 1. Costo Material = Cantidad * (Precio Filamento / Tamaño Bobina)
    const materialCost = weight * (selectedMaterial.cost / (selectedMaterial.unit_size || 1000));
    
    // 2. Costo Máquina = (Amortización + Consumo Eléctrico) * Horas Impresión
    // Amortización = (Precio Impresora + 20%) / Horas esperadas (ej. 2500)
    const wearCost = printTime * ((settings.printer_cost * 1.2) / settings.printer_lifespan);
    const electricityCost = printTime * ((settings.printer_wattage / 1000) * settings.electricity_kwh);
    
    // 3. Costo Personal = (Tiempo Diseño + Tiempo Armado/Postproceso) * Tarifa Hora
    const laborCost = (designTime + setupTime) * settings.labor_hour;

    // Costo de producción base (sin mano de obra) para aplicar el margen
    const prodCostWithoutLabor = materialCost + electricityCost + wearCost;
    const profit = prodCostWithoutLabor * (margin / 100);
    
    // Costo total neto de producción (con mano de obra)
    const totalCost = prodCostWithoutLabor + laborCost;
    const subtotalPrice = prodCostWithoutLabor + profit + laborCost;
    const shipping = calc3d.includeShipping ? settings.shipping_cost : 0;
    const totalPrice = subtotalPrice + shipping;

    setResult3d({
      materialCost,
      electricityCost,
      wearCost,
      laborCost,
      totalCost,
      profit,
      subtotalPrice,
      shipping,
      totalPrice
    });
  }, [calc3d, settings, materials]);

  // --- Lógica del Calculador Láser ---
  useEffect(() => {
    if (!settings || !calcLaser.materialId) return;

    const selectedMaterial = materials.find(m => m.id === calcLaser.materialId);
    if (!selectedMaterial) return;

    const pWidth = Number(calcLaser.partWidthMm) || 0;
    const pHeight = Number(calcLaser.partHeightMm) || 0;
    const machineMinutes = Number(calcLaser.machineMinutes) || 0;
    const designTime = Number(calcLaser.designHours) || 0;
    const margin = Number(calcLaser.marginPercent) || 0;

    // Fórmulas
    let materialCost = 0;
    if (selectedMaterial.type === 'board') {
      // Si es una tabla comprada, se calcula por unidad
      materialCost = selectedMaterial.cost;
    } else {
      // MDF y cuerina por superficie
      const sheetArea = (selectedMaterial.width || 1830) * (selectedMaterial.height || 2600);
      const pieceArea = pWidth * pHeight;
      materialCost = sheetArea > 0 ? (pieceArea / sheetArea) * selectedMaterial.cost : 0;
    }

    // Fórmulas de Keitron aplicadas al Láser
    // Amortización Máquina = (Precio Láser + 20%) / Horas de recuperación (ej. 2500)
    const wearCostPerHour = (settings.laser_cost * 1.2) / settings.laser_lifespan;
    const electricityCostPerHour = (settings.laser_wattage / 1000) * settings.electricity_kwh;
    
    const wearCost = (machineMinutes / 60) * wearCostPerHour;
    const electricityCost = (machineMinutes / 60) * electricityCostPerHour;
    const machineCost = wearCost + electricityCost;
    
    const laborCost = designTime * settings.labor_hour;

    // Costo de producción base (sin mano de obra) para aplicar el margen
    const prodCostWithoutLabor = materialCost + machineCost;
    const profit = prodCostWithoutLabor * (margin / 100);
    
    // Costo total neto de producción (con mano de obra)
    const totalCost = prodCostWithoutLabor + laborCost;
    const subtotalPrice = prodCostWithoutLabor + profit + laborCost;
    const shipping = calcLaser.includeShipping ? settings.shipping_cost : 0;
    const totalPrice = subtotalPrice + shipping;

    setResultLaser({
      materialCost,
      wearCost,
      electricityCost,
      machineCost,
      laborCost,
      totalCost,
      profit,
      subtotalPrice,
      shipping,
      totalPrice
    });
  }, [calcLaser, settings, materials]);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await db.settings.save(settingsForm);
      setSettings(updated);
      setShowSettings(false);
      alert('Configuración de costos guardada exitosamente.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettingsInput = (e) => {
    const { name, value } = e.target;
    setSettingsForm({ ...settingsForm, [name]: Number(value) });
  };

  const openSaveOrderModal = (type) => {
    const currentResult = type === '3d' ? result3d : resultLaser;
    const currentInput = type === '3d' ? calc3d : calcLaser;
    const selectedMatName = materials.find(m => m.id === currentInput.materialId)?.name || 'Material';

    setTempBreakdown({
      type,
      total_price: Math.round(currentResult.totalPrice),
      description: `${type === '3d' ? 'Impresión 3D' : 'Grabado/Corte Láser'} - ${selectedMatName} (${type === '3d' ? `${currentInput.weightGrams}g` : `${currentInput.partWidthMm}x${currentInput.partHeightMm}mm`})`,
      cost_breakdown: {
        ...currentResult,
        margin: currentInput.marginPercent
      }
    });

    setOrderForm({
      clientName: '',
      clientPhone: '',
      description: `${type === '3d' ? 'Impresión 3D' : 'Grabado/Corte Láser'} en ${selectedMatName}`,
      status: 'Consulta'
    });

    setShowSaveOrderModal(true);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    try {
      const newOrder = {
        client_name: orderForm.clientName,
        client_phone: orderForm.clientPhone,
        description: orderForm.description,
        type: tempBreakdown.type,
        status: orderForm.status,
        total_price: tempBreakdown.total_price,
        payment_status: 'pending',
        payment_link: '',
        progress: 10,
        cost_breakdown: tempBreakdown.cost_breakdown
      };

      await db.orders.save(newOrder);
      setShowSaveOrderModal(false);
      alert('Presupuesto guardado como pedido exitosamente.');
      setActivePage('orders');
    } catch (e) {
      console.error(e);
    }
  };

  const filaments = materials.filter(m => m.type === 'filament');
  const laserMaterials = materials.filter(m => ['mdf', 'cuerina', 'board'].includes(m.type));

  return (
    <div className="fade-in">
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }} className="gradient-text">
            Cotizador Inteligente de Precios
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
            Calculá presupuestos exactos para tus clientes basados en tus costos reales de insumos.
          </p>
        </div>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowSettings(!showSettings)}
        >
          <SettingsIcon size={18} />
          {showSettings ? 'Ocultar Parámetros' : 'Configurar Costos Fijos'}
        </button>
      </div>

      {/* Editor de Costos Fijos */}
      {showSettings && settings && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: 'hsl(var(--secondary))' }}>
            Ajustar Parámetros Base de Costos (Luz, Mano de Obra, Amortización)
          </h3>
          <form onSubmit={handleSettingsSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Precio kWh Luz ($)</label>
                <input type="number" name="electricity_kwh" className="form-input" value={settingsForm.electricity_kwh} onChange={handleSettingsInput} />
              </div>
              <div className="form-group">
                <label>Precio Hora Trabajo / Diseño ($)</label>
                <input type="number" name="labor_hour" className="form-input" value={settingsForm.labor_hour} onChange={handleSettingsInput} />
              </div>
              <div className="form-group">
                <label>Envío Fijo ($)</label>
                <input type="number" name="shipping_cost" className="form-input" value={settingsForm.shipping_cost} onChange={handleSettingsInput} />
              </div>
              <div className="form-group">
                <label>Costo Máquina Láser ($)</label>
                <input type="number" name="laser_cost" className="form-input" value={settingsForm.laser_cost} onChange={handleSettingsInput} />
              </div>
              <div className="form-group">
                <label>Horas Recuperación Láser</label>
                <input type="number" name="laser_lifespan" className="form-input" value={settingsForm.laser_lifespan} onChange={handleSettingsInput} />
              </div>
              <div className="form-group">
                <label>Consumo Láser (Watts)</label>
                <input type="number" name="laser_wattage" className="form-input" value={settingsForm.laser_wattage} onChange={handleSettingsInput} />
              </div>
              <div className="form-group">
                <label>Margen Ganancia base (%)</label>
                <input type="number" name="profit_margin_default" className="form-input" value={settingsForm.profit_margin_default} onChange={handleSettingsInput} />
              </div>
              <div className="form-group">
                <label>Consumo Impresora (Watts)</label>
                <input type="number" name="printer_wattage" className="form-input" value={settingsForm.printer_wattage} onChange={handleSettingsInput} />
              </div>
              <div className="form-group">
                <label>Costo Impresora ($)</label>
                <input type="number" name="printer_cost" className="form-input" value={settingsForm.printer_cost} onChange={handleSettingsInput} />
              </div>
              <div className="form-group">
                <label>Horas Recuperación Inversión</label>
                <input type="number" name="printer_lifespan" className="form-input" value={settingsForm.printer_lifespan} onChange={handleSettingsInput} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar Configuración</button>
            </div>
          </form>
        </div>
      )}

      {/* Navegación de Calculadoras */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('3d')}
          className="btn"
          style={{
            flex: 1,
            background: activeTab === '3d' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${activeTab === '3d' ? 'hsl(var(--secondary))' : 'var(--border-color)'}`,
            color: activeTab === '3d' ? 'hsl(var(--secondary))' : 'hsl(var(--text-secondary))'
          }}
        >
          <CalcIcon size={18} />
          Impresión y Diseño 3D
        </button>
        <button
          onClick={() => setActiveTab('laser')}
          className="btn"
          style={{
            flex: 1,
            background: activeTab === 'laser' ? 'rgba(147, 51, 234, 0.15)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${activeTab === 'laser' ? 'hsl(var(--primary))' : 'var(--border-color)'}`,
            color: activeTab === 'laser' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))'
          }}
        >
          <CalcIcon size={18} />
          Corte y Grabado Láser
        </button>
      </div>

      {/* --- FORMULARIO Y RESULTADOS DE CADA CALCULADORA --- */}
      {activeTab === '3d' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Formulario 3D */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: 'hsl(var(--secondary))' }}>Datos de la Impresión</h3>
            
            <div className="form-group">
              <label>Seleccionar Material (Filamento en stock)</label>
              <select 
                className="form-select"
                value={calc3d.materialId}
                onChange={(e) => setCalc3d({ ...calc3d, materialId: e.target.value })}
              >
                <option value="">Seleccione un filamento...</option>
                {filaments.map(m => (
                  <option key={m.id} value={m.id}>{m.brand} - {m.name} ({m.color}) [Stock: {m.stock_qty}g]</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Peso de la pieza (Gramos)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="ej. 85" 
                value={calc3d.weightGrams}
                onChange={(e) => setCalc3d({ ...calc3d, weightGrams: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Tiempo de Impresión (Horas)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="ej. 6.5" 
                value={calc3d.printHours}
                onChange={(e) => setCalc3d({ ...calc3d, printHours: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Tiempo de Diseño (Horas)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="ej. 1" 
                value={calc3d.designHours}
                onChange={(e) => setCalc3d({ ...calc3d, designHours: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Tiempo de Armado / Post-procesado (Horas)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="ej. 0.5" 
                step="0.1"
                value={calc3d.setupHours}
                onChange={(e) => setCalc3d({ ...calc3d, setupHours: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Margen de Ganancia (%)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="ej. 120" 
                value={calc3d.marginPercent}
                onChange={(e) => setCalc3d({ ...calc3d, marginPercent: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input 
                type="checkbox" 
                id="shipping3d" 
                checked={calc3d.includeShipping}
                onChange={(e) => setCalc3d({ ...calc3d, includeShipping: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="shipping3d" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>
                Incluir Envío Fijo (+${settings?.shipping_cost.toLocaleString()})
              </label>
            </div>
          </div>

          {/* Resultado 3D */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Desglose de Costos e Impuestos</h3>
            
            {result3d && calc3d.materialId ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Costo de Plástico (Filamento)</span>
                    <span style={{ fontWeight: '600' }}>${result3d.materialCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Costo Energía Eléctrica</span>
                    <span style={{ fontWeight: '600' }}>${result3d.electricityCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Amortización Máquina (+20%)</span>
                    <span style={{ fontWeight: '600' }}>${result3d.wearCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Costo Personal (Diseño + Armado)</span>
                    <span style={{ fontWeight: '600' }}>${result3d.laborCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'hsl(var(--secondary))', fontWeight: '700' }}>
                    <span>Costo de Producción Neto</span>
                    <span>${result3d.totalCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Margen de Ganancia ({calc3d.marginPercent}%)</span>
                    <span style={{ fontWeight: '600', color: 'hsl(var(--success))' }}>+${result3d.profit.toFixed(2)}</span>
                  </div>
                  {calc3d.includeShipping && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))' }}>Costo de Envío Fijo</span>
                      <span style={{ fontWeight: '600' }}>${result3d.shipping.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div style={{ 
                  background: 'rgba(6, 182, 212, 0.05)', 
                  border: '1px solid rgba(6, 182, 212, 0.2)', 
                  padding: '1rem', 
                  borderRadius: '12px',
                  marginTop: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>PRECIO SUGERIDO CLIENTE</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'hsl(var(--secondary))' }}>
                      ${Math.round(result3d.totalPrice).toLocaleString()}
                    </h2>
                  </div>
                  <button 
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: '0 4px 10px rgba(6, 182, 212, 0.3)' }}
                    onClick={() => openSaveOrderModal('3d')}
                  >
                    <Save size={16} />
                    Guardar Pedido
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', flexDirection: 'column', gap: '0.5rem' }}>
                <Info size={32} />
                <p>Complete los datos para ver la cotización.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Formulario Láser */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', color: 'hsl(var(--primary))' }}>Datos del Grabado/Corte</h3>
            
            <div className="form-group">
              <label>Seleccionar Material / Insumo (Placas en stock)</label>
              <select 
                className="form-select"
                value={calcLaser.materialId}
                onChange={(e) => setCalcLaser({ ...calcLaser, materialId: e.target.value })}
              >
                <option value="">Seleccione una placa/material...</option>
                {laserMaterials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.color || 'Natural'}) {m.type === 'board' ? `[Unidades: ${m.stock_qty}]` : `[${m.width}x${m.height}mm - Stock: ${m.stock_qty}u]`}
                  </option>
                ))}
              </select>
            </div>

            {calcLaser.materialId && materials.find(m => m.id === calcLaser.materialId)?.type !== 'board' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Ancho Pieza (mm)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="ej. 300" 
                    value={calcLaser.partWidthMm}
                    onChange={(e) => setCalcLaser({ ...calcLaser, partWidthMm: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Alto Pieza (mm)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="ej. 200" 
                    value={calcLaser.partHeightMm}
                    onChange={(e) => setCalcLaser({ ...calcLaser, partHeightMm: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Tiempo de Máquina Láser (Minutos)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="ej. 15" 
                value={calcLaser.machineMinutes}
                onChange={(e) => setCalcLaser({ ...calcLaser, machineMinutes: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Tiempo de Diseño / Lijado / Armado (Horas)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="ej. 0.5" 
                value={calcLaser.designHours}
                onChange={(e) => setCalcLaser({ ...calcLaser, designHours: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Margen de Ganancia (%)</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="ej. 120" 
                value={calcLaser.marginPercent}
                onChange={(e) => setCalcLaser({ ...calcLaser, marginPercent: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <input 
                type="checkbox" 
                id="shippingLaser" 
                checked={calcLaser.includeShipping}
                onChange={(e) => setCalcLaser({ ...calcLaser, includeShipping: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="shippingLaser" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>
                Incluir Envío Fijo (+${settings?.shipping_cost.toLocaleString()})
              </label>
            </div>
          </div>

          {/* Resultado Láser */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Desglose de Costos e Impuestos</h3>
            
            {resultLaser && calcLaser.materialId ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Costo Proporcional Material</span>
                    <span style={{ fontWeight: '600' }}>${resultLaser.materialCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Amortización Láser (+20%)</span>
                    <span style={{ fontWeight: '600' }}>${(resultLaser.wearCost || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Costo Energía Láser</span>
                    <span style={{ fontWeight: '600' }}>${(resultLaser.electricityCost || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Mano de obra (Prep. / Lijado / Diseño)</span>
                    <span style={{ fontWeight: '600' }}>${resultLaser.laborCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', color: 'hsl(var(--primary))', fontWeight: '700' }}>
                    <span>Costo de Producción Neto</span>
                    <span>${resultLaser.totalCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))' }}>Margen de Ganancia ({calcLaser.marginPercent}%)</span>
                    <span style={{ fontWeight: '600', color: 'hsl(var(--success))' }}>+${resultLaser.profit.toFixed(2)}</span>
                  </div>
                  {calcLaser.includeShipping && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))' }}>Costo de Envío Fijo</span>
                      <span style={{ fontWeight: '600' }}>${resultLaser.shipping.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div style={{ 
                  background: 'rgba(147, 51, 234, 0.05)', 
                  border: '1px solid rgba(147, 51, 234, 0.2)', 
                  padding: '1rem', 
                  borderRadius: '12px',
                  marginTop: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>PRECIO SUGERIDO CLIENTE</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'hsl(var(--primary))' }}>
                      ${Math.round(resultLaser.totalPrice).toLocaleString()}
                    </h2>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => openSaveOrderModal('laser')}
                  >
                    <Save size={16} />
                    Guardar Pedido
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', flexDirection: 'column', gap: '0.5rem' }}>
                <Info size={32} />
                <p>Complete los datos para ver la cotización.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL PARA GUARDAR COMO PEDIDO --- */}
      {showSaveOrderModal && tempBreakdown && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ padding: '2rem', width: '90%', maxWidth: '500px', animation: 'fadeIn 0.25s ease' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'hsl(var(--success))' }}>Registrar Presupuesto como Pedido</h3>
            
            <form onSubmit={handleSaveOrder}>
              <div className="form-group">
                <label>Nombre del Cliente</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="ej. Lucas Rodríguez"
                  value={orderForm.clientName}
                  onChange={(e) => setOrderForm({ ...orderForm, clientName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Teléfono (WhatsApp)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="ej. +5491123456789"
                  value={orderForm.clientPhone}
                  onChange={(e) => setOrderForm({ ...orderForm, clientPhone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Descripción del Trabajo</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  required
                  value={orderForm.description}
                  onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Estado Inicial</label>
                <select 
                  className="form-select"
                  value={orderForm.status}
                  onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                >
                  <option value="Consulta">Consulta (Presupuestado)</option>
                  <option value="Diseñando">Diseñando</option>
                  <option value="En espera de confirmación">En espera de confirmación</option>
                </select>
              </div>

              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                padding: '0.85rem', 
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem'
              }}>
                <span style={{ color: 'hsl(var(--text-secondary))' }}>Monto total a cobrar:</span>
                <span style={{ fontWeight: '700', color: 'hsl(var(--success))' }}>${tempBreakdown.total_price.toLocaleString()}</span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSaveOrderModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', boxShadow: '0 4px 10px rgba(34, 197, 94, 0.2)' }}>
                  Confirmar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
