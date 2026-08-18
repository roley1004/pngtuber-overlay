import { useState } from 'react'

export function SettingsPanel({
  isConnected,
  isOverlayMode,
  password,
  setPassword,
  twitchInput,
  setTwitchInput,
  handleGenerateURL,
  generatedLink,
  connectToOBS,
  showHUD,
  setShowHUD,
  hudTimeout,
  isSelectOpen,
  setIsSelectOpen,
  selectedMic,
  setSelectedMic,
  availableMics,
  sensitivity,
  setSensitivity,
  handleImageUpload,
  handleLogout
}) {
  const [activeTab, setActiveTab] = useState('pngtuber') // 'pngtuber' | 'chat'

  if (isOverlayMode) return null

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(generatedLink)
  }

  const probarEnNuevaPestana = () => {
    window.open(generatedLink, '_blank')
  }

  return (
    <>
      {/* PASO 1: Inicio de Sesión con Contraseña WebSocket */}
      {!isConnected && (
        <div className="setup-panel">
          <h2>Iniciar Sesión en OBS</h2>
          <p style={{fontSize: '12px', color: '#ccc', marginBottom: '15px'}}>
            Ingresa la contraseña del WebSocket de OBS para comenzar.
          </p>
          <label style={{textAlign: 'left', display: 'block', fontSize: '12px', color: '#ccc'}}>
            Contraseña de WebSocket
          </label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Tu contraseña de OBS"
          />
          <button 
            onClick={connectToOBS} 
            style={{marginTop: '15px', background: '#28a745', width: '100%', padding: '10px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
          >
            Conectar y Configurar
          </button>
        </div>
      )}

      {/* PASO 2: Panel de Configuración Organizativo */}
      {isConnected && (
        <div 
          className={`quick-settings ${showHUD ? 'visible' : ''}`}
          onMouseEnter={() => clearTimeout(hudTimeout.current)} 
          onMouseLeave={() => { if(!isSelectOpen) setShowHUD(false) }} 
        >
          {/* Botón superior para Generar Enlace */}
          <div style={{marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '15px'}}>
            <button 
              onClick={handleGenerateURL} 
              style={{width: '100%', background: '#28a745', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}
            >
              <span style={{fontSize: '16px'}}>🔗</span> Generar URL para OBS
            </button>

            {generatedLink && (
              <div style={{marginTop: '10px'}}>
                <div style={{background: '#111', padding: '10px', borderRadius: '6px', fontSize: '11px', wordBreak: 'break-all', border: '1px solid #28a745'}}>
                  <p style={{color: '#28a745', margin: '0 0 5px 0', fontWeight: 'bold'}}>¡URL Segura Generada!</p>
                  <strong>{generatedLink}</strong>
                </div>
                <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                  <button 
                    onClick={copiarAlPortapapeles} 
                    style={{flex: 1, background: '#17a2b8', color: 'white', padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px'}}
                  >
                    Copiar enlace
                  </button>
                  <button 
                    onClick={probarEnNuevaPestana} 
                    style={{flex: 1, background: '#28a745', color: 'white', padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px'}}
                  >
                    Probar en pestaña
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navegación por pestañas */}
          <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
            <button 
              onClick={() => setActiveTab('pngtuber')}
              style={{
                flex: 1, 
                padding: '8px', 
                background: activeTab === 'pngtuber' ? '#007bff' : '#222', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              Ajustes PNGTuber
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1, 
                padding: '8px', 
                background: activeTab === 'chat' ? '#6f42c1' : '#222', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              Chat de Twitch
            </button>
          </div>

          {/* Pestaña: Configuración PNGTuber */}
          {activeTab === 'pngtuber' && (
            <>
              <div className="input-group">
                <label className="title">Micrófono</label>
                <div className="custom-select-container">
                  <div className="custom-select-trigger" onClick={(e) => { e.stopPropagation(); setIsSelectOpen(!isSelectOpen); }}>
                    {selectedMic || "Detectando fuentes..."}
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

              <div className="input-group">
                <label className="title">Sensibilidad</label>
                <input type="range" min="0.001" max="0.05" step="0.001" value={sensitivity} onChange={(e) => setSensitivity(parseFloat(e.target.value))} />
              </div>

              <div className="input-group">
                <label className="title">Imágenes del PNGTuber</label>
                <div className="file-row"><label>Idle</label><input type="file" accept="image/*" onChange={(e) => handleImageUpload('idle', e)} /></div>
                <div className="file-row"><label>Hablando</label><input type="file" accept="image/*" onChange={(e) => handleImageUpload('talk', e)} /></div>
                <div className="file-row"><label>Parpadeo</label><input type="file" accept="image/*" onChange={(e) => handleImageUpload('blink', e)} /></div>
                <div className="file-row"><label>Ambos</label><input type="file" accept="image/*" onChange={(e) => handleImageUpload('talkBlink', e)} /></div>
              </div>
            </>
          )}

          {/* Pestaña: Configuración de Chat */}
          {activeTab === 'chat' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <div className="input-group">
                <label className="title" style={{marginBottom: '5px', display: 'block'}}>Canal de Twitch</label>
                <p style={{fontSize: '11px', color: '#ccc', margin: '0 0 10px 0'}}>
                  Ingresa tu usuario de Twitch y luego presiona el botón verde de arriba para generar tu URL encriptada.
                </p>
                <input 
                  type="text" 
                  value={twitchInput} 
                  onChange={(e) => setTwitchInput(e.target.value)} 
                  placeholder="Ej: mi_canal"
                  style={{width: '100%', padding: '8px', background: '#222', border: '1px solid #444', color: 'white', borderRadius: '4px'}}
                />
              </div>
            </div>
          )}

          <button onClick={handleLogout} style={{marginTop: '15px', background: '#dc3545', width: '100%', padding: '10px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
            Cerrar Sesión
          </button>
        </div>
      )}
    </>
  )
}