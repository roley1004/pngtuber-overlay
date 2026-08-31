import React, { useState } from 'react';

// Panel de configuración para personalizar la apariencia, comportamiento y filtros del chat de Twitch
export function ChatSettings({ twitchInput, setTwitchInput, config, setConfig, defaultConfig, chatPreview }) {
  // Estados locales para la lista negra, pestañas del editor y control del canal
  const [newBlacklistWord, setNewBlacklistWord] = useState('');
  const [activeTab, setActiveTab] = useState('html');
  const [isChannelLocked, setIsChannelLocked] = useState(!!twitchInput);
  const [previewMode, setPreviewMode] = useState('test');
  const [clearTrigger, setClearTrigger] = useState(0);

  // Funciones auxiliares para actualizar la configuración global de forma limpia
  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));
  const updateNestedConfig = (parent, key, value) => setConfig(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));

  // Cambia el tema visual del chat y asigna automáticamente una fuente tipográfica recomendada
  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    let newFont = 'Inter, sans-serif';
    if (newTheme === 'clean') newFont = "'Baloo 2', cursive";
    if (newTheme === 'neon') newFont = "'Orbitron', sans-serif";
    if (newTheme === 'pixel') newFont = "'Press Start 2P', cursive";
    
    setConfig(prev => ({ ...prev, theme: newTheme, fontFamily: newFont }));
  };

  // Agrega un usuario a la lista negra para ocultar sus mensajes al presionar Enter
  const handleAddBlacklist = (e) => {
    if (e.key === 'Enter' && newBlacklistWord.trim()) {
      updateConfig('blacklist', [...config.blacklist, newBlacklistWord.trim()]);
      setNewBlacklistWord('');
    }
  };
  
  // Elimina un usuario de la lista negra por su índice
  const removeBlacklist = (index) => {
    const updated = [...config.blacklist];
    updated.splice(index, 1);
    updateConfig('blacklist', updated);
  };

  return (
    <div className="chat-layout-wrapper">
      <div className="chat-top-row">
        
        {/* Columna Izquierda: Opciones Principales de Apariencia */}
        <div className="chat-settings-col">
          
          {/* Configuración del Canal de Twitch */}
          <div className="inline-input-group">
            <label className="input-label">Canal Twitch</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="text" 
                  className="text-input" 
                  value={twitchInput} 
                  onChange={(e) => setTwitchInput(e.target.value)} 
                  placeholder="ej. el_gran_streamer" 
                  disabled={isChannelLocked}
                  style={{ 
                    backgroundColor: isChannelLocked ? '#e0e0e0' : '#fff', 
                    color: isChannelLocked ? '#666' : '#000',
                    cursor: isChannelLocked ? 'not-allowed' : 'text'
                  }}
                />
                <button
                  className="icon-btn"
                  onClick={() => setIsChannelLocked(!isChannelLocked)}
                  title={isChannelLocked ? "Editar Canal" : "Confirmar Canal"}
                  style={{
                    backgroundColor: isChannelLocked ? '#ff9800' : '#4caf50',
                    color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {isChannelLocked ? '✏️' : '✔️'}
                </button>
              </div>
              {isChannelLocked && twitchInput && (
                <span style={{ fontSize: '12px', color: '#4caf50', fontWeight: 'bold' }}>
                  ✓ Chat habilitado para {twitchInput}
                </span>
              )}
            </div>
          </div>

          {/* Selección de Tema Visual */}
          <div className="inline-input-group">
            <label className="input-label">Tema</label>
            <select className="text-input" value={config.theme} onChange={handleThemeChange}>
              <option value="default">Clásico</option>
              <option value="clean">Burbujas Limpias</option>
              <option value="neon">Cyber Neon</option>
              <option value="pixel">8-Bit Retro</option>
            </select>
          </div>

          {/* Selección de Tipografía */}
          <div className="inline-input-group">
            <label className="input-label">Fuente</label>
            <select className="text-input" value={config.fontFamily} onChange={e => updateConfig('fontFamily', e.target.value)}>
              <option value="Inter, sans-serif">Inter (Moderno)</option>
              <option value="'Baloo 2', cursive">Baloo 2 (Redondeada)</option>
              <option value="'Orbitron', sans-serif">Orbitron (Futurista)</option>
              <option value="'Press Start 2P', cursive">Press Start 2P (8-Bit)</option>
            </select>
          </div>

          {/* Tamaño de la Fuente */}
          <div className="inline-input-group">
            <label className="input-label">Tamaño de la fuente</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="number" className="number-input" value={config.fontSize} onChange={e => updateConfig('fontSize', Number(e.target.value))} />
              <span className="value-label">px</span>
            </div>
          </div>

          {/* Color de Fondo para la Previsualización */}
          <div className="inline-input-group align-top">
            <label className="input-label">Color de fondo</label>
            <div>
              <div className="color-picker-wrapper">
                <span className="hex-label">{config.previewBg.toUpperCase()}</span>
                <input type="color" className="color-input" value={config.previewBg} onChange={e => updateConfig('previewBg', e.target.value)} />
              </div>
              <p className="simulate-hint" style={{ margin: '4px 0 0 0', lineHeight: 1.3 }}>Nota: Este color es de vista previa.<br/>No se visualizará en el stream.</p>
            </div>
          </div>

          {/* Color del Texto Principal */}
          <div className="inline-input-group">
            <label className="input-label">Color del texto</label>
            <div className="color-picker-wrapper">
              <span className="hex-label">{config.textColor.toUpperCase()}</span>
              <input type="color" className="color-input" value={config.textColor} onChange={e => updateConfig('textColor', e.target.value)} />
            </div>
          </div>

          {/* Interruptores para Visibilidad de Insignias y Emotes de Terceros */}
          <div className="grid-2-col" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '8px' }}>Icons / Insignias</h4>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.badges.platform} onChange={e => updateNestedConfig('badges', 'platform', e.target.checked)} />
                <span className="custom-checkbox"></span> Mostrar plataforma del viewer
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.badges.mod} onChange={e => updateNestedConfig('badges', 'mod', e.target.checked)} />
                <span className="custom-checkbox"></span> Mostrar Insignia Moderador
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.badges.vip} onChange={e => updateNestedConfig('badges', 'vip', e.target.checked)} />
                <span className="custom-checkbox"></span> Mostrar Insignia VIP
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.badges.sub} onChange={e => updateNestedConfig('badges', 'sub', e.target.checked)} />
                <span className="custom-checkbox"></span> Mostrar Insignia Suscriptor
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.badges.turbo} onChange={e => updateNestedConfig('badges', 'turbo', e.target.checked)} />
                <span className="custom-checkbox"></span> Mostrar Insignia Turbo
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.badges.prime} onChange={e => updateNestedConfig('badges', 'prime', e.target.checked)} />
                <span className="custom-checkbox"></span> Mostrar Insignia Twitch Prime
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.badges.bits} onChange={e => updateNestedConfig('badges', 'bits', e.target.checked)} />
                <span className="custom-checkbox"></span> Mostrar Insignia Bits
              </label>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 className="section-title" style={{ fontSize: '16px', marginBottom: '8px' }}>Emotes extra</h4>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.emotes.bttv} onChange={e => updateNestedConfig('emotes', 'bttv', e.target.checked)} />
                <span className="custom-checkbox"></span> Habilitar BetterTTV
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.emotes.ffz} onChange={e => updateNestedConfig('emotes', 'ffz', e.target.checked)} />
                <span className="custom-checkbox"></span> Habilitar FrankerFaceZ
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.emotes.seventv} onChange={e => updateNestedConfig('emotes', 'seventv', e.target.checked)} />
                <span className="custom-checkbox"></span> Habilitar 7TV
              </label>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Previsualización en Vivo del Chat */}
        <div className="chat-preview-col" style={{ backgroundColor: config.previewBg, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', backgroundColor: '#333', borderRadius: '6px', overflow: 'hidden' }}>
              <button 
                onClick={() => setPreviewMode('test')}
                style={{ padding: '6px 12px', border: 'none', backgroundColor: previewMode === 'test' ? '#4caf50' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: previewMode === 'test' ? 'bold' : 'normal' }}
              >Prueba</button>
              <button 
                onClick={() => setPreviewMode('live')}
                style={{ padding: '6px 12px', border: 'none', backgroundColor: previewMode === 'live' ? '#4caf50' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: previewMode === 'live' ? 'bold' : 'normal' }}
              >Chat del Canal</button>
            </div>
            
            {previewMode === 'live' && (
              <button 
                onClick={() => setClearTrigger(prev => prev + 1)}
                style={{ padding: '6px 12px', border: 'none', backgroundColor: '#f44336', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >🗑️ Limpiar Chat</button>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {React.cloneElement(chatPreview, { previewMode, clearTrigger })}
          </div>
        </div>
      </div>

      {/* Secciones Inferiores: Comportamiento, Filtros y Código Personalizado */}
      <div className="chat-bottom-row">
        <div className="grid-2-col">
          
          {/* Configuración de Comportamiento del Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 className="section-title">Comportamiento</h3>
            
            <div className="inline-input-group" style={{ marginTop: '8px' }}>
              <label className="input-label">Despliegue de Mensajes</label>
              <select className="text-input" value={config.direction || 'bottom-up'} onChange={e => updateConfig('direction', e.target.value)}>
                <option value="bottom-up">Abajo para Arriba (Por Defecto)</option>
                <option value="top-down">Arriba para Abajo</option>
              </select>
            </div>

            <div className="inline-input-group" style={{ marginTop: '8px' }}>
              <label className="input-label">Ocultar mensaje después de</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" className="number-input" value={config.fadeOut} onChange={e => updateConfig('fadeOut', Number(e.target.value))} disabled={config.fadeOut === 0} min="1" />
                <span className="value-label">seg</span>
              </div>
            </div>
            <label className="checkbox-label" style={{ marginLeft: '180px' }}>
              <input type="checkbox" checked={config.fadeOut === 0} onChange={e => updateConfig('fadeOut', e.target.checked ? 0 : 7)} />
              <span className="custom-checkbox"></span> Siempre mostrar
            </label>
          </div>

          {/* Filtros de Ocultación de Bots, Comandos y Usuarios (Blacklist) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 className="section-title">Ocultar Usuarios</h3>
            <label className="checkbox-label" style={{ marginTop: '8px' }}>
              <input type="checkbox" checked={config.hideBots} onChange={e => updateConfig('hideBots', e.target.checked)} />
              <span className="custom-checkbox"></span> Esconder Chat Bots comunes
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={config.hideCommands} onChange={e => updateConfig('hideCommands', e.target.checked)} />
              <span className="custom-checkbox"></span> Esconder comandos que inicien con "!"
            </label>
            
            <div className="inline-input-group" style={{ marginTop: '12px', justifyContent: 'flex-start' }}>
              <label className="input-label" style={{ width: 'auto', marginRight: '16px' }}>Esconder por username</label>
              <input type="text" className="text-input" style={{ width: '180px' }} placeholder="Escribir Username" value={newBlacklistWord} onChange={e => setNewBlacklistWord(e.target.value)} onKeyDown={handleAddBlacklist} />
            </div>
            
            <div className="pills-container" style={{ marginLeft: '175px' }}>
              {config.blacklist.map((word, i) => (
                <span key={i} className="pill">
                  {word} <button className="pill-close" onClick={() => removeBlacklist(i)}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Editor de Código HTML/CSS Avanzado */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <h3 className="section-title">Habilitar HTML/CSS personalizado</h3>
            <label className="toggle-switch">
              <input type="checkbox" checked={config.isAdvanced} onChange={e => updateConfig('isAdvanced', e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
            {config.isAdvanced && (
              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px', margin: 0, width: 'auto' }} onClick={() => setConfig(prev => ({ ...prev, customHTML: defaultConfig.customHTML, customCSS: defaultConfig.customCSS }))}>
                Restaurar original
              </button>
            )}
          </div>

          {config.isAdvanced && (
            <div className="code-editor">
              <div className="tabs">
                <button className={`tab ${activeTab === 'html' ? 'active' : ''}`} onClick={() => setActiveTab('html')}>HTML</button>
                <button className={`tab ${activeTab === 'css' ? 'active' : ''}`} onClick={() => setActiveTab('css')}>CSS</button>
                <button className={`tab ${activeTab === 'js' ? 'active' : ''}`} onClick={() => setActiveTab('js')}>JS</button>
              </div>
              <textarea 
                className="code-textarea" spellCheck="false"
                value={activeTab === 'html' ? config.customHTML : (activeTab === 'css' ? config.customCSS : '// JS Próximamente')} 
                onChange={e => {
                  if (activeTab === 'html') updateConfig('customHTML', e.target.value);
                  if (activeTab === 'css') updateConfig('customCSS', e.target.value);
                }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}