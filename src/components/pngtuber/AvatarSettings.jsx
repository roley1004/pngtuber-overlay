export function AvatarSettings({
  isConnected,
  selectedMic, setSelectedMic, availableMics,
  sensitivity, setSensitivity,
  blinkFrequency, setBlinkFrequency,
  isRandomBlink, setIsRandomBlink,
  bounceIntensity, setBounceIntensity,
  isSelectOpen, setIsSelectOpen,
  isSimulating, setIsSimulating,
  handleImageUpload, 
  images, currentVolume, fileError
}) {
  
  const volumePercent = currentVolume; 
  const thresholdPercent = sensitivity;
  const vuColor = volumePercent >= thresholdPercent ? 'var(--hub-primary)' : '#c0c9bd';

  // Función externa para evitar que React destruya el input al parpadear
  const renderImageCard = (label, stateKey, image) => (
    <label className="upload-card" key={stateKey}>
      <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(stateKey, e)} />
      {image ? <img src={image} alt={label} /> : <span>{label}</span>}
    </label>
  );

  return (
    <div className="settings-module">
      
      {/* CARGA DE ESTADOS */}
      <div className="settings-section">
        <h3 className="section-title">Cargar Estados</h3>
        <div className="upload-grid">
          {renderImageCard("Reposo", "idle", images.idle)}
          {renderImageCard("Parpadeo", "blink", images.blink)}
          {renderImageCard("Hablar", "talk", images.talk)}
          {renderImageCard("Hablar + Parpadeo", "talkBlink", images.talkBlink)}
        </div>
        {fileError && <p className="error-text">⚠️ {fileError}</p>}
      </div>

      <hr className="divider" />

      {/* CAPTURA DE AUDIO */}
      <div className="settings-section">
        <h3 className="section-title">Captura de Audio</h3>
        {!isConnected ? (
          <div className="warning-box" style={{ background: 'var(--bg-base)', padding: '15px', borderRadius: '12px', border: '1px solid var(--secondary)', textAlign: 'center', color: 'var(--secondary)', fontSize: '13px', fontWeight: 'bold' }}>
            ⚠️ Conéctate a OBS arriba para detectar tus micrófonos.
          </div>
        ) : (
          <div className="audio-controls-row">
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

            <div className="input-group" style={{ flex: 1 }}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <label className="input-label">Sensibilidad</label>
                <span className="value-label">{Math.round(sensitivity)}%</span>
              </div>
              <input type="range" className="slider" min="1" max="100" step="1" value={sensitivity} onChange={(e) => setSensitivity(parseFloat(e.target.value))} />
              <div className="vu-meter-container">
                <div className="vu-meter-threshold" style={{ left: `${thresholdPercent}%` }}></div>
                <div className="vu-meter-fill" style={{ width: `${volumePercent}%`, backgroundColor: vuColor }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* ANIMACIÓN */}
      <div className="settings-section">
        <div className="animation-row">
          <div className="input-group" style={{ flex: 1 }}>
            <h3 className="section-title">Animación</h3>
            <label className="input-label">Parpadeo</label>
            <div className="blink-controls">
              <input 
                type="number" 
                className="number-input" 
                value={blinkFrequency} 
                onChange={(e) => setBlinkFrequency(parseFloat(e.target.value))} 
                disabled={isRandomBlink}
                min="1" max="10" step="0.5"
              />
              <span style={{fontSize: '14px', color: 'var(--text-main)'}}>seg.</span>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" checked={isRandomBlink} onChange={(e) => setIsRandomBlink(e.target.checked)} />
              <span className="custom-checkbox"></span>
              Aleatorio
            </label>
          </div>

          <div className="input-group" style={{ flex: 1 }}>
            <h3 className="section-title" style={{visibility: 'hidden'}}>Espacio</h3>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '-20px'}}>
              <label className="input-label">Intensidad de rebote</label>
              <span className="value-label">{bounceIntensity}%</span>
            </div>
            <input type="range" className="slider" min="0" max="100" step="1" value={bounceIntensity} onChange={(e) => setBounceIntensity(parseInt(e.target.value))} style={{marginTop: '10px'}} />
          </div>
        </div>
      </div>

      {/* BOTÓN SIMULAR HABLA */}
      <div className="simulate-container">
        <button 
          onMouseDown={() => setIsSimulating(true)} onMouseUp={() => setIsSimulating(false)}
          onMouseLeave={() => setIsSimulating(false)} onTouchStart={() => setIsSimulating(true)}
          onTouchEnd={() => setIsSimulating(false)}
          className={`btn-simulate ${isSimulating ? "active" : ""}`}
        >
          <span className="material-symbols-outlined">record_voice_over</span> Hablar
        </button>
        <span className="simulate-hint">Mantén presionado para probar</span>
      </div>

    </div>
  )
}