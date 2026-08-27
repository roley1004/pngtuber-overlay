import { useEffect, useState, useCallback } from 'react';
import tmi from 'tmi.js';
import './TwitchChat.css';

// Componente blindado: Si la URL no es válida, renderiza un emoji nativo sin intentar red, evitando el error ORB.
const SafeBadge = ({ src, fallback, title }) => {
  const [hasError, setHasError] = useState(false);
  
  if (!src || hasError) {
    return <span className="badge-emoji" title={title} style={{ fontSize: '1.2em', marginRight: '4px', verticalAlign: 'middle' }}>{fallback}</span>;
  }
  
  return (
    <img 
      src={src} 
      alt={title} 
      title={title} 
      style={{ height: '1.2em', width: 'auto', verticalAlign: 'middle', marginRight: '4px' }}
      onError={() => setHasError(true)} 
    />
  );
};

export function TwitchChat({ targetChannel, isOverlayMode, config, previewMode = 'live', clearTrigger = 0 }) {
  const [messages, setMessages] = useState([]);
  const [officialBadges, setOfficialBadges] = useState({});

  const removeMessage = useCallback((id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  useEffect(() => { if (clearTrigger > 0) setMessages([]); }, [clearTrigger]);

  // 1. Descarga del catálogo oficial desde nuestra propia bóveda
  useEffect(() => {
    if (!targetChannel) return;
    
    fetch(`/api/badges?channel=${targetChannel}`)
      .then(res => {
        if (!res.ok) throw new Error('API no disponible');
        return res.json();
      })
      .then(data => {
        if (data.success && data.badges) {
          setOfficialBadges(data.badges);
        }
      })
      .catch(err => console.warn("Modo fallback activado: No se pudo cargar el catálogo de insignias.", err)); 
  }, [targetChannel]);

  // 2. Conexión limpia con tmi.js
  useEffect(() => {
    if (previewMode === 'test' && !isOverlayMode) return;
    if (!targetChannel) return;

    const client = new tmi.Client({ channels: [targetChannel] });
    client.connect().catch(console.error);

    client.on('message', (channel, tags, message) => {
      const msgId = tags.id;
      
      setMessages(prev => {
        if (prev.some(m => m.id === msgId)) return prev;

        const newMsg = {
          id: msgId,
          username: tags['display-name'] || tags.username,
          rawBadges: tags.badges || {}, // Extraemos la versión exacta (ej. { subscriber: '12' })
          color: tags.color || '#ffffff',
          message: message
        };
        return [...prev.slice(-49), newMsg];
      });

      if (config.fadeOut > 0) {
        setTimeout(() => removeMessage(msgId), (config.fadeOut + 0.5) * 1000);
      }
    });

    return () => { client.disconnect(); setMessages([]); };
  }, [targetChannel, isOverlayMode, config.fadeOut, removeMessage, previewMode]);

  // 3. Renderizado y Filtros
  const filteredMessages = messages.filter(msg => {
    if (config.hideCommands && msg.message.startsWith('!')) return false;
    if (config.hideBots && ['nightbot', 'streamelements'].some(b => msg.username.toLowerCase().includes(b))) return false;
    if (config.blacklist.some(w => msg.username.toLowerCase() === w.toLowerCase())) return false;
    return true;
  });

  const isBottomUp = config.direction !== 'top-down';
  const displayMessages = isBottomUp ? filteredMessages : [...filteredMessages].reverse();

  // Función estricta de búsqueda en el diccionario oficial
  const getBadgeUrl = (badgeType, version) => {
    return officialBadges[badgeType]?.[version] || null;
  };

  return (
    <div className="twitch-chat-container" style={{ 
      fontSize: `${config.fontSize}px`, color: config.textColor, fontFamily: config.fontFamily || 'Inter, sans-serif',
      height: isOverlayMode ? '100vh' : '100%', width: isOverlayMode ? '100vw' : '100%',
      display: 'flex', flexDirection: 'column', justifyContent: isBottomUp ? 'flex-end' : 'flex-start',
      overflow: 'hidden', gap: '4px', boxSizing: 'border-box', padding: isOverlayMode ? '10px' : '0'
    }}>
      <style>
        {`
          @keyframes forceFadeOutAnim { 0%, 80% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-5px); } }
          .chat-fade-active { animation-fill-mode: forwards !important; }
        `}
      </style>

      {displayMessages.map(msg => {
        const animStyle = (config.fadeOut > 0) ? { animation: `forceFadeOutAnim ${config.fadeOut}s forwards` } : {};

        return (
          <div key={msg.id} className={`chat-message theme-${config.theme} ${config.fadeOut > 0 ? 'chat-fade-active' : ''}`} style={animStyle}>
            <span className="chat-badges">
              {/* Iteramos dinámicamente sobre las insignias que Twitch reporta para este mensaje */}
              {Object.entries(msg.rawBadges).map(([badgeType, version]) => {
                const url = getBadgeUrl(badgeType, version);
                // Si la configuración oculta esta insignia, la ignoramos
                if (config.badges[badgeType] === false) return null; 
                
                let fallback = "🔹";
                if (badgeType === 'broadcaster') fallback = "🎥";
                if (badgeType === 'moderator') fallback = "🛡️";
                if (badgeType === 'subscriber' || badgeType === 'founder') fallback = "⭐";
                if (badgeType === 'vip') fallback = "💎";

                return <SafeBadge key={badgeType} src={url} fallback={fallback} title={badgeType} />;
              })}
            </span>
            <span className="chat-username" style={{ color: msg.color, fontWeight: 'bold', marginRight: '6px' }}>{msg.username}:</span>
            <span className="chat-text">{msg.message}</span>
          </div>
        );
      })}
    </div>
  )
}