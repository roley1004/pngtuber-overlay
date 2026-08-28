import React, { useEffect, useState, useCallback, useRef } from 'react';
import tmi from 'tmi.js';
import './TwitchChat.css';
import { DEFAULT_BADGES, getContrastColor, staticDummyMessages } from '../../utils/chatHelpers';

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
          emotesTags: tags.emotes,
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

  const renderParsedMessage = (msgObj) => {
    const { message, emotesTags } = msgObj;
    if (!message) return null;

    const twitchEmotes = [];
    if (emotesTags) {
      Object.keys(emotesTags).forEach(id => {
        emotesTags[id].forEach(range => {
          const [start, end] = range.split('-').map(Number);
          twitchEmotes.push({
            start, end, id,
            code: message.slice(start, end + 1),
            url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`
          });
        });
      });
    }

    twitchEmotes.sort((a, b) => a.start - b.start);

    const parts = [];
    let lastIndex = 0;

    twitchEmotes.forEach(emote => {
      if (emote.start > lastIndex) {
        parts.push({ type: 'text', content: message.slice(lastIndex, emote.start) });
      }
      parts.push({ type: 'twitch', url: emote.url, code: emote.code });
      lastIndex = emote.end + 1;
    });

    if (lastIndex < message.length) {
      parts.push({ type: 'text', content: message.slice(lastIndex) });
    }
    if (parts.length === 0) {
      parts.push({ type: 'text', content: message });
    }

    return parts.map((part, pIdx) => {
      if (part.type === 'twitch') {
        return (
          <img 
            key={`tw-${pIdx}`} src={part.url} alt={part.code} title={part.code} 
            className="chat-emote-img" 
          />
        );
      }

      const words = part.content.split(' ');
      return words.map((word, wIdx) => {
        const emoteUrl = emotesMap[word];
        const isLast = wIdx === words.length - 1;
        if (emoteUrl) {
          return (
            <React.Fragment key={`3rd-${pIdx}-${wIdx}`}>
              <img src={emoteUrl} alt={word} title={word} className="chat-emote-img" />
              {!isLast && ' '}
            </React.Fragment>
          );
        }
        return word + (!isLast ? ' ' : '');
      });
    });
  };

  const getCustomHtmlParsedText = (msgObj) => {
    const { message, emotesTags } = msgObj;
    if (!message) return '';

    const twitchEmotes = [];
    if (emotesTags) {
      Object.keys(emotesTags).forEach(id => {
        emotesTags[id].forEach(range => {
          const [start, end] = range.split('-').map(Number);
          twitchEmotes.push({ start, end, id, code: message.slice(start, end + 1), url: `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0` });
        });
      });
    }
    twitchEmotes.sort((a, b) => a.start - b.start);

    let resultHtml = '';
    let lastIndex = 0;

    const processText = (text) => {
      return text.split(' ').map(w => emotesMap[w] 
        ? `<img src="${emotesMap[w]}" alt="${w}" title="${w}" class="chat-emote-img" />` 
        : w).join(' ');
    };

    twitchEmotes.forEach(emote => {
      if (emote.start > lastIndex) {
        resultHtml += processText(message.slice(lastIndex, emote.start));
      }
      resultHtml += `<img src="${emote.url}" alt="${emote.code}" title="${emote.code}" class="chat-emote-img" />`;
      lastIndex = emote.end + 1;
    });

    if (lastIndex < message.length) {
      resultHtml += processText(message.slice(lastIndex));
    }

    return resultHtml;
  };

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

          if (config.isAdvanced && config.customHTML && config.customHTML.includes('{message}')) {
            const parsedTextHtml = getCustomHtmlParsedText(msg);

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
              <span className="chat-username" style={{ color: msg.color }}>{msg.username}:</span>
              <span className="chat-text">{renderParsedMessage(msg)}</span>
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