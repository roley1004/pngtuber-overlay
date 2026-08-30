export function AvatarSettings({
  isConnected,
  selectedMic, setSelectedMic, availableMics,
  sensitivity, setSensitivity,
  blinkFrequency, setBlinkFrequency,
  isRandomBlink, setIsRandomBlink,
  talkIntensity, setTalkIntensity,
  idleIntensity, setIdleIntensity,
  isVoiceReactive, setIsVoiceReactive,
  talkAnimation, setTalkAnimation,
  idleAnimation, setIdleAnimation,
  isSelectOpen, setIsSelectOpen,
  handleImageUpload, handleClearImage,
  images, currentVolume, fileError
}) {
  
  const volumePercent = currentVolume; 
  const thresholdPercent = sensitivity;
  const vuColor = volumePercent >= thresholdPercent ? 'var(--hub-primary)' : '#c0c9bd';

  const renderImageCard = (label, stateKey, image) => (
    <div className="upload-card" key={stateKey} style={{ position: 'relative' }}>
      <label style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(stateKey, e)} />
        {image ? <img src={image} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span>{label}</span>}
      </label>
      {image && (
        <button 
          onClick={(e) => handleClearImage(stateKey, e)}
          style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}
          title="Borrar imagen"
        >
          ✕
        </button>
      )}
    </div>
  );

  return (
    <div className="settings-module">
      
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

      <div className="settings-section">
        <h3 className="section-title">Animación y Movimiento</h3>
        
        <div className="animation-row">
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Frecuencia de Parpadeo</label>
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
              <label className="checkbox-label" style={{marginLeft: '12px', marginTop: '0'}}>
                <input type="checkbox" checked={isRandomBlink} onChange={(e) => setIsRandomBlink(e.target.checked)} />
                <span className="custom-checkbox"></span>
                Aleatorio
              </label>
            </div>
          </div>
        </div>

        <div className="animation-row" style={{ marginTop: '16px', alignItems: 'flex-start' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label" style={{color: 'var(--hub-primary)'}}>Animación al Hablar</label>
            <select className="text-input" value={talkAnimation} onChange={e => setTalkAnimation(e.target.value)}>
              <option value="bounce">Rebote Vertical</option>
              <option value="squash">Gelatina (Anclada)</option>
              <option value="tilt">Balanceo Rítmico</option>
            </select>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '8px'}}>
              <span className="value-label" style={{lineHeight: '1.2'}}>
                {isVoiceReactive ? "Límite Máx. Intensidad" : "Intensidad de Habla"}
              </span>
              <span className="value-label">{talkIntensity}%</span>
            </div>
            <input type="range" className="slider" min="0" max="100" step="1" value={talkIntensity} onChange={(e) => setTalkIntensity(parseInt(e.target.value))} />
            
            <label className="checkbox-label" style={{marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none'}}>
              <input type="checkbox" checked={isVoiceReactive} onChange={(e) => setIsVoiceReactive(e.target.checked)} />
              <span className="custom-checkbox" style={{flexShrink: 0}}></span>
              <span style={{fontSize: '13px', lineHeight: '1.3'}}>Reactivo al volumen de voz</span>
            </label>
          </div>
          
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label" style={{color: 'var(--text-low)'}}>Animación en Reposo</label>
            <select className="text-input" value={idleAnimation} onChange={e => setIdleAnimation(e.target.value)}>
              <option value="none">Estático</option>
              <option value="breath">Respiración</option>
              <option value="sway">Balanceo</option>
              <option value="float">Flotación</option>
            </select>
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '12px'}}>
              <span className="value-label">Intensidad</span>
              <span className="value-label">{idleIntensity}%</span>
            </div>
            <input type="range" className="slider" min="0" max="100" step="1" value={idleIntensity} onChange={(e) => setIdleIntensity(parseInt(e.target.value))} />
          </div>
        </div>

      </div>
    </div>
  )
}