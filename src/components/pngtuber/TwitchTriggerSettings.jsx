import React, { useState, useEffect } from 'react';

export function TwitchTriggerSettings({
  activePresetId,
  activePreset,
  presets = [],
  updatePresetTrigger
}) {
  // Guarda el texto del subcomando introducido por el usuario (ej: "normal")
  const [localSubCmd, setLocalSubCmd] = useState('');
  // Bloquea el campo de texto cuando el comando ya fue verificado y guardado
  const [isCmdLocked, setIsCmdLocked] = useState(false);
  // Mensaje de error si el campo está vacío o el comando ya pertenece a otro avatar
  const [cmdError, setCmdError] = useState('');

  // Sincroniza el campo local cada vez que el usuario cambia de avatar seleccionado
  useEffect(() => {
    const fullCmd = activePreset?.disparadores?.twitchCommand || '';
    const sub = fullCmd.replace(/^!avatar\s*/i, '');
    setLocalSubCmd(sub);
    setIsCmdLocked(Boolean(fullCmd.trim()));
    setCmdError('');
  }, [activePresetId, activePreset?.disparadores?.twitchCommand]);

  // Valida el formato del subcomando y evita que dos avatares usen la misma palabra
  const handleConfirmCommand = () => {
    if (isCmdLocked) {
      setIsCmdLocked(false);
      setCmdError('');
      return;
    }

    const trimmed = localSubCmd.trim().replace(/\s+/g, '');
    if (!trimmed) {
      setCmdError('Escribe un comando válido.');
      return;
    }

    const fullCmd = `!avatar ${trimmed}`;
    const isDuplicate = presets.some(p => 
      p.id !== activePresetId && 
      p.disparadores?.twitchCommand?.trim().toLowerCase() === fullCmd.toLowerCase()
    );

    if (isDuplicate) {
      const dupPreset = presets.find(p => p.id !== activePresetId && p.disparadores?.twitchCommand?.trim().toLowerCase() === fullCmd.toLowerCase());
      setCmdError(`Comando en uso por "${dupPreset?.nombre || 'otro avatar'}".`);
      return;
    }

    updatePresetTrigger(activePresetId, 'twitchCommand', fullCmd);
    setIsCmdLocked(true);
    setCmdError('');
  };

  // Desvincula el comando de Twitch del avatar activo
  const handleClearCommand = () => {
    setLocalSubCmd('');
    updatePresetTrigger(activePresetId, 'twitchCommand', '');
    setIsCmdLocked(false);
    setCmdError('');
  };

  return (
    <div className="settings-section">
      <details style={{ width: '100%' }}>
        <summary style={{ cursor: 'pointer', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-main)' }}>bolt</span>
          Accionador en Chat (Twitch)
        </summary>
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="input-group">
            <label className="input-label">Nombre de comando "!"</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: '#f2f4f2',
                border: '1px solid #e1e3e1',
                borderRadius: 'var(--radius-input)',
                padding: '8px 12px',
                fontWeight: '700',
                color: 'var(--text-main)',
                fontSize: '14px',
                userSelect: 'none'
              }}>
                !avatar
              </span>
              <input
                type="text"
                className="text-input"
                placeholder="normal"
                value={localSubCmd}
                disabled={isCmdLocked}
                onChange={(e) => {
                  setLocalSubCmd(e.target.value.replace(/\s+/g, ''));
                  setCmdError('');
                }}
                style={{
                  flex: 1,
                  backgroundColor: isCmdLocked ? '#f2f4f2' : '#ffffff',
                  color: isCmdLocked ? '#666666' : 'var(--text-main)',
                  cursor: isCmdLocked ? 'not-allowed' : 'text'
                }}
              />
              <button
                onClick={handleConfirmCommand}
                className="btn-tongue-effect"
                title={isCmdLocked ? "Editar comando" : "Confirmar comando"}
                style={{
                  backgroundColor: isCmdLocked ? '#ff9800' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-input)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isCmdLocked ? '✏️' : '✔️'}
              </button>
              {activePreset?.disparadores?.twitchCommand && (
                <button
                  onClick={handleClearCommand}
                  className="btn-tongue-effect"
                  title="Borrar comando de Twitch"
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
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                </button>
              )}
            </div>
            {cmdError && <p className="error-text" style={{ marginTop: '4px', textAlign: 'left' }}>⚠️ {cmdError}</p>}
            {isCmdLocked && localSubCmd && !cmdError && (
              <span style={{ fontSize: '12px', color: '#4caf50', fontWeight: 'bold', marginTop: '2px' }}>
                ✓ Comando activo: !avatar {localSubCmd}
              </span>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}