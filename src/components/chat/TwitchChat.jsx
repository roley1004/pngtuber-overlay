import React, { useEffect, useState, useCallback, useRef } from 'react';
import tmi from 'tmi.js';
import './TwitchChat.css';
import { 
  DEFAULT_BADGES, 
  getContrastColor, 
  staticDummyMessages,
  loadThirdPartyEmotes,
  getBadgeSrc,
  renderParsedMessage,
  getCustomHtmlParsedText
} from '../../utils/chatHelpers';

// Componente pequeño que renderiza la imagen de la insignia o un emoji si ocurre un error al cargarla
const BadgeImg = ({ src, fallback, title }) => {
  const [error, setError] = useState(false);
  
  useEffect(() => {
    setError(false);
  }, [src]);
  
  if (!src || error) {
    return <span className="badge-emoji" title={title}>{fallback}</span>;
  }
  return (
    <img 
      src={src} 
      alt={title} 
      title={title} 
      className="chat-badge-img"
      onError={() => setError(true)} 
    />
  );
};

export function TwitchChat({ targetChannel, isOverlayMode, config, previewMode = 'live', clearTrigger = 0, presets = [], onSelectPreset }) {
  // Estados para manejar los datos del chat
  const [messages, setMessages] = useState([]);
  const [twitchBadges, setTwitchBadges] = useState(DEFAULT_BADGES);
  const [emotesMap, setEmotesMap] = useState({});
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  
  const chatContainerRef = useRef(null);
  const fadeOutRef = useRef(config.fadeOut);
  const presetsRef = useRef(presets);
  const onSelectPresetRef = useRef(onSelectPreset);
  const isBottomUp = config.direction !== 'top-down';

  // Sincronizamos las variables de configuración con las referencias para usarlas en los eventos de tmi sin retrasos
  useEffect(() => {
    fadeOutRef.current = config.fadeOut;
  }, [config.fadeOut]);

  useEffect(() => {
    presetsRef.current = presets;
  }, [presets]);

  useEffect(() => {
    onSelectPresetRef.current = onSelectPreset;
  }, [onSelectPreset]);

  // Función auxiliar para borrar un mensaje por su ID (útil para el desvanecimiento)
  const removeMessage = useCallback((id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  // Escucha el botón "Limpiar Chat" desde la configuración
  useEffect(() => {
    if (clearTrigger > 0) setMessages([]);
  }, [clearTrigger]);

  // Llama a la API local (Serverless) para obtener las insignias de sub específicas del canal
  useEffect(() => {
    const query = targetChannel ? `?channel=${encodeURIComponent(targetChannel.replace('#', '').trim().toLowerCase())}` : '';
    
    fetch(`/api/badges${query}`)
      .then(res => {
        if (!res.ok) throw new Error('Error al conectar con API');
        return res.json();
      })
      .then(data => {
        if (data.success && data.badges && Object.keys(data.badges).length > 0) {
          setTwitchBadges(prev => ({ ...prev, ...data.badges }));
        }
      })
      .catch(() => {}); 
  }, [targetChannel]);

  // Carga los emotes de las extensiones de navegador a través del helper importado
  useEffect(() => {
    let isMounted = true;
    
    const fetchEmotes = async () => {
      const loadedEmotes = await loadThirdPartyEmotes(targetChannel, config);
      if (isMounted) setEmotesMap(loadedEmotes);
    };

    fetchEmotes();
    return () => { isMounted = false; };
  }, [targetChannel, config.emotes?.bttv, config.emotes?.ffz, config.emotes?.seventv]);

  // Conexión principal y escucha de mensajes en Twitch
  useEffect(() => {
    if (!targetChannel) return;

    const cleanChannel = targetChannel.replace('#', '').trim().toLowerCase();
    const client = new tmi.Client({ channels: [cleanChannel] });
    client.connect().catch(console.error);

    client.on('message', (channel, tags, message) => {
      const msgId = tags.id;
      const cleanMsg = message.trim().toLowerCase();

      // Evaluación de comandos: Si quien habla es moderador o streamer, verifica si activó un preset del PNGTuber
      const currentPresets = presetsRef.current || [];
      const isBroadcasterOrMod = !!tags.badges?.broadcaster || !!tags.badges?.moderator || tags.mod;

      if (isBroadcasterOrMod && currentPresets.length > 0 && onSelectPresetRef.current) {
        const matchedPreset = currentPresets.find(p => p.disparadores?.twitchCommand && p.disparadores.twitchCommand.trim().toLowerCase() === cleanMsg);
        if (matchedPreset) {
          onSelectPresetRef.current(matchedPreset.id);
        }
      }
      
      // Construye el objeto del mensaje y lo guarda (limita la lista a los últimos 100 mensajes para evitar lag)
      setMessages(prev => {
        if (prev.some(m => m.id === msgId)) return prev;

        const newMsg = {
          id: msgId,
          username: tags['display-name'] || tags.username,
          roles: {
            platform: true,
            broadcaster: !!tags.badges?.broadcaster,
            mod: !!tags.badges?.moderator,
            subscriber: !!tags.badges?.subscriber || !!tags.badges?.founder,
            vip: !!tags.badges?.vip,
            turbo: !!tags.badges?.turbo,
            prime: !!tags.badges?.premium,
            bits: !!tags.badges?.bits
          },
          rawBadges: tags.badges || {},
          emotesTags: tags.emotes,
          color: tags.color || '#ffffff',
          message: message
        };
        return [...prev.slice(-99), newMsg];
      });

      // Si el chat está en OBS y tiene desvanecimiento activo, programa su borrado
      const currentFadeOut = fadeOutRef.current;
      if (isOverlayMode && currentFadeOut > 0) {
        setTimeout(() => removeMessage(msgId), (currentFadeOut + 0.5) * 1000);
      }
    });

    return () => { 
      client.disconnect().catch(() => {});
    };
  }, [targetChannel, isOverlayMode, removeMessage]);

  // Detiene el scroll automático si el usuario sube a leer el chat (solo funciona en el modo de previsualización)
  const handleScroll = () => {
    if (isOverlayMode) return;
    const el = chatContainerRef.current;
    if (!el) return;

    const distanceToEdge = isBottomUp 
      ? el.scrollHeight - el.scrollTop - el.clientHeight 
      : el.scrollTop;

    if (distanceToEdge > 30) {
      setIsAutoScrollPaused(true);
    } else {
      setIsAutoScrollPaused(false);
    }
  };

  // Mueve el chat hacia abajo (o arriba según la dirección) cuando llega un mensaje nuevo
  useEffect(() => {
    if (isOverlayMode || isAutoScrollPaused) return;
    const el = chatContainerRef.current;
    if (el) {
      setTimeout(() => {
        el.scrollTop = isBottomUp ? el.scrollHeight : 0;
      }, 0);
    }
  }, [messages, isBottomUp, isAutoScrollPaused, isOverlayMode]);

  // Botón para volver al mensaje más reciente si se pausó el scroll
  const scrollToNewest = () => {
    setIsAutoScrollPaused(false);
    const el = chatContainerRef.current;
    if (el) {
      el.scrollTo({
        top: isBottomUp ? el.scrollHeight : 0,
        behavior: 'smooth'
      });
    }
  };

  // Determina si usa los mensajes reales o los mensajes estáticos de prueba
  const sourceMessages = (!isOverlayMode && previewMode === 'test') ? staticDummyMessages : messages;

  // Filtra comandos u oculta a los bots de Twitch si la opción está activada
  const filteredMessages = sourceMessages.filter(msg => {
    if (config.hideCommands && msg.message.startsWith('!')) return false;
    if (config.hideBots && (msg.username.toLowerCase().includes('bot') || msg.username.toLowerCase() === 'nightbot' || msg.username.toLowerCase() === 'streamelements')) return false;
    if (config.blacklist.some(word => msg.username.toLowerCase() === word.toLowerCase())) return false;
    return true;
  });

  const displayMessages = isBottomUp ? filteredMessages : [...filteredMessages].reverse();
  const shouldFadeOut = isOverlayMode ? (config.fadeOut > 0) : false;

  const buttonTextColor = getContrastColor(config.previewBg || '#333333');
  const buttonBorderColor = buttonTextColor === '#111111' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.6)';

  return (
    <div className="twitch-chat-wrapper">
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className={`twitch-chat-container ${isOverlayMode ? 'overlay-mode' : ''}`} 
        style={{ 
          fontSize: `${config.fontSize}px`, 
          color: config.textColor, 
          fontFamily: config.fontFamily || 'Inter, sans-serif'
        }}>
        
        {config.isAdvanced && config.customCSS && <style>{config.customCSS}</style>}

        {isBottomUp && <div className="chat-spacer"></div>}

        {displayMessages.map(msg => {
          const animationStyle = shouldFadeOut ? { animation: `forceFadeOutAnim ${config.fadeOut}s forwards` } : {};

          // Renderizado para modo Avanzado (HTML Personalizado del usuario)
          if (config.isAdvanced && config.customHTML && config.customHTML.includes('{message}')) {
            const parsedTextHtml = getCustomHtmlParsedText(msg, emotesMap);

            const customRender = config.customHTML
              .replace(/{username}/g, `<span style="color: ${msg.color}">${msg.username}</span>`)
              .replace(/{message}/g, parsedTextHtml);
              
            return <div key={msg.id} className={`chat-message theme-${config.theme} ${shouldFadeOut ? 'chat-fade-active' : ''}`} style={animationStyle} dangerouslySetInnerHTML={{ __html: customRender }} />;
          }

          // Renderizado estándar de los mensajes
          return (
            <div key={msg.id} className={`chat-message theme-${config.theme} ${shouldFadeOut ? 'chat-fade-active' : ''}`} style={animationStyle}>
              <span className="chat-badges">
                {config.badges.platform && msg.roles.platform && <BadgeImg src="https://cdn-icons-png.flaticon.com/128/5968/5968819.png" fallback="🟣" title="Twitch" />}
                {msg.roles.broadcaster && <BadgeImg src={getBadgeSrc(msg, 'broadcaster', twitchBadges)} fallback="🎥" title="Broadcaster" />}
                {config.badges.mod && msg.roles.mod && <BadgeImg src={getBadgeSrc(msg, 'moderator', twitchBadges)} fallback="🛡️" title="Moderador" />}
                {config.badges.vip && msg.roles.vip && <BadgeImg src={getBadgeSrc(msg, 'vip', twitchBadges)} fallback="💎" title="VIP" />}
                {config.badges.sub && msg.roles.subscriber && <BadgeImg src={msg.rawBadges?.founder ? (getBadgeSrc(msg, 'founder', twitchBadges) || getBadgeSrc(msg, 'subscriber', twitchBadges)) : getBadgeSrc(msg, 'subscriber', twitchBadges)} fallback="⭐" title="Suscriptor" />}
                {config.badges.turbo && msg.roles.turbo && <BadgeImg src={getBadgeSrc(msg, 'turbo', twitchBadges)} fallback="🔋" title="Turbo" />}
                {config.badges.prime && msg.roles.prime && <BadgeImg src={getBadgeSrc(msg, 'premium', twitchBadges)} fallback="👑" title="Prime" />}
                {config.badges.bits && msg.roles.bits && <BadgeImg src={getBadgeSrc(msg, 'bits', twitchBadges)} fallback="🪙" title="Bits" />}
              </span>
              <span className="chat-username" style={{ color: msg.color }}>{msg.username}:</span>
              <span className="chat-text">{renderParsedMessage(msg, emotesMap)}</span>
            </div>
          );
        })}
        
        {!isBottomUp && <div className="chat-spacer"></div>}
      </div>

      {!isOverlayMode && isAutoScrollPaused && (
        <button
          className="chat-scroll-button"
          onClick={scrollToNewest}
          style={{
            bottom: isBottomUp ? '20px' : 'auto',
            top: !isBottomUp ? '20px' : 'auto',
            backgroundColor: config.previewBg || '#333333',
            color: buttonTextColor,
            border: `2px solid ${buttonBorderColor}`
          }}
        >
          {isBottomUp ? '⬇' : '⬆'} Ver nuevos mensajes
        </button>
      )}
    </div>
  );
}