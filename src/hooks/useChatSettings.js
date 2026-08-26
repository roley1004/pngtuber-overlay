import { useState, useEffect } from 'react';

export const defaultChatConfig = {
  theme: 'default', fontSize: 20, textColor: '#FAFAFA', previewBg: '#A3A3A3', fontFamily: 'Inter, sans-serif',
  badges: { platform: false, mod: true, vip: true, sub: true, turbo: true, prime: true, bits: true },
  emotes: { bttv: true, ffz: true, seventv: true },
  fadeOut: 7, hideBots: true, hideCommands: true, blacklist: [],
  direction: 'bottom-up',
  isAdvanced: false, customHTML: '<!-- Escribir un código de ejemplo simple -->', customCSS: '/* CSS */'
};

export function useChatSettings({ isChatOverlay }) {
  const [twitchInput, setTwitchInput] = useState(localStorage.getItem('obs-pngtuber-twitch') || '');
  
  const [chatConfig, setChatConfig] = useState(() => {
    try {
      const stored = localStorage.getItem('obs-pngtuber-chatconfig');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Aseguramos que las nuevas opciones (como vip) se agreguen si no existían en el guardado anterior
        return { ...defaultChatConfig, ...parsed, badges: { ...defaultChatConfig.badges, ...(parsed.badges || {}) } };
      }
      return defaultChatConfig;
    } catch (e) { return defaultChatConfig; }
  });

  useEffect(() => {
    if (!isChatOverlay) {
      localStorage.setItem('obs-pngtuber-chatconfig', JSON.stringify(chatConfig));
      localStorage.setItem('obs-pngtuber-twitch', twitchInput);
    }
  }, [chatConfig, twitchInput, isChatOverlay]);

  return { twitchInput, setTwitchInput, chatConfig, setChatConfig, defaultChatConfig };
}