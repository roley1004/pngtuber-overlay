import { useEffect, useState, useCallback } from 'react';
import tmi from 'tmi.js';
import './TwitchChat.css';

// Sistema de respaldo en cascada para insignias globales
const BADGE_SOURCES = {
  platform: [
    'https://static-cdn.jtvnw.net/badges/v1/82054fb7-c81b-4d40-bd5d-752119154f2a/1',
    'https://static-cdn.jtvnw.net/badges/v1/82054fb7-c81b-4d40-bd5d-752119154f2a/2',
    'https://upload.wikimedia.org/wikipedia/commons/d/d3/Twitch_Glitch_Logo_Purple.svg',
    'https://cdn-icons-png.flaticon.com/128/5968/5968819.png'
  ],
  broadcaster: [
    'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1',
    'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2',
    'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3',
    'https://cdn.frankerfacez.com/badge/2/1'
  ],
  mod: [
    'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/1',
    'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2',
    'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3',
    'https://cdn.frankerfacez.com/badge/1/1'
  ],
  vip: [
    'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc3f0f123ec/1',
    'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc3f0f123ec/2',
    'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc3f0f123ec/3',
    'https://cdn.frankerfacez.com/badge/vip/1'
  ],
  sub: [
    'https://static-cdn.jtvnw.net/badges/v1/5d1155e3-0e3b-4771-8899-6ac858d6e6e8/1', // Sub genérico como respaldo final
    'https://cdn.frankerfacez.com/badge/sub/1'
  ],
  turbo: [
    'https://static-cdn.jtvnw.net/badges/v1/bd444ec6-87af-41a0-a403-2f84110f2002/1',
    'https://static-cdn.jtvnw.net/badges/v1/bd444ec6-87af-41a0-a403-2f84110f2002/2',
    'https://static-cdn.jtvnw.net/badges/v1/bd444ec6-87af-41a0-a403-2f84110f2002/3',
    'https://cdn.frankerfacez.com/badge/turbo/1'
  ],
  prime: [
    'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-87d0-970a6ca7d657/1',
    'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-87d0-970a6ca7d657/2',
    'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-87d0-970a6ca7d657/3',
    'https://cdn.frankerfacez.com/badge/prime/1'
  ],
  bits: [
    'https://static-cdn.jtvnw.net/badges/v1/73b5c3fb-24f9-4a82-a852-2f475b59411c/1',
    'https://static-cdn.jtvnw.net/badges/v1/73b5c3fb-24f9-4a82-a852-2f475b59411c/2',
    'https://static-cdn.jtvnw.net/badges/v1/73b5c3fb-24f9-4a82-a852-2f475b59411c/3',
    'https://cdn.frankerfacez.com/badge/bits/1'
  ]
};

