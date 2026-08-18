import { useState, useEffect, useRef } from 'react'
import tmi from 'tmi.js'

export function TwitchChat({ targetChannel, isOverlayMode }) {
  const [messages, setMessages] = useState([])
  const timers = useRef(new Set())

  useEffect(() => {
    if (isOverlayMode && targetChannel) {
      const client = new tmi.Client({ channels: [targetChannel] })
      client.connect().catch(console.error)
      
      client.on('message', (channel, tags, message) => {
        // Usamos el ID único de Twitch (o generamos uno de respaldo)
        const messageId = tags.id || (Date.now() + Math.random().toString())
        
        setMessages(prev => {
          // Si el mensaje ya existe en la lista, lo ignoramos para evitar duplicados
          if (prev.some(msg => msg.id === messageId)) return prev;
          
          return [...prev, { 
            id: messageId, 
            user: tags['display-name'], 
            text: message, 
            isFading: false 
          }]
        })
        
        // Temporizador 1: Iniciar el desvanecimiento a los 7 segundos (7000 ms)
        const fadeTimer = setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isFading: true } : msg
          ))
          timers.current.delete(fadeTimer)
        }, 7000)
        
        // Temporizador 2: Borrar el mensaje del estado a los 8 segundos (8000 ms)
        const removeTimer = setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== messageId))
          timers.current.delete(removeTimer)
        }, 8000)

        timers.current.add(fadeTimer)
        timers.current.add(removeTimer)
      })
      
      return () => {
        client.disconnect()
        // Limpiamos todos los temporizadores activos al desmontar
        timers.current.forEach(clearTimeout)
        timers.current.clear()
      }
    }
  }, [isOverlayMode, targetChannel])

  if (messages.length === 0) return null

  return (
    <div 
      className="chat-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        height: '100%',
        padding: '10px',
        overflow: 'hidden'
      }}
    >
      {messages.map((msg) => (
        <div 
          key={msg.id}
          className={`chat-bubble ${msg.isFading ? 'fade-out' : ''}`}
          style={{
            position: 'relative',
            marginBottom: '8px',
            transition: 'opacity 1s ease-in-out',
            opacity: msg.isFading ? 0 : 1
          }}
        >
          <span className="chat-username">{msg.user}: </span>
          {msg.text}
        </div>
      ))}
    </div>
  )
}