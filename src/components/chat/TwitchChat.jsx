import React, { useEffect, useState, useCallback, useRef } from 'react';
import tmi from 'tmi.js';
import './TwitchChat.css';

const DEFAULT_BADGES = {
  broadcaster: { "1": "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3" },
  moderator: { "1": "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3" },
  vip: { "1": "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3" },
  subscriber: { "0": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3", "1": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3" },
  founder: { "0": "https://static-cdn.jtvnw.net/badges/v1/511b78a9-ab37-472f-9569-457753bbe7d3/3" },
  turbo: { "1": "https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/3" },
  premium: { "1": "https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/3" },
  bits: { "1": "https://static-cdn.jtvnw.net/badges/v1/73b5c3fb-24f9-4a82-a852-2f475b59411c/3", "1000": "https://static-cdn.jtvnw.net/badges/v1/0d85a29e-79ad-4c63-a285-3acd2c66f2ba/3" }
};

const getContrastColor = (hexColor) => {
  if (!hexColor || typeof hexColor !== 'string') return '#ffffff';
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length !== 6) return '#ffffff';
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 128 ? '#111111' : '#ffffff';
};

const BadgeImg = ({ src, fallback, title }) => {
  const [error, setError] = useState(false);
  
  useEffect(() => {
    setError(false);
  }, [src]);
  
  if (!src || error) {
    return <span className="badge-emoji" title={title} style={{ fontSize: '1em', marginRight: '4px', verticalAlign: 'middle' }}>{fallback}</span>;
  }
  return (
    <img 
      src={src} 
      alt={title} 
      title={title} 
      style={{ height: '1.2em', width: 'auto', verticalAlign: 'middle', marginRight: '4px' }}
      onError={() => setError(true)} 
    />
  );
};

const staticDummyMessages = [
  { id: '1', username: 'Streamer', roles: { broadcaster: true, platform: true }, rawBadges: { broadcaster: '1' }, color: '#FF5733', message: '¡Bienvenidos al stream! KEKW catJAM' },
  { id: '2', username: 'ModVigilante', roles: { mod: true, platform: true }, rawBadges: { moderator: '1' }, color: '#33FF57', message: 'Recuerden leer las reglas. !reglas LUL' },
  { id: '3', username: 'VIPFan', roles: { vip: true, platform: true }, rawBadges: { vip: '1' }, color: '#FF33F5', message: '¡Qué buen directo, soy VIP! Pog' },
  { id: '4', username: 'SubFiel', roles: { subscriber: true, platform: true }, rawBadges: { subscriber: '1' }, color: '#3357FF', message: 'Llevo meses suscrito 🤩' },
  { id: '5', username: 'TurboUser', roles: { turbo: true, platform: true }, rawBadges: { turbo: '1' }, color: '#FF0000', message: 'Disfrutando el stream sin anuncios.' },
  { id: '6', username: 'PrimeUser', roles: { prime: true, platform: true }, rawBadges: { premium: '1' }, color: '#0088FF', message: 'Apoyando con Prime Gaming.' },
  { id: '7', username: 'Donador', roles: { bits: true, platform: true }, rawBadges: { bits: '1000' }, color: '#FFB100', message: '¡Toma unos cuantos bits!' },
  { id: '8', username: 'ViewerComun', roles: { platform: true }, rawBadges: {}, color: '#FFFFFF', message: 'Hola a todos desde Twitch 👋' }
];