// Componente inteligente de Insignias
const BadgeImg = ({ sources, fallback, title }) => {
  const [srcIndex, setSrcIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  if (srcIndex >= sources.length) {
    return <span className="badge-emoji" title={title} style={{ fontSize: '1em', marginRight: '4px', verticalAlign: 'middle' }}>{fallback}</span>;
  }

  return (
    <>
      {!isLoaded && <span className="badge-emoji" title={title} style={{ fontSize: '1em', marginRight: '4px', verticalAlign: 'middle' }}>{fallback}</span>}
      <img 
        src={sources[srcIndex]} 
        alt="" 
        title={title} 
        style={{ 
          height: '1.2em', width: 'auto', verticalAlign: 'middle', marginRight: '4px', 
          display: isLoaded ? 'inline-block' : 'none' 
        }}
        onLoad={() => setIsLoaded(true)}
        onError={() => { setIsLoaded(false); setSrcIndex(prev => prev + 1); }} 
      />
    </>
  );
};

const staticDummyMessages = [
  { id: 'dummy-1', username: 'Streamer', roles: { broadcaster: true, platform: true }, color: '#FF5733', message: '¡Bienvenidos al stream!' },
  { id: 'dummy-2', username: 'ModVigilante', roles: { mod: true, platform: true }, color: '#33FF57', message: 'Recuerden leer las reglas. !reglas' },
  { id: 'dummy-3', username: 'VIPFan', roles: { vip: true, platform: true }, color: '#FF33F5', message: '¡Qué buen directo, soy VIP!' },
  { id: 'dummy-4', username: 'SubFiel', roles: { subscriber: true, platform: true, subscriberVersion: '0' }, color: '#3357FF', message: 'Llevo 6 meses suscrito 🤩' },
  { id: 'dummy-5', username: 'TurboUser', roles: { turbo: true, platform: true }, color: '#FF0000', message: 'Disfrutando el stream sin anuncios.' },
  { id: 'dummy-6', username: 'PrimeUser', roles: { prime: true, platform: true }, color: '#0088FF', message: 'Apoyando con Prime Gaming.' },
  { id: 'dummy-7', username: 'Donador', roles: { bits: true, platform: true }, color: '#FFB100', message: '¡Toma unos cuantos bits!' },
  { id: 'dummy-8', username: 'ViewerComun', roles: { platform: true }, color: '#FFFFFF', message: 'Hola a todos desde Twitch 👋' }
];

export function TwitchChat({ targetChannel, isOverlayMode, config, previewMode = 'live', clearTrigger = 0 }) {
  const [messages, setMessages] = useState([]);
  const [customSubBadges, setCustomSubBadges] = useState({});

  const removeMessage = useCallback((id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  useEffect(() => {
    if (clearTrigger > 0) setMessages([]);
  }, [clearTrigger]);

  // Conexión a la Bóveda para descargar insignias personalizadas
  useEffect(() => {
    if (!targetChannel) return;
    
    fetch(`/api/badges?channel=${targetChannel}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.subBadges) {
          const badgeMap = {};
          data.subBadges.forEach(badge => {
            badgeMap[badge.id] = badge.image_url_1x; // Guardamos el diseño específico de cada mes
          });
          setCustomSubBadges(badgeMap);
        }
      })
      .catch(console.error); // Falla silenciosamente si estás en local sin Vercel
  }, [targetChannel]);

  // Conexión a Twitch
  useEffect(() => {
    if (previewMode === 'test' && !isOverlayMode) return;
    if (!targetChannel) return;

    const client = new tmi.Client({ channels: [targetChannel] });
    client.connect().catch(console.error);

    client.on('message', (channel, tags, message, self) => {
      const msgId = tags.id;
      
      setMessages(prev => {
        if (prev.some(m => m.id === msgId)) return prev;

        const newMsg = {
          id: msgId,
          username: tags['display-name'] || tags.username,
          roles: {
            platform: true,
            broadcaster: tags.badges?.broadcaster,
            mod: tags.badges?.moderator,
            subscriber: tags.badges?.subscriber !== undefined || tags.badges?.founder !== undefined,
            subscriberVersion: tags.badges?.subscriber || tags.badges?.founder, // Identifica qué mes de sub es
            vip: tags.badges?.vip,
            turbo: tags.badges?.turbo,
            prime: tags.badges?.premium,
            bits: tags.badges?.bits
          },
          color: tags.color || '#ffffff',
          message: message
        };
        return [...prev.slice(-49), newMsg];
      });

      if (config.fadeOut > 0) {
        setTimeout(() => removeMessage(msgId), (config.fadeOut + 0.5) * 1000);
      }
    });

    return () => {
      client.disconnect();
      setMessages([]); 
    };
  }, [targetChannel, isOverlayMode, config.fadeOut, removeMessage, previewMode]);

  const sourceMessages = (!isOverlayMode && previewMode === 'test') ? staticDummyMessages : messages;

  const filteredMessages = sourceMessages.filter(msg => {
    if (config.hideCommands && msg.message.startsWith('!')) return false;
    if (config.hideBots && (msg.username.toLowerCase().includes('bot') || msg.username.toLowerCase() === 'nightbot' || msg.username.toLowerCase() === 'streamelements')) return false;
    if (config.blacklist.some(word => msg.username.toLowerCase() === word.toLowerCase())) return false;
    return true;
  });

  const isStaticTest = !isOverlayMode && previewMode === 'test';
  const shouldFadeOut = isStaticTest ? false : (config.fadeOut > 0);

  const isBottomUp = config.direction !== 'top-down';
  const displayMessages = isBottomUp ? filteredMessages : [...filteredMessages].reverse();
  const justifyContent = isBottomUp ? 'flex-end' : 'flex-start';

  return (
    <div className="twitch-chat-container" style={{ 
      fontSize: `${config.fontSize}px`, 
      color: config.textColor, 
      fontFamily: config.fontFamily || 'Inter, sans-serif',
      height: isOverlayMode ? '100vh' : '100%', 
      width: isOverlayMode ? '100vw' : '100%',
      display: 'flex',
      flexDirection: 'column', 
      justifyContent: justifyContent,
      overflow: 'hidden',
      gap: '4px',
      boxSizing: 'border-box',
      padding: isOverlayMode ? '10px' : '0'
    }}>
      <style>
        {`
          @keyframes forceFadeOutAnim {
            0% { opacity: 1; transform: translateY(0); }
            80% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-5px); }
          }
          .chat-fade-active { animation-fill-mode: forwards !important; }
        `}
      </style>
      {config.isAdvanced && config.customCSS && <style>{config.customCSS}</style>}

      {displayMessages.map(msg => {
        const animationStyle = shouldFadeOut ? { animation: `forceFadeOutAnim ${config.fadeOut}s forwards` } : {};

        if (config.isAdvanced && config.customHTML && config.customHTML.includes('{message}')) {
          const customRender = config.customHTML
            .replace(/{username}/g, `<span style="color: ${msg.color}">${msg.username}</span>`)
            .replace(/{message}/g, msg.message);
            
          return (
            <div key={msg.id} className={`chat-message theme-${config.theme} ${shouldFadeOut ? 'chat-fade-active' : ''}`} 
                 style={animationStyle}
                 dangerouslySetInnerHTML={{ __html: customRender }} />
          );
        }

        // Armamos la lista de insignias de sub combinando la personalizada con las genéricas de respaldo
        const subBadgeSources = customSubBadges[msg.roles.subscriberVersion] 
          ? [customSubBadges[msg.roles.subscriberVersion], ...BADGE_SOURCES.sub] 
          : BADGE_SOURCES.sub;

        return (
          <div key={msg.id} className={`chat-message theme-${config.theme} ${shouldFadeOut ? 'chat-fade-active' : ''}`} style={animationStyle}>
            <span className="chat-badges">
              {config.badges.platform && msg.roles.platform && <BadgeImg sources={BADGE_SOURCES.platform} fallback="🟣" title="Twitch" />}
              {msg.roles.broadcaster && <BadgeImg sources={BADGE_SOURCES.broadcaster} fallback="🎥" title="Broadcaster" />}
              {config.badges.mod && msg.roles.mod && <BadgeImg sources={BADGE_SOURCES.mod} fallback="🛡️" title="Moderador" />}
              {config.badges.vip && msg.roles.vip && <BadgeImg sources={BADGE_SOURCES.vip} fallback="💎" title="VIP" />}
              {config.badges.sub && msg.roles.subscriber && <BadgeImg sources={subBadgeSources} fallback="⭐" title="Suscriptor" />}
              {config.badges.turbo && msg.roles.turbo && <BadgeImg sources={BADGE_SOURCES.turbo} fallback="🔋" title="Turbo" />}
              {config.badges.prime && msg.roles.prime && <BadgeImg sources={BADGE_SOURCES.prime} fallback="👑" title="Prime" />}
              {config.badges.bits && msg.roles.bits && <BadgeImg sources={BADGE_SOURCES.bits} fallback="🪙" title="Bits" />}
            </span>
            <span className="chat-username" style={{ color: msg.color, fontWeight: 'bold', marginRight: '6px' }}>{msg.username}:</span>
            <span className="chat-text">{msg.message}</span>
          </div>
        );
      })}
    </div>
  )
}