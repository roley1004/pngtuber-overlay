import { useState, useEffect } from 'react'
import tmi from 'tmi.js'

export function TwitchChat({ targetChannel, isOverlayMode }) {
  const [lastChatMessage, setLastChatMessage] = useState(null)

  useEffect(() => {
    if (isOverlayMode && targetChannel) {
      const client = new tmi.Client({ channels: [targetChannel] })
      client.connect().catch(console.error)
      
      client.on('message', (channel, tags, message) => {
        setLastChatMessage({ user: tags['display-name'], text: message })
        setTimeout(() => setLastChatMessage(null), 5000)
      })
      
      return () => client.disconnect()
    }
  }, [isOverlayMode, targetChannel])

  if (!lastChatMessage) return null

  return (
    <div className="chat-bubble">
      <span className="chat-username">{lastChatMessage.user}</span>
      {lastChatMessage.text}
    </div>
  )
}