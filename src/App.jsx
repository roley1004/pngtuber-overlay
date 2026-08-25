import { useState, useEffect, useRef, useMemo } from 'react'
import OBSWebSocket from 'obs-websocket-js'
import { Avatar } from './components/pngtuber/Avatar'
import { TwitchChat } from './components/chat/TwitchChat'
import { SettingsPanel } from './components/core/SettingsPanel'
import { Hub } from './components/hub/Hub'
import { EditorHeader } from './components/core/EditorHeader'
import './App.css'

const defaultChatConfig = {
  theme: 'default', fontSize: 20, textColor: '#FAFAFA', previewBg: '#A3A3A3',
  badges: { platform: false, mod: true, sub: true, turbo: true, prime: true, bits: true },
  emotes: { bttv: true, ffz: true, seventv: true },
  fadeOut: 7, hideBots: true, hideCommands: true, blacklist: [],
  isAdvanced: false, customHTML: '<!-- Escribir un código de ejemplo simple -->', customCSS: '/* CSS */'
}

function App() {
  const urlParams = new URLSearchParams(window.location.search)
  const encodedAvatar = urlParams.get('avatar')
  const isAvatarOverlay = Boolean(encodedAvatar)
  const encodedChat = urlParams.get('chat')
  const isChatOverlay = Boolean(encodedChat)

  const avatarConfig = useMemo(() => {
    if (isAvatarOverlay && encodedAvatar) {
      try {
        const [a, p] = atob(encodedAvatar).split('||');
        return { a, p };
      } catch(e) { return {}; }
    }
    return {};
  }, [isAvatarOverlay, encodedAvatar])

  const chatSettingsDecoded = useMemo(() => {
    if (isChatOverlay && encodedChat) {
      try {
        const decoded = decodeURIComponent(atob(encodedChat));
        const separatorIdx = decoded.indexOf('||');
        if(separatorIdx === -1) return {};
        const t = decoded.substring(0, separatorIdx);
        const c = JSON.parse(decoded.substring(separatorIdx + 2));
        return { t, c };
      } catch(e) { return {}; }
    }
    return {};
  }, [isChatOverlay, encodedChat])

  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || 'hub';
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setCurrentView(params.get('view') || 'hub');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view) => {
    const params = new URLSearchParams(window.location.search);
    if (view === 'hub') params.delete('view');
    else params.set('view', view);
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
    setCurrentView(view);
  };

  const [password, setPassword] = useState(avatarConfig.p || localStorage.getItem('obs-pngtuber-pass') || '')
  const [serverAddress, setServerAddress] = useState(avatarConfig.a || localStorage.getItem('obs-pngtuber-address') || 'localhost:4455')
  
  const [isHeaderObsExpanded, setIsHeaderObsExpanded] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [obsError, setObsError] = useState('') 
  const [fileError, setFileError] = useState('') 

  const [isTalking, setIsTalking] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isBlinking, setIsBlinking] = useState(false)
  const [currentVolume, setCurrentVolume] = useState(0)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [availableMics, setAvailableMics] = useState([])
  const [previewBg, setPreviewBg] = useState('grid')
  
  const [selectedMic, setSelectedMic] = useState(localStorage.getItem('obs-pngtuber-mic') || '')
  const [sensitivity, setSensitivity] = useState(parseFloat(localStorage.getItem('obs-pngtuber-sens')) || 25)
  const [blinkFrequency, setBlinkFrequency] = useState(parseFloat(localStorage.getItem('obs-pngtuber-blink-freq')) || 4.0)
  const [isRandomBlink, setIsRandomBlink] = useState(localStorage.getItem('obs-pngtuber-random-blink') === 'true')
  const [bounceIntensity, setBounceIntensity] = useState(parseInt(localStorage.getItem('obs-pngtuber-bounce')) || 75)

  const [images, setImages] = useState({
    idle: localStorage.getItem('obs-pngtuber-img-idle') || null,
    talk: localStorage.getItem('obs-pngtuber-img-talk') || null,
    blink: localStorage.getItem('obs-pngtuber-img-blink') || null,
    talkBlink: localStorage.getItem('obs-pngtuber-img-talkBlink') || null
  })

  const [twitchInput, setTwitchInput] = useState(chatSettingsDecoded.t || localStorage.getItem('obs-pngtuber-twitch') || '')
  const [chatConfig, setChatConfig] = useState(() => {
    if (isChatOverlay && chatSettingsDecoded.c) return chatSettingsDecoded.c;
    try {
      const stored = localStorage.getItem('obs-pngtuber-chatconfig');
      return stored ? JSON.parse(stored) : defaultChatConfig;
    } catch (e) { return defaultChatConfig; }
  })

  useEffect(() => {
    if (!isChatOverlay) localStorage.setItem('obs-pngtuber-chatconfig', JSON.stringify(chatConfig))
  }, [chatConfig, isChatOverlay])

  const avatarLinkGenerated = useMemo(() => {
    if (!password || !serverAddress) return '';
    return `${window.location.origin}${window.location.pathname}?avatar=${btoa(serverAddress + '||' + password)}`;
  }, [password, serverAddress])

  const chatLinkGenerated = useMemo(() => {
    if (!twitchInput) return '';
    const payload = twitchInput + '||' + JSON.stringify(chatConfig);
    return `${window.location.origin}${window.location.pathname}?chat=${btoa(encodeURIComponent(payload))}`;
  }, [twitchInput, chatConfig])

  const targetChannel = useMemo(() => {
    if (isChatOverlay) return chatSettingsDecoded.t || null
    return !isAvatarOverlay ? twitchInput : null
  }, [chatSettingsDecoded, isChatOverlay, isAvatarOverlay, twitchInput])

  const obs = useRef(new OBSWebSocket())
  const knownMics = useRef(new Set())
  const micRef = useRef(selectedMic)
  const sensRef = useRef(sensitivity)

  useEffect(() => { micRef.current = selectedMic; localStorage.setItem('obs-pngtuber-mic', selectedMic) }, [selectedMic])
  useEffect(() => { sensRef.current = sensitivity; localStorage.setItem('obs-pngtuber-sens', sensitivity) }, [sensitivity])
  useEffect(() => { localStorage.setItem('obs-pngtuber-blink-freq', blinkFrequency) }, [blinkFrequency])
  useEffect(() => { localStorage.setItem('obs-pngtuber-random-blink', isRandomBlink) }, [isRandomBlink])
  useEffect(() => { localStorage.setItem('obs-pngtuber-bounce', bounceIntensity) }, [bounceIntensity])

  // Transmite la configuración constantemente para que OBS la atrape y la guarde
  useEffect(() => {
    if (isConnected && !isAvatarOverlay && !isChatOverlay && obs.current) {
      const syncData = () => {
        obs.current.call('BroadcastCustomEvent', {
          eventData: { action: 'SYNC_PNGTUBER', data: { selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, images } }
        }).catch(() => {});
      };
      syncData();
      const interval = setInterval(syncData, 3000); 
      return () => clearInterval(interval);
    }
  }, [selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, images, isConnected, isAvatarOverlay, isChatOverlay])

  const handleLogout = () => {
    try { obs.current.disconnect() } catch (e) {}
    setIsConnected(false)
    setIsHeaderObsExpanded(true)
    setPassword('')
    setObsError('')
    localStorage.removeItem('obs-pngtuber-pass')
  }

  const connectToOBS = async () => {
    if (!password || !serverAddress) {
      setObsError("Faltan credenciales.")
      return
    }
    setObsError("Conectando...")
    try {
      obs.current.removeAllListeners()
      await obs.current.connect(`ws://${serverAddress}`, password, { eventSubscriptions: 4194303 })
      if (!isAvatarOverlay && !isChatOverlay) {
        localStorage.setItem('obs-pngtuber-pass', password)
        localStorage.setItem('obs-pngtuber-address', serverAddress)
      }
      setIsConnected(true)
      setIsHeaderObsExpanded(false)
      setObsError('')

      // El navegador de OBS escucha la sincronización y la guarda en su propia memoria
      obs.current.on('CustomEvent', (event) => {
        if (event && event.action === 'SYNC_PNGTUBER' && isAvatarOverlay) {
          const { data } = event;
          if (data.selectedMic !== undefined) setSelectedMic(data.selectedMic);
          if (data.sensitivity !== undefined) setSensitivity(data.sensitivity);
          if (data.blinkFrequency !== undefined) setBlinkFrequency(data.blinkFrequency);
          if (data.isRandomBlink !== undefined) setIsRandomBlink(data.isRandomBlink);
          if (data.bounceIntensity !== undefined) setBounceIntensity(data.bounceIntensity);
          if (data.images) {
            setImages(data.images);
            Object.entries(data.images).forEach(([key, val]) => {
              if (val) localStorage.setItem(`obs-pngtuber-img-${key}`, val);
            });
          }
        }
      });

      obs.current.on('InputVolumeMeters', (data) => {
        let maxVolume = 0
        let newMicsFound = false
        data.inputs.forEach(input => {
          if (!knownMics.current.has(input.inputName)) { knownMics.current.add(input.inputName); newMicsFound = true; }
          if (input.inputName === micRef.current && input.inputLevelsMul) {
            input.inputLevelsMul.forEach(channel => { 
              const peak = channel[1] !== undefined ? channel[1] : channel[0]
              const db = 20 * Math.log10(peak || 0.00001) 
              const percent = Math.max(0, Math.min(100, ((db + 60) / 60) * 100))
              if (percent > maxVolume) maxVolume = percent
            })
          }
        })
        if (newMicsFound) {
          const micList = Array.from(knownMics.current)
          setAvailableMics(micList)
          if (!micRef.current && micList.length > 0) setSelectedMic(micList[0])
        }
        setCurrentVolume(maxVolume)
        setIsTalking(maxVolume > sensRef.current)
      })
    } catch (error) {
      setIsConnected(false)
      if (!isAvatarOverlay && !isChatOverlay) setObsError("Fallo de conexión. Verifica OBS.")
    }
  }

  useEffect(() => { if (password && !isChatOverlay && !isConnected) connectToOBS() }, [])

  useEffect(() => {
    const handleClickOutside = () => setIsSelectOpen(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    let timeoutId;
    const scheduleBlink = () => {
      setIsBlinking(true); setTimeout(() => setIsBlinking(false), 150);
      const nextDelay = isRandomBlink ? (Math.random() * 4 + 2) * 1000 : blinkFrequency * 1000;
      timeoutId = setTimeout(scheduleBlink, nextDelay);
    };
    timeoutId = setTimeout(scheduleBlink, isRandomBlink ? (Math.random() * 4 + 2) * 1000 : blinkFrequency * 1000);
    return () => clearTimeout(timeoutId);
  }, [blinkFrequency, isRandomBlink])

  const handleImageUpload = (key, event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 2.5 * 1024 * 1024) {
      setFileError('Archivo mayor a 2.5MB. Usa una imagen más ligera.')
      setTimeout(() => setFileError(''), 4000)
      return
    }
    setFileError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 400
        let width = img.width, height = img.height
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) { height *= MAX_SIZE / width; width = MAX_SIZE } 
          else { width *= MAX_SIZE / height; height = MAX_SIZE }
        }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/webp', 0.8)
        
        setImages(prev => ({ ...prev, [key]: compressedBase64 }))
        if (!isAvatarOverlay) localStorage.setItem(`obs-pngtuber-img-${key}`, compressedBase64)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  const getCurrentImage = () => {
    const isActive = isTalking || isSimulating 
    if (isActive && isBlinking) return images.talkBlink || images.talk || images.idle || '/idle.png'
    if (isActive && !isBlinking) return images.talk || images.idle || '/idle.png'
    if (!isActive && isBlinking) return images.blink || images.idle || '/idle.png'
    return images.idle || '/idle.png'
  }

  const memoizedTwitchChat = useMemo(() => (
    <TwitchChat targetChannel={targetChannel} isOverlayMode={isChatOverlay} config={isChatOverlay ? chatSettingsDecoded.c : chatConfig} />
  ), [targetChannel, isChatOverlay, chatSettingsDecoded, chatConfig])
  const activeTalkingState = isTalking || isSimulating

  if (isAvatarOverlay || isChatOverlay) {
    return (
      <div className="overlay-mode preview-container" style={{width: '100%', height: '100%', borderRadius: 0}}>
        {(!isAvatarOverlay) && memoizedTwitchChat}
        {(!isChatOverlay) && <Avatar isTalking={activeTalkingState} currentImage={getCurrentImage()} bounceIntensity={bounceIntensity} />}
      </div>
    )
  }

  if (currentView === 'hub') {
    return (
      <Hub 
        setCurrentView={navigateTo} isConnected={isConnected} 
        serverAddress={serverAddress} setServerAddress={setServerAddress} 
        password={password} setPassword={setPassword} 
        connectToOBS={connectToOBS} obsError={obsError} handleLogout={handleLogout}
      />
    )
  }

  return (
    <div className="app-layout">
      <EditorHeader 
        currentView={currentView} setCurrentView={navigateTo}
        avatarLinkGenerated={avatarLinkGenerated} chatLinkGenerated={chatLinkGenerated}
        twitchInput={twitchInput} isConnected={isConnected} 
        serverAddress={serverAddress} setServerAddress={setServerAddress}
        password={password} setPassword={setPassword} 
        connectToOBS={connectToOBS} handleLogout={handleLogout} obsError={obsError}
      />

      <div className="editor-body">
        <div className={`sidebar ${currentView === 'chat' ? 'full-width' : ''}`}>
          <SettingsPanel 
            currentView={currentView}
            twitchInput={twitchInput} setTwitchInput={setTwitchInput}
            chatConfig={chatConfig} setChatConfig={setChatConfig}
            defaultChatConfig={defaultChatConfig}
            selectedMic={selectedMic} setSelectedMic={setSelectedMic}
            availableMics={availableMics} sensitivity={sensitivity} setSensitivity={setSensitivity}
            blinkFrequency={blinkFrequency} setBlinkFrequency={setBlinkFrequency}
            isRandomBlink={isRandomBlink} setIsRandomBlink={setIsRandomBlink}
            bounceIntensity={bounceIntensity} setBounceIntensity={setBounceIntensity}
            handleImageUpload={handleImageUpload}
            isSimulating={isSimulating} setIsSimulating={setIsSimulating}
            isSelectOpen={isSelectOpen} setIsSelectOpen={setIsSelectOpen}
            images={images} currentVolume={currentVolume} isTalking={activeTalkingState}
            fileError={fileError} isConnected={isConnected}
            chatPreview={memoizedTwitchChat} 
          />
        </div>
        
        {currentView === 'pngtuber' && (
          <div className="preview-area">
            <div className={`preview-container bg-${previewBg}`}>
              <div className="floating-status">
                <span className={activeTalkingState ? "dot-listening" : "dot-idle"}>{activeTalkingState ? "●" : "○"}</span>
                {activeTalkingState ? "Escuchando..." : "En Reposo"}
              </div>
              <div className="floating-bar">
                <button className={`icon-btn ${previewBg === 'grid' ? 'active' : ''}`} onClick={() => setPreviewBg('grid')} title="Fondo Transparente">🏁</button>
                <button className={`icon-btn ${previewBg === 'chroma' ? 'active' : ''}`} onClick={() => setPreviewBg('chroma')} title="Fondo Croma">🟩</button>
                <button className={`icon-btn ${previewBg === 'dark' ? 'active' : ''}`} onClick={() => setPreviewBg('dark')} title="Fondo Oscuro">🌙</button>
              </div>
              <Avatar isTalking={activeTalkingState} currentImage={getCurrentImage()} bounceIntensity={bounceIntensity} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App