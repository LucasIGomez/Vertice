import React, { useState, useRef, useEffect } from 'react';
import { traceImageToSVG } from '../utils/imageTracer';
import { Upload, Download, Copy, RefreshCw, ZoomIn, Sliders, AlertTriangle } from 'lucide-react';

export default function Vectorizer() {
  const [imageSrc, setImageSrc] = useState(null);
  const [threshold, setThreshold] = useState(128);
  const [svgOutput, setSvgOutput] = useState('');
  const [pathCount, setPathCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Ejecutar el trazado cuando cambia el umbral o la imagen cargada
  useEffect(() => {
    if (imageSrc) {
      vectorize();
    }
  }, [imageSrc, threshold]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      loadImage(file);
    }
  };

  const loadImage = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const vectorize = () => {
    setLoading(true);
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Limitar tamaño de análisis para rendimiento (máx 500px de ancho/alto)
      const maxDim = 400;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      
      canvas.width = w;
      canvas.height = h;
      
      // Limpiar y dibujar
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      
      // Correr el trazador Moore-Neighbor
      try {
        const result = traceImageToSVG(canvas, threshold);
        setSvgOutput(result.svg);
        setPathCount(result.count);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  };

  const handleDownload = () => {
    if (!svgOutput) return;
    const blob = new Blob([svgOutput], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vertice_vectorizado.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCode = () => {
    if (!svgOutput) return;
    navigator.clipboard.writeText(svgOutput);
    alert('Código SVG copiado al portapapeles.');
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      loadImage(file);
    }
  };

  return (
    <div className="fade-in">
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem' }} className="gradient-text-laser">
            Vectorizador de Imágenes PNG a SVG
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
            Convertí logos y siluetas PNG en vectores SVG listos para tu software de grabado láser (ej. LightBurn, RDWorks).
          </p>
        </div>
      </div>

      {/* Grid del Espacio de Trabajo */}
      <div style={{ display: 'grid', gridTemplateColumns: imageSrc ? '1.2fr 2fr' : '1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Zona de Carga y Controles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Tarjeta de Carga */}
          <div 
            className="glass-card"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            style={{
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              border: '2px dashed var(--border-color)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange} 
              onClick={(e) => e.stopPropagation()}
            />
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(236, 72, 153, 0.1)',
              color: 'hsl(var(--accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Upload size={28} />
            </div>
            <div>
              <p style={{ fontWeight: '700', fontSize: '1rem', color: '#fff' }}>Arrastrá una imagen PNG aquí</p>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '0.25rem' }}>o hacé clic para seleccionar de tu equipo</p>
            </div>
          </div>

          {/* Tarjeta de Controles (Sliders) */}
          {imageSrc && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} style={{ color: 'hsl(var(--accent))' }} />
                Ajuste de Umbral Vectorial
              </h3>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <label htmlFor="threshold-slider" style={{ marginBottom: 0 }}>Umbral de Borde: <b>{threshold}</b></label>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>0 (Claro) - 255 (Oscuro)</span>
                </div>
                <input 
                  id="threshold-slider"
                  type="range" 
                  min="10" 
                  max="245" 
                  className="form-input"
                  style={{ padding: 0, height: '6px', cursor: 'pointer' }}
                  value={threshold} 
                  onChange={(e) => setThreshold(Number(e.target.value))} 
                />
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.85rem',
                fontSize: '0.8rem',
                display: 'flex',
                gap: '0.5rem',
                color: 'hsl(var(--text-secondary))'
              }}>
                <AlertTriangle size={18} style={{ color: 'hsl(var(--warning))', flexShrink: 0 }} />
                <span>
                  <b>Tip:</b> Aumentá el umbral para incluir trazos más finos de la imagen original. Reducilo si se generan "manchas" o bordes indeseados.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Workspace de Visualización (Side by Side) */}
        {imageSrc && (
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem' }}>Visualización y Exportación</h3>
              <span className="badge badge-primary" style={{ background: 'rgba(236,72,153,0.1)', color: 'hsl(var(--accent))', borderColor: 'rgba(236,72,153,0.2)' }}>
                Contornos trazados: {pathCount} caminos
              </span>
            </div>

            {/* Comparación Visual */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '1rem',
              minHeight: '300px',
              alignItems: 'center',
              justifyItems: 'center'
            }}>
              {/* Imagen Original */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '0.5rem', fontWeight: '700' }}>PNG ORIGINAL</p>
                <div style={{ 
                  background: '#fff', 
                  backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px), radial-gradient(#ccc 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                  backgroundPosition: '0 0, 6px 6px',
                  padding: '1rem', 
                  borderRadius: '8px', 
                  display: 'inline-block',
                  maxWidth: '100%'
                }}>
                  <img src={imageSrc} alt="Original" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              </div>

              {/* Vector de Salida */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '0.5rem', fontWeight: '700' }}>SVG VECTORIZADO (LÁSER)</p>
                <div style={{ 
                  background: '#fff', 
                  backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px), radial-gradient(#ccc 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                  backgroundPosition: '0 0, 6px 6px',
                  padding: '1rem', 
                  borderRadius: '8px', 
                  display: 'inline-block', 
                  color: '#000', // El stroke currentColor del SVG será negro
                  maxWidth: '100%'
                }}>
                  {svgOutput ? (
                    <div 
                      style={{ maxHeight: '200px', maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      dangerouslySetInnerHTML={{ __html: svgOutput }} 
                    />
                  ) : (
                    <div style={{ height: '200px', width: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                      <RefreshCw size={24} className="animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones de Exportación */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: 'auto' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleCopyCode}
                disabled={!svgOutput || loading}
              >
                <Copy size={16} />
                Copiar Código SVG
              </button>
              <button 
                className="btn btn-accent" 
                onClick={handleDownload}
                disabled={!svgOutput || loading}
              >
                <Download size={16} />
                Descargar SVG Vectorial
              </button>
            </div>

            {/* Canvas oculto de procesamiento */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

      </div>
    </div>
  );
}
