import React, { useEffect, useState } from 'react';
import { db } from '../supabase';
import { Plus, Trash2, Edit2, AlertCircle, RefreshCw, Archive, Layers } from 'lucide-react';

export default function Inventory() {
  const [materials, setMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'filament', 'mdf', 'cuerina', 'board'
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Estado del Formulario
  const [formData, setFormData] = useState({
    type: 'filament',
    name: '',
    brand: '',
    color: '',
    cost: '',
    unit_size: '',
    width: '',
    height: '',
    stock_qty: '',
    stock_min: '',
    supplier: '',
    delivery_time_days: ''
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await db.materials.getAll();
      setMaterials(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemToSave = {
        ...formData,
        cost: Number(formData.cost),
        unit_size: formData.unit_size ? Number(formData.unit_size) : null,
        width: formData.width ? Number(formData.width) : null,
        height: formData.height ? Number(formData.height) : null,
        stock_qty: Number(formData.stock_qty),
        stock_min: Number(formData.stock_min),
        supplier: formData.supplier || '',
        delivery_time_days: formData.delivery_time_days ? Number(formData.delivery_time_days) : 0
      };

      if (editingItem) {
        itemToSave.id = editingItem.id;
      }

      await db.materials.save(itemToSave);
      setShowAddForm(false);
      setEditingItem(null);
      resetForm();
      loadMaterials();
    } catch (e) {
      console.error("Error al guardar material:", e);
      alert("Error al guardar material: " + (e.message || JSON.stringify(e)));
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      name: item.name,
      brand: item.brand || '',
      color: item.color || '',
      cost: item.cost,
      unit_size: item.unit_size || '',
      width: item.width || '',
      height: item.height || '',
      stock_qty: item.stock_qty,
      stock_min: item.stock_min,
      supplier: item.supplier || '',
      delivery_time_days: item.delivery_time_days !== undefined ? item.delivery_time_days : ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este material del inventario?')) {
      try {
        await db.materials.delete(id);
        loadMaterials();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'filament',
      name: '',
      brand: '',
      color: '',
      cost: '',
      unit_size: '',
      width: '',
      height: '',
      stock_qty: '',
      stock_min: '',
      supplier: '',
      delivery_time_days: ''
    });
  };

  const filteredMaterials = activeTab === 'all' 
    ? materials 
    : materials.filter(m => m.type === activeTab);

  return (
    <div className="fade-in">
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }} className="gradient-text">
            Control de Inventario y Stock
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
            Gestioná filamentos, placas de madera, cuerinas y otros insumos base.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingItem(null);
            resetForm();
            setShowAddForm(!showAddForm);
          }}
        >
          <Plus size={18} />
          {showAddForm ? 'Cerrar Formulario' : 'Nuevo Material'}
        </button>
      </div>

      {/* Formulario de Carga / Edición */}
      {showAddForm && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>
            {editingItem ? 'Editar Insumo / Material' : 'Agregar Nuevo Insumo / Material'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Tipo de Material</label>
                <select name="type" className="form-select" value={formData.type} onChange={handleInputChange}>
                  <option value="filament">Filamento (3D)</option>
                  <option value="mdf">MDF (Láser)</option>
                  <option value="cuerina">Cuerina (Láser)</option>
                  <option value="board">Tablas de Picada</option>
                  <option value="other">Otro Insumo</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nombre del Material</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-input" 
                  required 
                  placeholder="ej. PLA Premium, MDF 3mm"
                  value={formData.name} 
                  onChange={handleInputChange} 
                />
              </div>

              {formData.type === 'filament' && (
                <>
                  <div className="form-group">
                    <label>Marca de Filamento</label>
                    <input 
                      type="text" 
                      name="brand" 
                      className="form-input" 
                      placeholder="ej. Grilon3, Printalot"
                      value={formData.brand} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input 
                      type="text" 
                      name="color" 
                      className="form-input" 
                      placeholder="ej. Negro, Rojo Semáforo"
                      value={formData.color} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Tamaño Bobina (Gramos)</label>
                    <input 
                      type="number" 
                      name="unit_size" 
                      className="form-input" 
                      placeholder="ej. 1000"
                      value={formData.unit_size} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </>
              )}

              {formData.type === 'mdf' && (
                <div className="form-group">
                  <label>Tipo de MDF</label>
                  <select name="color" className="form-select" value={formData.color} onChange={handleInputChange}>
                    <option value="Natural">Natural (Simple)</option>
                    <option value="Blanco Revestido">Blanco Revestido</option>
                    <option value="Negro Revestido">Negro Revestido</option>
                    <option value="Madera Revestida">Otro Revestido</option>
                  </select>
                </div>
              )}

              {(formData.type === 'mdf' || formData.type === 'cuerina' || formData.type === 'board') && (
                <>
                  <div className="form-group">
                    <label>Ancho (mm)</label>
                    <input 
                      type="number" 
                      name="width" 
                      className="form-input" 
                      placeholder="ej. 1830"
                      value={formData.width} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Alto / Largo (mm)</label>
                    <input 
                      type="number" 
                      name="height" 
                      className="form-input" 
                      placeholder="ej. 2600"
                      value={formData.height} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Costo Unitario ($)</label>
                <input 
                  type="number" 
                  name="cost" 
                  className="form-input" 
                  required 
                  placeholder="ej. 18000"
                  value={formData.cost} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-group">
                <label>Stock Actual ({formData.type === 'filament' ? 'g' : 'unidades'})</label>
                <input 
                  type="number" 
                  name="stock_qty" 
                  className="form-input" 
                  required 
                  placeholder="ej. 850, 10"
                  value={formData.stock_qty} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-group">
                <label>Stock Mínimo Alerta ({formData.type === 'filament' ? 'g' : 'unidades'})</label>
                <input 
                  type="number" 
                  name="stock_min" 
                  className="form-input" 
                  required 
                  placeholder="ej. 200, 2"
                  value={formData.stock_min} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-group">
                <label>Proveedor</label>
                <input 
                  type="text" 
                  name="supplier" 
                  className="form-input" 
                  placeholder="ej. TP3D, Mercado Libre, Maderera"
                  value={formData.supplier} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className="form-group">
                <label>Plazo de Entrega (Días)</label>
                <input 
                  type="number" 
                  name="delivery_time_days" 
                  className="form-input" 
                  placeholder="ej. 3"
                  value={formData.delivery_time_days} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowAddForm(false); setEditingItem(null); }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {editingItem ? 'Guardar Cambios' : 'Crear Material'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        {[
          { id: 'all', label: 'Todos' },
          { id: 'filament', label: 'Filamentos (3D)' },
          { id: 'mdf', label: 'MDF (Láser)' },
          { id: 'cuerina', label: 'Cuerinas' },
          { id: 'board', label: 'Tablas de Picada' },
          { id: 'other', label: 'Otros' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.6rem 1.2rem',
              background: 'transparent',
              border: 'none',
              color: activeTab === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
              borderBottom: activeTab === tab.id ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? '700' : '500',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de Insumos */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {filteredMaterials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
            <Archive size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No se encontraron materiales en esta categoría.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Material</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Detalle</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Proveedor</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Plazo Entrega</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Costo Base</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Tamaño Base</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Stock Actual</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Estado Stock</th>
                  <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((item) => {
                  const isLow = item.stock_qty <= item.stock_min;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>
                        <div>{item.name}</div>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'capitalize' }}>
                          {item.type === 'filament' ? 'Filamento' : item.type === 'mdf' ? 'MDF' : item.type}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        {item.type === 'filament' ? (
                          <span>Marca: <b>{item.brand || 'S/M'}</b> | Color: <b>{item.color}</b></span>
                        ) : (
                          <span>Tipo: <b>{item.color || 'Natural'}</b></span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', color: 'hsl(var(--text-secondary))' }}>
                        {item.supplier || <span style={{ color: 'hsl(var(--text-muted))' }}>No cargado</span>}
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        {item.delivery_time_days !== undefined && item.delivery_time_days !== 0 ? (
                          <span style={{ color: item.delivery_time_days > 5 ? 'hsl(var(--warning))' : 'inherit' }}>
                            {item.delivery_time_days} {item.delivery_time_days === 1 ? 'día' : 'días'}
                          </span>
                        ) : (
                          <span style={{ color: 'hsl(var(--text-muted))' }}>Inmediato</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: '700' }}>
                        ${item.cost.toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        {item.type === 'filament' ? (
                          <span>{item.unit_size} g</span>
                        ) : (
                          <span>{item.width} x {item.height} mm</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: '700' }}>
                        {item.stock_qty} {item.type === 'filament' ? 'g' : 'u'}
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', fontWeight: 'normal' }}>
                          Mínimo: {item.stock_min} {item.type === 'filament' ? 'g' : 'u'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                            {isLow ? 'Stock Bajo' : 'Normal'}
                          </span>
                          {isLow && (
                            <AlertCircle size={16} style={{ color: 'hsl(var(--danger))' }} title="Alerta de reposición enviada a verticegrabado@gmail.com" />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            onClick={() => handleEdit(item)}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.4rem', borderRadius: '6px' }}
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
