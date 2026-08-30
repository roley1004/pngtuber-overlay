import React, { useState, useEffect } from 'react';

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
  images, currentVolume, fileError,
  presets = [],
  activePresetId,
  setActivePresetId,
  activePreset,
  addPreset,
  duplicatePreset,
  deletePreset,
  updatePresetName,
  updatePresetTrigger
}) {
  // Estados para control de bloqueo y validación del comando de Twitch
  const [localSubCmd, setLocalSubCmd] = useState('');
  const [isCmdLocked, setIsCmdLocked] = useState(false);
  const [cmdError, setCmdError] = useState('');

  // Sincroniza el comando local al cambiar de avatar activo
  useEffect(() => {
    const fullCmd = activePreset?.disparadores?.twitchCommand || '';
    const sub = fullCmd.replace(/^!avatar\s*/i, '');
    setLocalSubCmd(sub);
    setIsCmdLocked(Boolean(fullCmd.trim()));
    setCmdError('');
  }, [activePresetId, activePreset?.disparadores?.twitchCommand]);

  // Confirmación / Edición del comando de Twitch
  const handleConfirmCommand = () => {
    if (isCmdLocked) {
      setIsCmdLocked(false);
      setCmdError('');
      return;
    }

    const trimmed = localSubCmd.trim().replace(/\s+/g, '');
    if (!trimmed) {
      setCmdError('Escribe un comando válido.');
      return;
    }

    const fullCmd = `!avatar ${trimmed}`;
    const isDuplicate = presets.some(p => 
      p.id !== activePresetId && 
      p.disparadores?.twitchCommand?.trim().toLowerCase() === fullCmd.toLowerCase()
    );

    if (isDuplicate) {
      const dupPreset = presets.find(p => p.id !== activePresetId && p.disparadores?.twitchCommand?.trim().toLowerCase() === fullCmd.toLowerCase());
      setCmdError(`Comando en uso por "${dupPreset?.nombre || 'otro avatar'}".`);
      return;
    }

    updatePresetTrigger(activePresetId, 'twitchCommand', fullCmd);
    setIsCmdLocked(true);
    setCmdError('');
  };

  // Vaciado y desactivación del comando de Twitch
  const handleClearCommand = () => {
    setLocalSubCmd('');
    updatePresetTrigger(activePresetId, 'twitchCommand', '');
    setIsCmdLocked(false);
    setCmdError('');
  };

  const volumePercent = currentVolume; 
  const thresholdPercent = sensitivity;
  const vuColor = volumePercent >= thresholdPercent ? 'var(--text-main)' : '#c0c9bd';

  const renderImageCard = (label, stateKey, image) => (
    <div className="upload-card" key={stateKey} style={{ position: 'relative' }}>
      <label style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(stateKey, e)} />
        {image ? <img src={image} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span>{label}</span>}
      </label>
      {image && (
        <button 
          onClick={(e) => handleClearImage(stateKey, e)}
          style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--alert)', color: 'var(--text-main)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}
          title="Borrar imagen"
        >
          ✕
        </button>
      )}
    </div>
  );

  return (
    <div className="settings-module">
      {/* CARRUSEL DE PRESETS Y GESTIÓN DE MODELOS */}
      <div className="settings-section" style={{ paddingBottom: '8px' }}>
        <h3 className="section-title">Modelos de Avatar</h3>
        
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '8px 0', alignItems: 'center' }}>
          {presets.map((preset) => {
            const isActive = preset.id === activePresetId;
            return (
              <div
                key={preset.id}
                onClick={() => setActivePresetId(preset.id)}
                className="btn-tongue-effect"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  minWidth: '64px'
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    border: isActive ? '3px solid var(--primary)' : '2px solid #e1e3e1',
                    overflow: 'hidden',
                    background: 'var(--bg-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? 'var(--shadow-hover)' : 'none'
                  }}
                >
                  {preset.imagenes?.idle ? (
                    <img src={preset.imagenes.idle} alt={preset.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span className="material-symbols-outlined" style={{ color: 'var(--text-main)' }}>person</span>
                  )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: isActive ? '700' : '500', color: 'var(--text-main)', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {preset.nombre}
                </span>
              </div>
            );
          })}

          <button
            onClick={() => addPreset('Nuevo Avatar')}
            className="btn-tongue-effect"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minWidth: '52px',
              height: '52px',
              borderRadius: '50%',
              border: '2px dashed var(--primary)',
              background: 'transparent',
              color: 'var(--text-main)',
              cursor: 'pointer',
              marginBottom: '18px'
            }}
            title="Añadir nuevo avatar"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={activePreset?.nombre || ''}
            onChange={(e) => updatePresetName(activePresetId, e.target.value)}
            placeholder="Nombre del avatar..."
            style={{
              flex: 1,
              background: '#FAFBF8',
              border: '1px solid #e1e3e1',
              borderRadius: 'var(--radius-input)',
              padding: '8px 12px',
              fontWeight: '700',
              color: 'var(--text-main)',
              outline: 'none'
            }}
          />
          <button
            onClick={() => duplicatePreset(activePresetId)}
            className="btn-tongue-effect"
            style={{
              background: 'var(--surface)',
              border: '1px solid #e1e3e1',
              borderRadius: 'var(--radius-input)',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-main)'
            }}
            title="Duplicar avatar activo"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>content_copy</span>
          </button>
          {presets.length > 1 && (
            <button
              onClick={() => {
                if (window.confirm(`¿Seguro que deseas eliminar el avatar "${activePreset?.nombre}"?`)) {
                  deletePreset(activePresetId);
                }
              }}
              className="btn-tongue-effect"
              style={{
                background: 'var(--alert)',
                border: 'none',
                borderRadius: 'var(--radius-input)',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-main)'
              }}
              title="Borrar avatar activo"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
            </button>
          )}
        </div>
      </div>

      <hr className="divider" />

      {/* CARGAR ESTADOS */}
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

      {/* DISPARADORES EN VIVO (TWITCH CHAT) */}
      <div className="settings-section">
        <details style={{ width: '100%' }}>
          <summary style={{ cursor: 'pointer', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-main)' }}>bolt</span>
            Accionador en Chat (Twitch)
          </summary>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Nombre de comando "!"</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: '#f2f4f2',
                  border: '1px solid #e1e3e1',
                  borderRadius: 'var(--radius-input)',
                  padding: '8px 12px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  userSelect: 'none'
                }}>
                  !avatar
                </span>
                <input
                  type="text"
                  className="text-input"
                  placeholder="normal"
                  value={localSubCmd}
                  disabled={isCmdLocked}
                  onChange={(e) => {
                    setLocalSubCmd(e.target.value.replace(/\s+/g, ''));
                    setCmdError('');
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: isCmdLocked ? '#f2f4f2' : '#ffffff',
                    color: isCmdLocked ? '#666666' : 'var(--text-main)',
                    cursor: isCmdLocked ? 'not-allowed' : 'text'
                  }}
                />
                <button
                  onClick={handleConfirmCommand}
                  className="btn-tongue-effect"
                  title={isCmdLocked ? "Editar comando" : "Confirmar comando"}
                  style={{
                    backgroundColor: isCmdLocked ? '#ff9800' : '#4caf50',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-input)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isCmdLocked ? '✏️' : '✔️'}
                </button>
                {activePreset?.disparadores?.twitchCommand && (
                  <button
                    onClick={handleClearCommand}
                    className="btn-tongue-effect"
                    title="Borrar comando de Twitch"
                    style={{
                      background: 'var(--alert)',
                      border: 'none',
                      borderRadius: 'var(--radius-input)',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-main)'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                  </button>
                )}
              </div>
              {cmdError && <p className="error-text" style={{ marginTop: '4px', textAlign: 'left' }}>⚠️ {cmdError}</p>}
              {isCmdLocked && localSubCmd && !cmdError && (
                <span style={{ fontSize: '12px', color: '#4caf50', fontWeight: 'bold', marginTop: '2px' }}>
                  ✓ Comando activo: !avatar {localSubCmd}
                </span>
              )}
            </div>
          </div>
        </details>
      </div>

      <hr className="divider" />

      {/* CAPTURA DE AUDIO */}
      <div className="settings-section">
        <h3 className="section-title">Captura de Audio</h3>
        {!isConnected ? (
          <div className="warning-box" style={{ background: 'var(--bg-base)', padding: '15px', borderRadius: '12px', border: '1px solid var(--alert)', textAlign: 'center', color: 'var(--text-main)', fontSize: '13px', fontWeight: 'bold' }}>
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

      {/* ANIMACIÓN Y MOVIMIENTO */}
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
            <label className="input-label" style={{color: 'var(--text-main)'}}>Animación al Hablar</label>
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
            <label className="input-label" style={{color: 'var(--text-main)'}}>Animación en Reposo</label>
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
  );
}