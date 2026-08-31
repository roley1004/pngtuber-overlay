import { useState, useEffect } from 'react';
import './OBSDock.css';

export function OBSDock({ presets, activePresetId, onSelectPreset }) {
  const [activeTab, setActiveTab] = useState('avatars');
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('obs-dock-theme');
    return savedTheme !== null ? savedTheme === 'dark' : true; 
  });

  // Detectamos si el panel se está abriendo directamente en OBS (URL tiene dock=true)
  const isStandalone = new URLSearchParams(window.location.search).get('dock') === 'true';

  useEffect(() => {
    localStorage.setItem('obs-dock-theme', isDarkMode ? 'dark' : 'light');
    
    // Cambiamos el color de fondo absoluto del body para evitar bordes blancos en OBS
    if (isDarkMode) {
      document.body.classList.add('dock-dark-theme');
      document.body.classList.remove('dock-light-theme');
    } else {
      document.body.classList.add('dock-light-theme');
      document.body.classList.remove('dock-dark-theme');
    }
  }, [isDarkMode]);

  return (
    <div className={`obs-dock-container ${isDarkMode ? 'dark-mode' : 'light-mode'} ${isStandalone ? 'standalone' : ''}`}>
      <div className="dock-header" style={{ justifyContent: 'flex-end' }}>
        <button 
          className="theme-toggle-btn"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          <span className="material-symbols-outlined">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </div>

      <div className="dock-content">
        {activeTab === 'avatars' && (
          <div className="avatar-grid">
            {presets && presets.length > 0 ? (
              presets.map((preset) => (
                <button
                  key={preset.id}
                  className={`preset-card ${activePresetId === preset.id ? 'active-preset' : ''}`}
                  onClick={() => onSelectPreset(preset.id)}
                  title={preset.nombre}
                >
                  <div className="preset-thumbnail">
                    {preset.imagenes?.idle ? (
                      <img 
                        src={preset.imagenes.idle} 
                        alt={preset.nombre} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <span className="material-symbols-outlined icon-placeholder">
                        person
                      </span>
                    )}
                  </div>
                  <span className="preset-name">{preset.nombre}</span>
                </button>
              ))
            ) : (
              <div className="empty-state">No hay modelos configurados.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}