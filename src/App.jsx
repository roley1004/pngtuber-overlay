import { useState, useEffect, useMemo } from 'react'
import { Avatar } from './components/pngtuber/Avatar'
import { TwitchChat } from './components/chat/TwitchChat'
import { SettingsPanel } from './components/core/SettingsPanel'
import { Hub } from './components/hub/Hub'
import { EditorHeader } from './components/core/EditorHeader'
import { useOBS } from './hooks/useOBS'
import { usePNGTuber } from './hooks/usePNGTuber'
import { useChatSettings } from './hooks/useChatSettings'
import './App.css'

function App() {
  const urlParams = new URLSearchParams(window.location.search)
  const encodedAvatar = urlParams.get('avatar')
  const isAvatarOverlay = Boolean(encodedAvatar)
  const encodedChat = urlParams.get('chat')
  const isChatOverlay = Boolean(encodedChat)

  // Extraer dirección y contraseña de la URL corta
  const obsConfigDecoded = useMemo(() => {
    const encoded = encodedAvatar || encodedChat;
    if ((isAvatarOverlay || isChatOverlay) && encoded) {
      try { const [a, p] = atob(encoded).split('||'); return { a, p }; } 
      catch(e) { return {}; }
    }
    return {};
  }, [isAvatarOverlay, isChatOverlay, encodedAvatar, encodedChat])

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

  const [password, setPassword] = useState(obsConfigDecoded.p || localStorage.getItem('obs-pngtuber-pass') || '')
  const [serverAddress, setServerAddress] = useState(obsConfigDecoded.a || localStorage.getItem('obs-pngtuber-address') || 'localhost:4455')
  
  const [isTalking, setIsTalking] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentVolume, setCurrentVolume] = useState(0)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const [availableMics, setAvailableMics] = useState([])

  const {
    fileError, previewBg, setPreviewBg, selectedMic, setSelectedMic, sensitivity, setSensitivity,
    blinkFrequency, setBlinkFrequency, isRandomBlink, setIsRandomBlink, bounceIntensity, setBounceIntensity, 
    images, setImages, micRef, sensRef, handleImageUpload, getCurrentImage
  } = usePNGTuber({ isAvatarOverlay, isTalking, isSimulating })

  const { 
    twitchInput, setTwitchInput, chatConfig, setChatConfig, defaultChatConfig 
  } = useChatSettings({ isChatOverlay })

  const { isConnected, obsError, connectToOBS, handleLogout } = useOBS({
    password, setPassword, serverAddress, isAvatarOverlay, isChatOverlay, micRef, sensRef,
    setSelectedMic, setSensitivity, setBlinkFrequency, setIsRandomBlink, setBounceIntensity, setImages,
    setAvailableMics, setCurrentVolume, setIsTalking, selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, images,
    twitchInput, setTwitchInput, chatConfig, setChatConfig
  });

  // Asegura la conexión tan pronto tengamos la contraseña en los Overlays
  useEffect(() => { 
    if (password && !isConnected) connectToOBS();
  }, [password, serverAddress, isConnected]); 
  
  useEffect(() => {
    const handleClickOutside = () => setIsSelectOpen(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Ahora ambas URLs son encriptadas y super cortas
  const avatarLinkGenerated = useMemo(() => {
    if (!password || !serverAddress) return '';
    return `${window.location.origin}${window.location.pathname}?avatar=${btoa(serverAddress + '||' + password)}`;
  }, [password, serverAddress])

  const chatLinkGenerated = useMemo(() => {
    if (!password || !serverAddress) return '';
    return `${window.location.origin}${window.location.pathname}?chat=${btoa(serverAddress + '||' + password)}`;
  }, [password, serverAddress])

  const memoizedTwitchChat = useMemo(() => (
    <TwitchChat targetChannel={twitchInput} isOverlayMode={isChatOverlay} config={chatConfig} />
  ), [twitchInput, isChatOverlay, chatConfig])
  
  const activeTalkingState = isTalking || isSimulating

  // Aislamiento completo de contenedores para evitar problemas de Flexbox en OBS
  if (isChatOverlay) {
    return (
      <div style={{width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: 'transparent'}}>
        {memoizedTwitchChat}
      </div>
    )
  }

  if (isAvatarOverlay) {
    return (
      <div className="overlay-mode preview-container" style={{width: '100vw', height: '100vh', margin: 0, padding: 0, backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Avatar isTalking={activeTalkingState} currentImage={getCurrentImage()} bounceIntensity={bounceIntensity} />
      </div>
    )
  }

  if (currentView === 'hub') {
    return (
      <Hub 
        setCurrentView={navigateTo} isConnected={isConnected} serverAddress={serverAddress} 
        setServerAddress={setServerAddress} password={password} setPassword={setPassword} 
        connectToOBS={connectToOBS} obsError={obsError} handleLogout={handleLogout}
      />
    )
  }

  return (
    <div className="app-layout">
      <EditorHeader 
        currentView={currentView} setCurrentView={navigateTo} avatarLinkGenerated={avatarLinkGenerated} 
        chatLinkGenerated={chatLinkGenerated} twitchInput={twitchInput} isConnected={isConnected} 
        serverAddress={serverAddress} setServerAddress={setServerAddress} password={password} 
        setPassword={setPassword} connectToOBS={connectToOBS} handleLogout={handleLogout} obsError={obsError}
      />

      <div className="editor-body">
        <div className={`sidebar ${currentView === 'chat' ? 'full-width' : ''}`}>
          <SettingsPanel 
            currentView={currentView} twitchInput={twitchInput} setTwitchInput={setTwitchInput}
            chatConfig={chatConfig} setChatConfig={setChatConfig} defaultChatConfig={defaultChatConfig}
            selectedMic={selectedMic} setSelectedMic={setSelectedMic} availableMics={availableMics} 
            sensitivity={sensitivity} setSensitivity={setSensitivity} blinkFrequency={blinkFrequency} 
            setBlinkFrequency={setBlinkFrequency} isRandomBlink={isRandomBlink} setIsRandomBlink={setIsRandomBlink}
            bounceIntensity={bounceIntensity} setBounceIntensity={setBounceIntensity} handleImageUpload={handleImageUpload}
            isSimulating={isSimulating} setIsSimulating={setIsSimulating} isSelectOpen={isSelectOpen} 
            setIsSelectOpen={setIsSelectOpen} images={images} currentVolume={currentVolume} 
            isTalking={activeTalkingState} fileError={fileError} isConnected={isConnected} chatPreview={memoizedTwitchChat} 
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