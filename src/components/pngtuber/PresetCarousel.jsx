import React from 'react';

// Maneja la lista superior de avatares, la selección de miniaturas y las acciones del modelo activo
export function PresetCarousel({
  presets = [],
  activePresetId,
  setActivePresetId,
  activePreset,
  addPreset,
  duplicatePreset,
  deletePreset,
  updatePresetName
}) {
  return (
    <div className="settings-section" style={{ paddingBottom: '8px' }}>
      <h3 className="section-title">Modelos de Avatar</h3>
      
      {/* Lista horizontal scrolleable de avatares */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '8px 0', alignItems: 'center' }}>
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;
          return (
            <div
              key={preset.id}
              onClick={() => setActivePresetId(preset.id)}
              className="btn-tongue-effect"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                minWidth: '64px'
              }}
            >
              {/* Círculo de vista previa de la imagen de reposo */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: isActive ? '3px solid var(--primary)' : '2px solid #e1e3e1',
                  overflow: 'hidden',
                  background: 'var(--bg-base)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isActive ? 'var(--shadow-hover)' : 'none'
                }}
              >
                {preset.imagenes?.idle ? (
                  <img src={preset.imagenes.idle} alt={preset.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span className="material-symbols-outlined" style={{ color: 'var(--text-main)' }}>person</span>
                )}
              </div>
              
              {/* Nombre recortado del avatar */}
              <span style={{ fontSize: '11px', fontWeight: isActive ? '700' : '500', color: 'var(--text-main)', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {preset.nombre}
              </span>
            </div>
          );
        })}

        {/* Botón para crear un nuevo modelo */}
        <button
          onClick={() => addPreset('Nuevo Avatar')}
          className="btn-tongue-effect"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            minWidth: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '2px dashed var(--primary)',
            background: 'transparent',
            color: 'var(--text-main)',
            cursor: 'pointer',
            marginBottom: '18px'
          }}
          title="Añadir nuevo avatar"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* Controles para cambiar nombre, duplicar o eliminar el avatar activo */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
        <input
          type="text"
          value={activePreset?.nombre || ''}
          onChange={(e) => updatePresetName(activePresetId, e.target.value)}
          placeholder="Nombre del avatar..."
          style={{
            flex: 1,
            background: '#FAFBF8',
            border: '1px solid #e1e3e1',
            borderRadius: 'var(--radius-input)',
            padding: '8px 12px',
            fontWeight: '700',
            color: 'var(--text-main)',
            outline: 'none'
          }}
        />
        
        {/* Botón Duplicar */}
        <button
          onClick={() => duplicatePreset(activePresetId)}
          className="btn-tongue-effect"
          style={{
            background: 'var(--surface)',
            border: '1px solid #e1e3e1',
            borderRadius: 'var(--radius-input)',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--text-main)'
          }}
          title="Duplicar avatar activo"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>content_copy</span>
        </button>

        {/* Botón Eliminar (solo visible si existe más de un preset) */}
        {presets.length > 1 && (
          <button
            onClick={() => {
              if (window.confirm(`¿Seguro que deseas eliminar el avatar "${activePreset?.nombre}"?`)) {
                deletePreset(activePresetId);
              }
            }}
            className="btn-tongue-effect"
            style={{
              background: 'var(--alert)',
              border: 'none',
              borderRadius: 'var(--radius-input)',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-main)'
            }}
            title="Borrar avatar activo"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
          </button>
        )}
      </div>
    </div>
  );
}