import React, { useState } from 'react';

export function EditorHeader({
  currentView, setCurrentView,
  avatarLinkGenerated, chatLinkGenerated,
  twitchInput, isConnected, serverAddress, 
  setServerAddress, password, setPassword, 
  connectToOBS, handleLogout, obsError
}) {
  const [isHeaderObsExpanded, setIsHeaderObsExpanded] = useState(false);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);

  const handleCopyUrl = () => {
    const link = currentView === 'pngtuber' ? avatarLinkGenerated : chatLinkGenerated;
    
    // Guardamos el usuario de Twitch en memoria si estamos en el chat
    if (currentView === 'chat') {
      localStorage.setItem('obs-pngtuber-twitch', twitchInput);
    }
    
    navigator.clipboard.writeText(link);
    setShowCopiedAlert(true);
    setTimeout(() => setShowCopiedAlert(false), 2500);
  };

  return (
    <header className="editor-header">
      <div className="header-left">
        <button className="btn-back" onClick={() => setCurrentView('hub')}>
          <span className="material-symbols-outlined">chevron_left</span> Volver
        </button>
        <h1 className="editor-title">
          {currentView === 'pngtuber' ? 'Configuración PNGTuber' : 'Configuración Chat'}
        </h1>
      </div>
      
      <div className="header-right">
        <div className="url-copy-wrapper" onMouseLeave={() => setShowCopiedAlert(false)}>
          <button className="btn-link-copy" onClick={handleCopyUrl} title="Copiar URL para OBS">
            <span className="material-symbols-outlined">link</span>
          </button>
          {showCopiedAlert && <span className="tooltip-copied">¡URL Copiada!</span>}
        </div>

        <div className="compact-obs-widget">
          <div className="compact-obs-header" onClick={() => setIsHeaderObsExpanded(!isHeaderObsExpanded)}>
            <span className={`status-dot ${isConnected ? 'success' : 'error animate-pulse'}`}></span>
            <span>{isConnected ? 'Conectado' : 'OBS Desconectado'}</span>
            <span className={`material-symbols-outlined chevron ${isHeaderObsExpanded ? '' : 'collapsed'}`}>expand_more</span>
          </div>
          
          {isHeaderObsExpanded && (
            <div className="compact-obs-dropdown">
              <input 
                type="text" value={serverAddress} onChange={(e) => setServerAddress(e.target.value)} 
                placeholder="localhost:4455" readOnly={isConnected} 
              />
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} 
                placeholder="Contraseña" readOnly={isConnected} 
                onKeyDown={(e) => e.key === 'Enter' && !isConnected && connectToOBS()} 
              />
              {isConnected ? (
                <button className="btn-squishy btn-disconnect" onClick={handleLogout}>Desconectar</button>
              ) : (
                <button className="btn-squishy btn-connect" onClick={connectToOBS}>Guardar</button>
              )}
              {obsError && <p className="obs-error-text">{obsError}</p>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}