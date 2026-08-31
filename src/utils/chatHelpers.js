import React from 'react';

// Insignias predeterminadas por si la API de Twitch falla al cargarlas
export const DEFAULT_BADGES = {
  broadcaster: { "1": "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/3" },
  moderator: { "1": "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3" },
  vip: { "1": "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3" },
  subscriber: { "0": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3", "1": "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3" },
  founder: { "0": "https://static-cdn.jtvnw.net/badges/v1/511b78a9-ab37-472f-9569-457753bbe7d3/3" },
  turbo: { "1": "https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/3" },
  premium: { "1": "https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/3" },
  bits: { "1": "https://static-cdn.jtvnw.net/badges/v1/73b5c3fb-24f9-4a82-a852-2f475b59411c/3", "1000": "https://static-cdn.jtvnw.net/badges/v1/0d85a29e-79ad-4c63-a285-3acd2c66f2ba/3" }
};

// Caché en memoria para evitar repetir peticiones HTTP a APIs de emotes de terceros
const emotesCache = new Map();

// Calcula si el texto debe ser blanco o negro dependiendo de qué tan claro sea el fondo
export const getContrastColor = (hexColor) => {
  if (!hexColor || typeof hexColor !== 'string') return '#ffffff';
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length !== 6) return '#ffffff';
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 128 ? '#111111' : '#ffffff';
};

// Lista de mensajes falsos para probar la apariencia del chat sin conectarse a Twitch
export const staticDummyMessages = [
  { id: '1', username: 'Streamer', roles: { broadcaster: true, platform: true }, rawBadges: { broadcaster: '1' }, emotesTags: null, color: '#FF5733', message: '¡Bienvenidos al stream! KEKW catJAM' },
  { id: '2', username: 'ModVigilante', roles: { mod: true, platform: true }, rawBadges: { moderator: '1' }, emotesTags: null, color: '#33FF57', message: 'Recuerden leer las reglas. !reglas LUL' },
  { id: '3', username: 'VIPFan', roles: { vip: true, platform: true }, rawBadges: { vip: '1' }, emotesTags: null, color: '#FF33F5', message: '¡Qué buen directo, soy VIP! Pog' },
  { id: '4', username: 'SubFiel', roles: { subscriber: true, platform: true }, rawBadges: { subscriber: '1' }, emotesTags: null, color: '#3357FF', message: 'Llevo meses suscrito 🤩' },
  { id: '5', username: 'TurboUser', roles: { turbo: true, platform: true }, rawBadges: { turbo: '1' }, emotesTags: null, color: '#FF0000', message: 'Disfrutando el stream sin anuncios.' },
  { id: '6', username: 'PrimeUser', roles: { prime: true, platform: true }, rawBadges: { premium: '1' }, emotesTags: null, color: '#0088FF', message: 'Apoyando con Prime Gaming.' },
  { id: '7', username: 'Donador', roles: { bits: true, platform: true }, rawBadges: { bits: '1000' }, emotesTags: null, color: '#FFB100', message: '¡Toma unos cuantos bits!' },
  { id: '8', username: 'ViewerComun', roles: { platform: true }, rawBadges: {}, emotesTags: null, color: '#FFFFFF', message: 'Hola a todos desde Twitch 👋' }
];

// --- FUNCIONES EXTRAÍDAS DE TwitchChat.jsx ---

// Se conecta a las APIs de terceros (7TV, BTTV, FFZ) para descargar los emotes del canal actual utilizando caché local
export const loadThirdPartyEmotes = async (targetChannel, config) => {
  if (!targetChannel) return {};
  const cleanChannel = targetChannel.replace('#', '').trim().toLowerCase();
  
  const bttvActive = config.emotes?.bttv !== false;
  const ffzActive = config.emotes?.ffz !== false;
  const seventvActive = config.emotes?.seventv !== false;
  const cacheKey = `${cleanChannel}_${bttvActive}_${ffzActive}_${seventvActive}`;

  if (emotesCache.has(cacheKey)) {
    return emotesCache.get(cacheKey);
  }

  const loadedEmotes = {};

  try {
    if (bttvActive) {
      const bttvGlobal = await fetch('https://api.betterttv.net/3/cached/emotes/global').then(r => r.json()).catch(() => []);
      if (Array.isArray(bttvGlobal)) {
        bttvGlobal.forEach(e => { loadedEmotes[e.code] = `https://cdn.betterttv.net/emote/${e.id}/1x`; });
      }
    }

    if (ffzActive) {
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

    if (seventvActive) {
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
      if (bttvActive) {
        const bttvChan = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`).then(r => r.json()).catch(() => null);
        if (bttvChan) {
          [...(bttvChan.channelEmotes || []), ...(bttvChan.sharedEmotes || [])].forEach(e => {
            loadedEmotes[e.code] = `https://cdn.betterttv.net/emote/${e.id}/1x`;
          });
        }
      }

      if (seventvActive) {
        const svnChan = await fetch(`https://7tv.io/v3/users/twitch/${twitchId}`).then(r => r.json()).catch(() => null);
        if (svnChan?.emote_set?.emotes) {
          svnChan.emote_set.emotes.forEach(e => {
            const hostUrl = e.data?.host?.url;
            if (hostUrl) loadedEmotes[e.name] = `https:${hostUrl}/1x.webp`;
          });
        }
      }
    }

    if (ffzActive) {
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

    emotesCache.set(cacheKey, loadedEmotes);
  } catch (err) {
    console.error("Error al cargar emotes extra:", err);
  }
  return loadedEmotes;
};

// Encuentra la imagen correcta de la insignia comparando los meses de sub o cantidad de bits
export const getBadgeSrc = (msg, setId, twitchBadges) => {
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

// Convierte el texto escrito en piezas separadas mezclando texto y etiquetas usando Javascript puro
export const renderParsedMessage = (msgObj, emotesMap) => {
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
      return React.createElement('img', {
        key: `tw-${pIdx}`,
        src: part.url,
        alt: part.code,
        title: part.code,
        className: 'chat-emote-img'
      });
    }

    const words = part.content.split(' ');
    return words.map((word, wIdx) => {
      const emoteUrl = emotesMap[word];
      const isLast = wIdx === words.length - 1;
      
      if (emoteUrl) {
        return React.createElement(React.Fragment, { key: `3rd-${pIdx}-${wIdx}` },
          React.createElement('img', {
            src: emoteUrl,
            alt: word,
            title: word,
            className: 'chat-emote-img'
          }),
          !isLast ? ' ' : null
        );
      }
      return word + (!isLast ? ' ' : '');
    });
  });
};

// Hace lo mismo que la función anterior, pero devuelve HTML puro en texto para la función de Código Personalizado (Custom CSS/HTML)
export const getCustomHtmlParsedText = (msgObj, emotesMap) => {
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