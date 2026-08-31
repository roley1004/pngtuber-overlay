import React, { useState } from 'react';
import { OBSDock } from './OBSDock';
import './DockSimulator.css';

export function DockSimulator({ setCurrentView, presets, dockUrl }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(dockUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="dock-simulator-layout">
      {/* Barra superior dedicada */}
      <header className="editor-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => setCurrentView('hub')}>
            <span className="material-symbols-outlined">chevron_left</span> Volver
          </button>
          <h1 className="editor-title">Simulador de Panel para OBS</h1>
        </div>
        
        <div className="header-right">
          {/* Botón Circular de Copiado (Expandible a la izquierda) */}
          <div className="url-copy-wrapper" onMouseLeave={() => setCopied(false)}>
            <button 
              className={`btn-link-copy ${copied ? 'copied' : ''}`} 
              onClick={handleCopy} 
            >
              <span className="copy-text">
                {copied ? '¡URL Copiada!' : 'Copiar URL del Panel'}
              </span>
              <div className="icon-circle">
                <span className="material-symbols-outlined">link</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Área de trabajo y simulador */}
      <div className="dock-simulator-body">
        
        {/* Panel lateral de instrucciones */}
        <div className="simulator-instructions">
          <h3>Instrucciones de Instalación</h3>
          <ol>
            <li>Haz clic en el botón superior para copiar tu URL permanente.</li>
            <li>En OBS Studio, ve al menú superior <strong>Docks (Paneles)</strong>.</li>
            <li>Selecciona <strong>Paneles de navegador personalizados...</strong></li>
            <li>Escribe <code>PNGTuber</code> en el nombre y pega la URL.</li>
            <li>Haz clic en Aplicar y arrastra tu nuevo panel donde prefieras.</li>
          </ol>
          <div className="simulator-tip">
            💡 <strong>Tip de prueba:</strong> Arrastra la esquina inferior derecha de la ventana oscura de la derecha para redimensionarla libremente y comprobar cómo se adapta a cualquier tamaño.
          </div>
        </div>

        {/* Lienzo de previsualización libre */}
        <div className="simulator-workspace">
          <div className="resizable-obs-window">
            <div className="obs-window-header">Dock Personalizado - PNGTuber</div>
            <div className="obs-window-content">
              {/* Renderizamos el panel en modo solo lectura para la prueba */}
              <OBSDock presets={presets} activePresetId={presets[0]?.id} onSelectPreset={() => {}} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}