export function TwitchChat({ targetChannel, isOverlayMode, config, previewMode = 'live', clearTrigger = 0 }) {
  const [messages, setMessages] = useState([]);
  const [twitchBadges, setTwitchBadges] = useState(DEFAULT_BADGES);
  const [emotesMap, setEmotesMap] = useState({});
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  
  const chatContainerRef = useRef(null);
  const fadeOutRef = useRef(config.fadeOut);
  const isBottomUp = config.direction !== 'top-down';

  useEffect(() => {
    fadeOutRef.current = config.fadeOut;
  }, [config.fadeOut]);

  const removeMessage = useCallback((id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  useEffect(() => {
    if (clearTrigger > 0) setMessages([]);
  }, [clearTrigger]);

  useEffect(() => {
    const query = targetChannel ? `?channel=${encodeURIComponent(targetChannel.replace('#', '').trim().toLowerCase())}` : '';
    
    fetch(`/api/badges${query}`)
      .then(res => {
        if (!res.ok) throw new Error('Error al conectar con API local/Vercel');
        return res.json();
      })
      .then(data => {
        if (data.success && data.badges && Object.keys(data.badges).length > 0) {
          setTwitchBadges(prev => ({ ...prev, ...data.badges }));
        }
      })
      .catch(() => {}); 
  }, [targetChannel]);

  useEffect(() => {
    if (!targetChannel) return;
    const cleanChannel = targetChannel.replace('#', '').trim().toLowerCase();
    let isMounted = true;

    const loadExtraEmotes = async () => {
      const loadedEmotes = {};

      try {
        if (config.emotes?.bttv !== false) {
          const bttvGlobal = await fetch('https://api.betterttv.net/3/cached/emotes/global').then(r => r.json()).catch(() => []);
          if (Array.isArray(bttvGlobal)) {
            bttvGlobal.forEach(e => { loadedEmotes[e.code] = `https://cdn.betterttv.net/emote/${e.id}/1x`; });
          }
        }

        if (config.emotes?.ffz !== false) {
          const ffzGlobal = await fetch('https://api.frankerfacez.com/v1/set/global').then(r => r.json()).catch(() => null);
          if (ffzGlobal?.sets) {
            Object.values(ffzGlobal.sets).forEach(set => {
              set.emoticons?.forEach(e => {
                const url = e.urls['1'] || Object.values(e.urls)[0];
                loadedEmotes[e.name] = url.startsWith('//') ? `https:${url}` : url;
              });
            });
          }
        }

        if (config.emotes?.seventv !== false) {
          const svnGlobal = await fetch('https://7tv.io/v3/emote-sets/global').then(r => r.json()).catch(() => null);
          if (svnGlobal?.emotes) {
            svnGlobal.emotes.forEach(e => {
              const hostUrl = e.data?.host?.url;
              if (hostUrl) loadedEmotes[e.name] = `https:${hostUrl}/1x.webp`;
            });
          }
        }

        const idRes = await fetch(`https://decapi.me/twitch/id/${cleanChannel}`).then(r => r.text()).catch(() => '');
        const twitchId = idRes.trim();

        if (twitchId && !isNaN(twitchId)) {
          if (config.emotes?.bttv !== false) {
            const bttvChan = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`).then(r => r.json()).catch(() => null);
            if (bttvChan) {
              [...(bttvChan.channelEmotes || []), ...(bttvChan.sharedEmotes || [])].forEach(e => {
                loadedEmotes[e.code] = `https://cdn.betterttv.net/emote/${e.id}/1x`;
              });
            }
          }

          if (config.emotes?.seventv !== false) {
            const svnChan = await fetch(`https://7tv.io/v3/users/twitch/${twitchId}`).then(r => r.json()).catch(() => null);
            if (svnChan?.emote_set?.emotes) {
              svnChan.emote_set.emotes.forEach(e => {
                const hostUrl = e.data?.host?.url;
                if (hostUrl) loadedEmotes[e.name] = `https:${hostUrl}/1x.webp`;
              });
            }
          }
        }

        if (config.emotes?.ffz !== false) {
          const ffzChan = await fetch(`https://api.frankerfacez.com/v1/room/${cleanChannel}`).then(r => r.json()).catch(() => null);
          if (ffzChan?.sets) {
            Object.values(ffzChan.sets).forEach(set => {
              set.emoticons?.forEach(e => {
                const url = e.urls['1'] || Object.values(e.urls)[0];
                loadedEmotes[e.name] = url.startsWith('//') ? `https:${url}` : url;
              });
            });
          }
        }

        if (isMounted) setEmotesMap(loadedEmotes);
      } catch (err) {
        console.error("Error al cargar emotes extra:", err);
      }
    };

    loadExtraEmotes();
    return () => { isMounted = false; };
  }, [targetChannel, config.emotes?.bttv, config.emotes?.ffz, config.emotes?.seventv]);

  // Conexión continua a Twitch sin interrumpir en segundo plano
  useEffect(() => {
    if (!targetChannel) return;

    const cleanChannel = targetChannel.replace('#', '').trim().toLowerCase();
    const client = new tmi.Client({ channels: [cleanChannel] });
    client.connect().catch(console.error);

    client.on('message', (channel, tags, message) => {
      const msgId = tags.id;
      
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
          color: tags.color || '#ffffff',
          message: message
        };
        return [...prev.slice(-99), newMsg];
      });

      const currentFadeOut = fadeOutRef.current;
      if (isOverlayMode && currentFadeOut > 0) {
        setTimeout(() => removeMessage(msgId), (currentFadeOut + 0.5) * 1000);
      }
    });

    return () => { 
      client.disconnect().catch(() => {});
    };
  }, [targetChannel, isOverlayMode, removeMessage]);

  const handleScroll = () => {
    if (isOverlayMode) return;
    const el = chatContainerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    let distanceToEdge = 0;

    if (isBottomUp) {
      distanceToEdge = scrollHeight - scrollTop - clientHeight;
    } else {
      distanceToEdge = scrollTop;
    }

    if (distanceToEdge > 30) {
      setIsAutoScrollPaused(true);
    } else {
      setIsAutoScrollPaused(false);
    }
  };

  useEffect(() => {
    if (isOverlayMode || isAutoScrollPaused) return;
    const el = chatContainerRef.current;
    if (el) {
      setTimeout(() => {
        el.scrollTop = isBottomUp ? el.scrollHeight : 0;
      }, 0);
    }
  }, [messages, isBottomUp, isAutoScrollPaused, isOverlayMode]);

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

  const sourceMessages = (!isOverlayMode && previewMode === 'test') ? staticDummyMessages : messages;

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

  const getBadgeSrc = (msg, setId) => {
    const targetVersion = msg.rawBadges?.[setId];
    if (!targetVersion) return null;

    const setBadges = twitchBadges[setId] || DEFAULT_BADGES[setId];
    if (!setBadges) return null;

    if (setBadges[targetVersion]) {
      return setBadges[targetVersion];
    }

    const numericTarget = parseInt(targetVersion, 10);
    if (!isNaN(numericTarget)) {
      const availableVersions = Object.keys(setBadges)
        .map(v => parseInt(v, 10))
        .filter(v => !isNaN(v) && v <= numericTarget)
        .sort((a, b) => b - a);

      if (availableVersions.length > 0) {
        return setBadges[availableVersions[0]];
      }
    }

    const firstAvailableKey = Object.keys(setBadges)[0];
    return setBadges[firstAvailableKey] || null;
  };

  const renderParsedMessage = (text) => {
    if (!text) return null;
    const words = text.split(' ');
    return words.map((word, idx) => {
      const emoteUrl = emotesMap[word];
      const isLast = idx === words.length - 1;
      if (emoteUrl) {
        return (
          <React.Fragment key={idx}>
            <img 
              src={emoteUrl} 
              alt={word} 
              title={word} 
              style={{ height: '1.3em', width: 'auto', verticalAlign: 'middle', margin: '0 2px' }} 
            />
            {!isLast && ' '}
          </React.Fragment>
        );
      }
      return word + (!isLast ? ' ' : '');
    });
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="twitch-chat-container" 
        style={{ 
          fontSize: `${config.fontSize}px`, color: config.textColor, fontFamily: config.fontFamily || 'Inter, sans-serif',
          height: isOverlayMode ? '100vh' : '100%', width: isOverlayMode ? '100vw' : '100%',
          display: 'flex', flexDirection: 'column', 
          overflowY: isOverlayMode ? 'hidden' : 'auto', 
          overflowX: 'hidden', gap: '4px', boxSizing: 'border-box', padding: isOverlayMode ? '10px' : '0',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.3) transparent'
        }}>
        <style>
          {`
            @keyframes forceFadeOutAnim { 0% { opacity: 1; transform: translateY(0); } 80% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-5px); } }
            .chat-fade-active { animation-fill-mode: forwards !important; }
            .twitch-chat-container::-webkit-scrollbar { width: 6px; }
            .twitch-chat-container::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.3); border-radius: 10px; }
          `}
        </style>
        {config.isAdvanced && config.customCSS && <style>{config.customCSS}</style>}

        {isBottomUp && <div style={{ flexGrow: 1, minHeight: '10px' }}></div>}

        {displayMessages.map(msg => {
          const animationStyle = shouldFadeOut ? { animation: `forceFadeOutAnim ${config.fadeOut}s forwards` } : {};

          if (config.isAdvanced && config.customHTML && config.customHTML.includes('{message}')) {
            const parsedTextHtml = msg.message.split(' ').map(w => {
              return emotesMap[w] 
                ? `<img src="${emotesMap[w]}" alt="${w}" title="${w}" style="height: 1.3em; vertical-align: middle; margin: 0 2px;" />` 
                : w;
            }).join(' ');

            const customRender = config.customHTML
              .replace(/{username}/g, `<span style="color: ${msg.color}">${msg.username}</span>`)
              .replace(/{message}/g, parsedTextHtml);
              
            return <div key={msg.id} className={`chat-message theme-${config.theme} ${shouldFadeOut ? 'chat-fade-active' : ''}`} style={animationStyle} dangerouslySetInnerHTML={{ __html: customRender }} />;
          }

          return (
            <div key={msg.id} className={`chat-message theme-${config.theme} ${shouldFadeOut ? 'chat-fade-active' : ''}`} style={animationStyle}>
              <span className="chat-badges">
                {config.badges.platform && msg.roles.platform && <BadgeImg src="https://cdn-icons-png.flaticon.com/128/5968/5968819.png" fallback="🟣" title="Twitch" />}
                {msg.roles.broadcaster && <BadgeImg src={getBadgeSrc(msg, 'broadcaster')} fallback="🎥" title="Broadcaster" />}
                {config.badges.mod && msg.roles.mod && <BadgeImg src={getBadgeSrc(msg, 'moderator')} fallback="🛡️" title="Moderador" />}
                {config.badges.vip && msg.roles.vip && <BadgeImg src={getBadgeSrc(msg, 'vip')} fallback="💎" title="VIP" />}
                {config.badges.sub && msg.roles.subscriber && <BadgeImg src={msg.rawBadges?.founder ? (getBadgeSrc(msg, 'founder') || getBadgeSrc(msg, 'subscriber')) : getBadgeSrc(msg, 'subscriber')} fallback="⭐" title="Suscriptor" />}
                {config.badges.turbo && msg.roles.turbo && <BadgeImg src={getBadgeSrc(msg, 'turbo')} fallback="🔋" title="Turbo" />}
                {config.badges.prime && msg.roles.prime && <BadgeImg src={getBadgeSrc(msg, 'premium')} fallback="👑" title="Prime" />}
                {config.badges.bits && msg.roles.bits && <BadgeImg src={getBadgeSrc(msg, 'bits')} fallback="🪙" title="Bits" />}
              </span>
              <span className="chat-username" style={{ color: msg.color, fontWeight: 'bold', marginRight: '6px' }}>{msg.username}:</span>
              <span className="chat-text">{renderParsedMessage(msg.message)}</span>
            </div>
          );
        })}
        
        {!isBottomUp && <div style={{ flexGrow: 1, minHeight: '10px' }}></div>}
      </div>

      {!isOverlayMode && isAutoScrollPaused && (
        <button
          onClick={scrollToNewest}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: isBottomUp ? '20px' : 'auto',
            top: !isBottomUp ? '20px' : 'auto',
            backgroundColor: config.previewBg || '#333333',
            color: buttonTextColor,
            border: `2px solid ${buttonBorderColor}`,
            borderRadius: '24px',
            padding: '8px 24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            zIndex: 10,
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateX(-50%) scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateX(-50%) scale(1)'}
        >
          {isBottomUp ? '⬇' : '⬆'} Ver nuevos mensajes
        </button>
      )}
    </div>
  );
}