import React from 'react';

// Maneja la selección del micrófono desde OBS, el ajuste de sensibilidad y la barra del VÚmetro
export function AudioSettings({
  isConnected,
  selectedMic,
  setSelectedMic,
  availableMics = [],
  isSelectOpen,
  setIsSelectOpen,
  sensitivity,
  setSensitivity,
  currentVolume
}) {
  // Conversión del volumen y sensibilidad para la barra gráfica
  const volumePercent = currentVolume;
  const thresholdPercent = sensitivity;
  // Cambia el color del VÚmetro cuando el volumen supera el umbral de sensibilidad configurado
  const vuColor = volumePercent >= thresholdPercent ? 'var(--text-main)' : '#c0c9bd';

  return (
    <div className="settings-section">
      <h3 className="section-title">Captura de Audio</h3>
      
      {/* Alerta si OBS no está conectado */}
      {!isConnected ? (
        <div className="warning-box" style={{ background: 'var(--bg-base)', padding: '15px', borderRadius: '12px', border: '1px solid var(--alert)', textAlign: 'center', color: 'var(--text-main)', fontSize: '13px', fontWeight: 'bold' }}>
          ⚠️ Conéctate a OBS arriba para detectar tus micrófonos.
        </div>
      ) : (
        <div className="audio-controls-row">
          {/* Selector de Micrófono */}
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Micrófono</label>
            <div className="custom-select-container">
              <div className="custom-select-trigger" onClick={(e) => { e.stopPropagation(); setIsSelectOpen(!isSelectOpen); }}>
                {selectedMic || "Selecciona..."} <span className="material-symbols-outlined" style={{fontSize: '16px'}}>arrow_drop_down</span>
              </div>
              {isSelectOpen && (
                <div className="custom-select-options">
                  {availableMics.map(mic => (
                    <div key={mic} onClick={() => { setSelectedMic(mic); setIsSelectOpen(false); }}>{mic}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Control de Sensibilidad y VÚmetro */}
          <div className="input-group" style={{ flex: 1 }}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <label className="input-label">Sensibilidad</label>
              <span className="value-label">{Math.round(sensitivity)}%</span>
            </div>
            <input 
              type="range" 
              className="slider" 
              min="1" 
              max="100" 
              step="1" 
              value={sensitivity} 
              onChange={(e) => setSensitivity(parseFloat(e.target.value))} 
            />
            {/* Barra gráfica de volumen (VÚmetro) */}
            <div className="vu-meter-container">
              <div className="vu-meter-threshold" style={{ left: `${thresholdPercent}%` }}></div>
              <div className="vu-meter-fill" style={{ width: `${volumePercent}%`, backgroundColor: vuColor }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}