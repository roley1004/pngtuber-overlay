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
  if (isOverlayMode) return null

  return (
    <>
      {!isConnected && (
        <div className="setup-panel">
          <h2>Configuración Inicial</h2>
          <label style={{textAlign: 'left', display: 'block', fontSize: '12px', color: '#ccc'}}>1. Contraseña de OBS</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          
          <label style={{textAlign: 'left', display: 'block', fontSize: '12px', color: '#ccc', marginTop: '10px'}}>2. Tu Canal de Twitch</label>
          <input type="text" value={twitchInput} onChange={(e) => setTwitchInput(e.target.value)} />
          
          <button onClick={handleGenerateURL} style={{marginTop: '15px'}}>Generar Link para OBS</button>
          
          {generatedLink && (
            <div style={{marginTop: '15px', background: '#111', padding: '10px', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all', border: '1px solid #007bff'}}>
              <p style={{color: '#00a8ff', margin: '0 0 5px 0', fontWeight: 'bold'}}>¡Link Generado!</p>
              <strong>{generatedLink}</strong>
            </div>
          )}
          <button onClick={connectToOBS} style={{marginTop: '15px', background: '#28a745'}}>Probar conexión aquí</button>
        </div>
      )}

      <div 
        className={`quick-settings ${showHUD && isConnected ? 'visible' : ''}`}
        onMouseEnter={() => clearTimeout(hudTimeout.current)} 
        onMouseLeave={() => { if(!isSelectOpen) setShowHUD(false) }} 
      >
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
          <label className="title">Imágenes</label>
          <div className="file-row"><label>Idle</label><input type="file" accept="image/*" onChange={(e) => handleImageUpload('idle', e)} /></div>
          <div className="file-row"><label>Hablando</label><input type="file" accept="image/*" onChange={(e) => handleImageUpload('talk', e)} /></div>
          <div className="file-row"><label>Parpadeo</label><input type="file" accept="image/*" onChange={(e) => handleImageUpload('blink', e)} /></div>
          <div className="file-row"><label>Ambos</label><input type="file" accept="image/*" onChange={(e) => handleImageUpload('talkBlink', e)} /></div>
        </div>

        <button onClick={handleLogout} style={{marginTop: '10px', background: '#dc3545', width: '100%', padding: '10px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}>
          Desconectar y Editar
        </button>
      </div>
    </>
  )
}