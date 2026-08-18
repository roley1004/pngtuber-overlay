import { useState, useEffect, useRef, useMemo } from 'react'
import OBSWebSocket from 'obs-websocket-js'
import { Avatar } from './components/Avatar'
import { TwitchChat } from './components/TwitchChat'
import { SettingsPanel } from './components/SettingsPanel'
import './App.css'

function App() {
  const urlParams = new URLSearchParams(window.location.search)
  const encodedChannel = urlParams.get('c')
  
  // Decodificamos el canal para Twitch (si existe en la URL encriptada)
  const targetChannel = useMemo(() => {
    if (!encodedChannel) return null
    try {
      return atob(encodedChannel)
    } catch (e) {
      return null
    }
  }, [encodedChannel])

  const isOverlayMode = Boolean(targetChannel)

  const [password, setPassword] = useState(localStorage.getItem('obs-pngtuber-pass') || '')
  const [twitchInput, setTwitchInput] = useState(localStorage.getItem('obs-pngtuber-twitch') || '')
  const [generatedLink, setGeneratedLink] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isTalking, setIsTalking] = useState(false)
  const [isBlinking, setIsBlinking] = useState(false)
  const [showHUD, setShowHUD] = useState(!isOverlayMode)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [availableMics, setAvailableMics] = useState([])
  const [selectedMic, setSelectedMic] = useState(localStorage.getItem('obs-pngtuber-mic') || '')
  const [sensitivity, setSensitivity] = useState(parseFloat(localStorage.getItem('obs-pngtuber-sens')) || 0.01)
  const [images, setImages] = useState({
    idle: localStorage.getItem('obs-pngtuber-img-idle') || '/idle.png',
    talk: localStorage.getItem('obs-pngtuber-img-talk') || '/talk.png',
    blink: localStorage.getItem('obs-pngtuber-img-blink') || '/blink.png',
    talkBlink: localStorage.getItem('obs-pngtuber-img-talkBlink') || '/talk_blink.png'
  })

  const obs = useRef(new OBSWebSocket())
  const knownMics = useRef(new Set())
  const hudTimeout = useRef(null)
  const micRef = useRef(selectedMic)
  const sensRef = useRef(sensitivity)

  useEffect(() => { micRef.current = selectedMic; localStorage.setItem('obs-pngtuber-mic', selectedMic) }, [selectedMic])
  useEffect(() => { sensRef.current = sensitivity; localStorage.setItem('obs-pngtuber-sens', sensitivity) }, [sensitivity])

  const handleLogout = () => {
    try { obs.current.disconnect() } catch (e) {}
    setIsConnected(false)
    setPassword('')
    localStorage.removeItem('obs-pngtuber-pass')
  }

  const handleGenerateURL = () => {
    if (!twitchInput) return
    localStorage.setItem('obs-pngtuber-twitch', twitchInput)
    // Encriptamos el nombre del canal en texto seguro (Base64)
    const encryptedChannel = btoa(twitchInput)
    setGeneratedLink(`${window.location.origin}?c=${encryptedChannel}`)
  }

  const connectToOBS = async () => {
    if (!password) return
    try {
      obs.current.removeAllListeners('InputVolumeMeters')
      await obs.current.connect('ws://127.0.0.1:4455', password, { eventSubscriptions: 65537 })
      localStorage.setItem('obs-pngtuber-pass', password)
      setIsConnected(true)
      
      obs.current.on('InputVolumeMeters', (data) => {
        let maxVolume = 0
        let newMicsFound = false
        data.inputs.forEach(input => {
          if (!knownMics.current.has(input.inputName)) {
            knownMics.current.add(input.inputName)
            newMicsFound = true
          }
          if (input.inputName === micRef.current && input.inputLevelsMul) {
            input.inputLevelsMul.forEach(channel => {
              if (channel[0] > maxVolume) maxVolume = channel[0]
            })
          }
        })
        if (newMicsFound) {
          const micList = Array.from(knownMics.current)
          setAvailableMics(micList)
          if (!micRef.current && micList.length > 0) setSelectedMic(micList[0])
        }
        setIsTalking(maxVolume > sensRef.current)
      })
    } catch (error) {
      if (!isOverlayMode) alert("Error al conectar a OBS. Verifica la contraseña.")
    }
  }

  useEffect(() => { 
    if (password && !isOverlayMode) {
      connectToOBS()
    } 
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setIsSelectOpen(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOverlayMode) return
    const handleInteraction = () => {
      if (!isConnected) return
      setShowHUD(true)
      clearTimeout(hudTimeout.current)
      hudTimeout.current = setTimeout(() => { if (!isSelectOpen) setShowHUD(false) }, 3000)
    }
    window.addEventListener('mousemove', handleInteraction)
    window.addEventListener('mousedown', handleInteraction)
    return () => {
      window.removeEventListener('mousemove', handleInteraction)
      window.removeEventListener('mousedown', handleInteraction)
    }
  }, [isConnected, isSelectOpen, isOverlayMode])

  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }, Math.random() * 3500 + 2500)
    return () => clearInterval(blinkTimer)
  }, [])

  const handleImageUpload = (key, event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64String = e.target.result
      setImages(prev => ({ ...prev, [key]: base64String }))
      localStorage.setItem(`obs-pngtuber-img-${key}`, base64String)
    }
    reader.readAsDataURL(file)
  }

  const getCurrentImage = () => {
    if (isTalking && isBlinking) return images.talkBlink
    if (isTalking && !isBlinking) return images.talk
    if (!isTalking && isBlinking) return images.blink
    return images.idle
  }

  const memoizedTwitchChat = useMemo(() => (
    <TwitchChat targetChannel={targetChannel} isOverlayMode={isOverlayMode} />
  ), [targetChannel, isOverlayMode])

  return (
    <div className={isOverlayMode ? 'overlay-mode' : ''} style={{width: '100%', height: '100%'}}>
      <SettingsPanel 
        isConnected={isConnected}
        isOverlayMode={isOverlayMode}
        password={password}
        setPassword={setPassword}
        twitchInput={twitchInput}
        setTwitchInput={setTwitchInput}
        handleGenerateURL={handleGenerateURL}
        generatedLink={generatedLink}
        connectToOBS={connectToOBS}
        showHUD={showHUD}
        setShowHUD={setShowHUD}
        hudTimeout={hudTimeout}
        isSelectOpen={isSelectOpen}
        setIsSelectOpen={setIsSelectOpen}
        selectedMic={selectedMic}
        setSelectedMic={setSelectedMic}
        availableMics={availableMics}
        sensitivity={sensitivity}
        setSensitivity={setSensitivity}
        handleImageUpload={handleImageUpload}
        handleLogout={handleLogout}
      />
      {memoizedTwitchChat}
      <Avatar isTalking={isTalking} currentImage={getCurrentImage()} />
    </div>
  )
}

export default App