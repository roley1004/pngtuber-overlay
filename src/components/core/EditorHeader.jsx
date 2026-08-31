import React, { useState } from 'react';

export function EditorHeader({
  currentView, setCurrentView,
  avatarLinkGenerated, chatLinkGenerated,
  twitchInput, isConnected, serverAddress, 
  setServerAddress, password, setPassword, 
  connectToOBS, handleLogout, obsError,
  presets = [],
  theme, toggleTheme
}) {
  const [isHeaderObsExpanded, setIsHeaderObsExpanded] = useState(false);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);

  // Sistema de checklist para habilitar el Dock
  const hasAvatars = presets && presets.length > 0;
  const isDockReady = hasAvatars;

  const handleCopyUrl = () => {
    const link = currentView === 'pngtuber' ? avatarLinkGenerated : chatLinkGenerated;
    
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
        {/* Botón conmutador para alternar entre tema Claro y Oscuro */}
        <button 
          className="icon-btn theme-toggle-btn" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          <span className="material-symbols-outlined">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* 1. Botón Circular de Copiado (Expandible a la izquierda) */}
        <div className="url-copy-wrapper" onMouseLeave={() => setShowCopiedAlert(false)}>
          <button 
            className={`btn-link-copy ${showCopiedAlert ? 'copied' : ''}`} 
            onClick={handleCopyUrl} 
          >
            <span className="copy-text">
              {showCopiedAlert ? '¡URL Copiada!' : (currentView === 'pngtuber' ? 'Copiar URL de Avatar' : 'Copiar URL de Chat')}
            </span>
            <div className="icon-circle">
              <span className="material-symbols-outlined">link</span>
            </div>
          </button>
        </div>

        {/* 2. Botón Indicador de Estado del Dock para OBS */}
        <div className="dock-status-wrapper">
          {isDockReady ? (
            <button 
              className="btn-dock-status ready"
              onClick={() => setCurrentView('dock-simulator')}
              title="Abrir simulador del Panel de OBS"
            >
              <span className="material-symbols-outlined icon">widgets</span>
              <span>Panel OBS: Listo</span>
            </button>
          ) : (
            <button 
              className="btn-dock-status pending" 
              disabled
              title="Crea al menos 1 modelo de avatar para activar tu Panel de OBS"
            >
              <span className="material-symbols-outlined icon">lock</span>
              <span>Panel OBS: En espera</span>
            </button>
          )}
        </div>

        {/* 3. Panel Compacto de OBS */}
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