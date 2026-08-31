import React from 'react';

export function ImageUploaders({
  images = {},
  handleImageUpload,
  handleClearImage,
  fileError
}) {
  // Renderiza cada tarjeta individual para seleccionar o borrar una imagen
  const renderImageCard = (label, stateKey, image) => (
    <div className="upload-card" key={stateKey} style={{ position: 'relative' }}>
      <label style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <input 
          type="file" 
          accept="image/*" 
          hidden 
          onChange={(e) => handleImageUpload(stateKey, e)} 
        />
        {image ? (
          <img src={image} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <span>{label}</span>
        )}
      </label>
      
      {/* Botón flotante para eliminar la imagen del estado activo */}
      {image && (
        <button 
          onClick={(e) => handleClearImage(stateKey, e)}
          style={{ 
            position: 'absolute', 
            top: '6px', 
            right: '6px', 
            background: 'var(--alert)', 
            color: 'var(--text-main)', 
            border: 'none', 
            borderRadius: '50%', 
            width: '24px', 
            height: '24px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '12px', 
            fontWeight: 'bold' 
          }}
          title="Borrar imagen"
        >
          ✕
        </button>
      )}
    </div>
  );

  return (
    <div className="settings-section">
      <h3 className="section-title">Cargar Estados</h3>
      
      {/* Rejilla de 4 tarjetas para cargar imágenes */}
      <div className="upload-grid">
        {renderImageCard("Reposo", "idle", images.idle)}
        {renderImageCard("Parpadeo", "blink", images.blink)}
        {renderImageCard("Hablar", "talk", images.talk)}
        {renderImageCard("Hablar + Parpadeo", "talkBlink", images.talkBlink)}
      </div>

      {/* Muestra mensaje de error si el archivo subido excede el tamaño o formato */}
      {fileError && <p className="error-text">⚠️ {fileError}</p>}
    </div>
  );
}