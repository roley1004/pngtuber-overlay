import React, { useState } from 'react'

export function ChatSettings({ twitchInput, setTwitchInput, config, setConfig, defaultConfig, chatPreview }) {
  const [newBlacklistWord, setNewBlacklistWord] = useState('')
  const [activeTab, setActiveTab] = useState('html')

  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }))
  const updateNestedConfig = (parent, key, value) => setConfig(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }))

  const handleAddBlacklist = (e) => {
    if (e.key === 'Enter' && newBlacklistWord.trim()) {
      updateConfig('blacklist', [...config.blacklist, newBlacklistWord.trim()])
      setNewBlacklistWord('')
    }
  }
  
  const removeBlacklist = (index) => {
    const updated = [...config.blacklist]
    updated.splice(index, 1)
    updateConfig('blacklist', updated)
  }

  return (
    <div className="chat-layout-wrapper">
      
      {/* SECCIÓN SUPERIOR: CONFIGURACIÓN Y VISTA PREVIA FLOTANTE */}
      <div className="chat-top-row">
        
        {/* Columna Izquierda (Ajustes Visuales e Insignias) */}
        <div className="chat-settings-col">
          
          {/* Apariencia */}
          <div className="inline-input-group">
            <label className="input-label">Canal Twitch</label>
            <input type="text" className="text-input" value={twitchInput} onChange={(e) => setTwitchInput(e.target.value)} placeholder="ej. el_gran_streamer" />
          </div>

          <div className="inline-input-group">
            <label className="input-label">Tema</label>
            <select className="text-input" value={config.theme} onChange={e => updateConfig('theme', e.target.value)}>
              <option value="default">Clásico Oscuro</option>
              <option value="clean">Burbujas Limpias</option>
              <option value="neon">Cyber Neon</option>
            </select>
          </div>

          <div className="inline-input-group">
            <label className="input-label">Tamaño de la fuente</label>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <input type="number" className="number-input" value={config.fontSize} onChange={e => updateConfig('fontSize', Number(e.target.value))} />
              <span className="value-label">px</span>
            </div>
          </div>

          <div className="inline-input-group align-top">
            <label className="input-label">Color de fondo</label>
            <div>
              <div className="color-picker-wrapper">
                <span className="hex-label">{config.previewBg.toUpperCase()}</span>
                <input type="color" className="color-input" value={config.previewBg} onChange={e => updateConfig('previewBg', e.target.value)} />
              </div>
              <p className="simulate-hint" style={{margin: '4px 0 0 0', lineHeight: 1.3}}>Nota: Este color es de vista previa.<br/>No se visualizará en el stream.</p>
            </div>
          </div>

          <div className="inline-input-group">
            <label className="input-label">Color del texto</label>
            <div className="color-picker-wrapper">
              <span className="hex-label">{config.textColor.toUpperCase()}</span>
              <input type="color" className="color-input" value={config.textColor} onChange={e => updateConfig('textColor', e.target.value)} />
            </div>
          </div>

          {/* Insignias y Emotes (Grid 2 columnas) */}
          <div className="grid-2-col" style={{marginTop: '16px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <h4 className="section-title" style={{fontSize: '16px', marginBottom: '8px'}}>Icons / Insignias</h4>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.badges.platform} onChange={e => updateNestedConfig('badges', 'platform', e.target.checked)} />
                <span className="custom-checkbox"></span> Mostrar plataforma del viewer
              </label>
              <label className="checkbox-label">
                <input type="checkbox" checked={config.badges.mod} onChange={e => updateNestedConfig('badges', 'mod', e.target.checked)} />
                <span className="custom-checkbox"></span> Mostrar Insignia Moderador
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
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
              <h4 className="section-title" style={{fontSize: '16px', marginBottom: '8px'}}>Emotes extra</h4>
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

        {/* Columna Derecha (Preview del Chat interactivo) */}
        <div className="chat-preview-col" style={{ backgroundColor: config.previewBg }}>
          {chatPreview}
        </div>
      </div>

      {/* SECCIÓN INFERIOR: MODERACIÓN Y AVANZADO */}
      <div className="chat-bottom-row">
        <div className="grid-2-col">
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <h3 className="section-title">Comportamiento</h3>
            <div className="inline-input-group" style={{marginTop: '8px'}}>
              <label className="input-label">Ocultar mensaje después de</label>
              <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <input type="number" className="number-input" value={config.fadeOut} onChange={e => updateConfig('fadeOut', Number(e.target.value))} disabled={config.fadeOut === 0} min="1" />
                <span className="value-label">seg</span>
              </div>
            </div>
            <label className="checkbox-label" style={{marginLeft: '180px'}}>
              <input type="checkbox" checked={config.fadeOut === 0} onChange={e => updateConfig('fadeOut', e.target.checked ? 0 : 7)} />
              <span className="custom-checkbox"></span> Siempre mostrar
            </label>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <h3 className="section-title">Ocultar Usuarios</h3>
            <label className="checkbox-label" style={{marginTop: '8px'}}>
              <input type="checkbox" checked={config.hideBots} onChange={e => updateConfig('hideBots', e.target.checked)} />
              <span className="custom-checkbox"></span> Esconder Chat Bots comunes
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={config.hideCommands} onChange={e => updateConfig('hideCommands', e.target.checked)} />
              <span className="custom-checkbox"></span> Esconder comandos que inicien con "!"
            </label>
            
            <div className="inline-input-group" style={{marginTop: '12px', justifyContent: 'flex-start'}}>
              <label className="input-label" style={{width: 'auto', marginRight: '16px'}}>Esconder por username</label>
              <input type="text" className="text-input" style={{width: '180px'}} placeholder="Escribir Username" value={newBlacklistWord} onChange={e => setNewBlacklistWord(e.target.value)} onKeyDown={handleAddBlacklist} />
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

        {/* Habilitar HTML/CSS */}
        <div style={{marginTop: '24px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
            <h3 className="section-title">Habilitar HTML/CSS personalizado</h3>
            <label className="toggle-switch">
              <input type="checkbox" checked={config.isAdvanced} onChange={e => updateConfig('isAdvanced', e.target.checked)} />
              <span className="toggle-slider"></span>
            </label>
            {config.isAdvanced && (
              <button className="btn-outline" style={{padding: '6px 12px', fontSize: '12px', margin: 0, width: 'auto'}} onClick={() => setConfig(prev => ({...prev, customHTML: defaultConfig.customHTML, customCSS: defaultConfig.customCSS}))}>
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
                  if(activeTab === 'html') updateConfig('customHTML', e.target.value)
                  if(activeTab === 'css') updateConfig('customCSS', e.target.value)
                }}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}