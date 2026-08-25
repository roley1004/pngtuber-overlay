import { useEffect, useState } from 'react';
import tmi from 'tmi.js';
import './TwitchChat.css';

export function TwitchChat({ targetChannel, isOverlayMode, config }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!isOverlayMode && !targetChannel) {
      let idCounter = 1;
      const dummyData = [
        { user: 'Streamer', roles: { broadcaster: true }, color: '#FF5733', text: '¡Bienvenidos al stream!' },
        { user: 'Nightbot', roles: {}, color: '#A9A9A9', text: 'Sígueme en mis redes sociales.' },
        { user: 'ModVigilante', roles: { mod: true }, color: '#33FF57', text: 'Recuerden leer las reglas. !reglas' },
        { user: 'SubFiel', roles: { subscriber: true }, color: '#3357FF', text: 'Hola a todos 🤩' }
      ];

      const interval = setInterval(() => {
        const msg = dummyData[Math.floor(Math.random() * dummyData.length)];
        setMessages(prev => {
          const newMsg = { id: idCounter++, username: msg.user, roles: msg.roles, color: msg.color, message: msg.text };
          return [...prev.slice(-14), newMsg]; 
        });
      }, 2500);
      return () => clearInterval(interval);
    }

    if (!targetChannel) return;

    const client = new tmi.Client({ channels: [targetChannel] });
    client.connect().catch(console.error);

    client.on('message', (channel, tags, message, self) => {
      setMessages(prev => {
        const newMsg = {
          id: tags.id,
          username: tags['display-name'] || tags.username,
          roles: {
            broadcaster: tags.badges?.broadcaster,
            mod: tags.badges?.moderator,
            subscriber: tags.badges?.subscriber,
            vip: tags.badges?.vip,
          },
          color: tags.color || '#ffffff',
          message: message
        };
        return [...prev.slice(-49), newMsg];
      });
    });

    return () => client.disconnect();
  }, [targetChannel, isOverlayMode]);

  const filteredMessages = messages.filter(msg => {
    if (config.hideCommands && msg.message.startsWith('!')) return false;
    if (config.hideBots && (msg.username.toLowerCase().includes('bot') || msg.username === 'Nightbot' || msg.username === 'StreamElements')) return false;
    if (config.blacklist.some(word => msg.username.toLowerCase() === word.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="twitch-chat-container" style={{ fontSize: `${config.fontSize}px`, color: config.textColor }}>
      {config.isAdvanced && config.customCSS && <style>{config.customCSS}</style>}

      {filteredMessages.map(msg => (
        <div key={msg.id} className={`chat-message theme-${config.theme} fade-out-enabled`} style={{ animationDuration: config.fadeOut > 0 ? `${config.fadeOut}s` : '0s', animationName: config.fadeOut > 0 ? 'fadeOutMessage' : 'none' }}>
          <span className="chat-badges">
            {config.badges.mod && msg.roles.mod && <span className="badge badge-mod">🛡️</span>}
            {config.badges.sub && msg.roles.subscriber && <span className="badge badge-sub">⭐</span>}
            {msg.roles.broadcaster && <span className="badge badge-broadcaster">🎥</span>}
          </span>
          <span className="chat-username" style={{ color: msg.color, fontWeight: 'bold', marginRight: '6px' }}>{msg.username}:</span>
          <span className="chat-text">{msg.message}</span>
        </div>
      ))}
    </div>
  )
}