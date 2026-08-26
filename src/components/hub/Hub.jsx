import React, { useState, useEffect } from 'react';
import './Hub.css';

export const Hub = ({
  setCurrentView,
  isConnected,
  connectToOBS,
  password, setPassword,
  serverAddress, setServerAddress,
  obsError,
  handleLogout
}) => {
  const [isExpanded, setIsExpanded] = useState(!isConnected);
  
  const isConnecting = obsError === "Conectando...";

  useEffect(() => {
    if (isConnected) setIsExpanded(false);
  }, [isConnected]);

  const handleConnectClick = (e) => {
    e.stopPropagation();
    if (!isConnected && !isConnecting) {
      connectToOBS();
    }
  };

  const handleDisconnectClick = (e) => {
    e.stopPropagation();
    if (isConnected) {
      handleLogout();
    }
  };

  let statusColor = "var(--error)";
  let statusText = "Desconectado";
  let statusDotClass = "status-dot error animate-pulse";
  
  if (isConnecting) {
    statusColor = "#f59e0b";
    statusText = "Conectando...";
    statusDotClass = "status-dot warning animate-pulse";
  } else if (isConnected) {
    statusColor = "var(--hub-primary)";
    statusText = "Conectado";
    statusDotClass = "status-dot success";
  }

  return (
    <div className="hub-wrapper">
      <header className="hub-header">
        <div className="hub-header-content">
          <div className="hub-logo">
            <img src="/yoshi-egg.png" alt="Yoshi Egg Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
            <span className="logo-text">YoshiTools</span>
          </div>
        </div>
      </header>
      
      <main className="hub-main">
        <section className="hub-hero">
          <div className="hero-text">
            <h1>Selecciona una herramienta</h1>
            <p>Sin consumo de recursos en tu PC.</p>
          </div>
          
          <div className="obs-widget">
            <div className="obs-widget-header" onClick={() => setIsExpanded(!isExpanded)}>
              <h3 className="obs-title">
                <span className={`material-symbols-outlined chevron ${isExpanded ? '' : 'collapsed'}`}>expand_more</span>
                Conexión OBS
              </h3>
              <div className="obs-status" style={{ color: statusColor }}>
                <span className={statusDotClass}></span>
                <span>{statusText}</span>
              </div>
            </div>
            
            <div className={`obs-widget-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
              <div className="obs-inputs">
                <input
                  type="text"
                  value={serverAddress}
                  onChange={e => setServerAddress(e.target.value)}
                  placeholder="localhost:4455"
                  readOnly={isConnected || isConnecting}
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  readOnly={isConnected || isConnecting}
                  onKeyDown={(e) => e.key === 'Enter' && !isConnected && !isConnecting && connectToOBS()}
                />
                {isConnected ? (
                  <button className="btn-squishy btn-disconnect" onClick={handleDisconnectClick}>
                    Desconectar
                  </button>
                ) : (
                  <button 
                    className={`btn-squishy ${isConnecting ? 'btn-disabled' : 'btn-connect'}`} 
                    onClick={handleConnectClick}
                    disabled={isConnecting}
                  >
                    {isConnecting ? "..." : "Ir"}
                  </button>
                )}
              </div>
              {obsError && !isConnecting && <p style={{color: 'var(--error)', fontSize: '12px', marginTop: '8px'}}>{obsError}</p>}
            </div>
          </div>
        </section>
        
        <section className="hub-grid-bento">
          <div className="bento-card" onClick={() => setCurrentView('pngtuber')}>
            <div className="card-icon icon-yellow">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>mic</span>
            </div>
            <h2>PNGTuber</h2>
            <p>Calibra tu micrófono y ajusta los estados de tu avatar reactivo.</p>
            <button className="btn-squishy btn-outline">Abrir Editor</button>
          </div>
          
          <div className="bento-card" onClick={() => setCurrentView('chat')}>
            <div className="card-icon icon-green">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>chat</span>
            </div>
            <h2>Chat Overlay</h2>
            <p>Personaliza el estilo visual, las fuentes y las alertas del chat.</p>
            <button className="btn-squishy btn-outline">Personalizar Chat</button>
          </div>
          
          <div className="bento-card disabled">
            <div className="card-header-flex">
              <div className="card-icon icon-red">
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>notifications_active</span>
              </div>
              <span className="badge-soon">PRÓXIMAMENTE</span>
            </div>
            <h2>Alertas</h2>
            <p>Pop-ups para nuevos seguidores y suscripciones.</p>
          </div>
        </section>
      </main>
    </div>
  );
};
