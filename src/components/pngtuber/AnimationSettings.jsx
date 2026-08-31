import React from 'react';

// Controla la frecuencia de parpadeo y los estilos de movimiento tanto en reposo como al hablar
export function AnimationSettings({
  blinkFrequency,
  setBlinkFrequency,
  isRandomBlink,
  setIsRandomBlink,
  talkAnimation,
  setTalkAnimation,
  talkIntensity,
  setTalkIntensity,
  isVoiceReactive,
  setIsVoiceReactive,
  idleAnimation,
  setIdleAnimation,
  idleIntensity,
  setIdleIntensity
}) {
  return (
    <div className="settings-section">
      <h3 className="section-title">Animación y Movimiento</h3>
      
      {/* Control de Frecuencia de Parpadeo */}
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

      {/* Selector de Animación al Hablar y en Reposo */}
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
  );
}