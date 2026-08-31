import { useState, useEffect, useMemo } from 'react';
import { Avatar } from './components/pngtuber/Avatar';
import { TwitchChat } from './components/chat/TwitchChat';
import { SettingsPanel } from './components/core/SettingsPanel';
import { Hub } from './components/hub/Hub';
import { EditorHeader } from './components/core/EditorHeader';
import { ToastNotification } from './components/core/ToastNotification';
import { OBSDock } from './components/dock/OBSDock';
import { DockSimulator } from './components/dock/DockSimulator';
import { useOBS } from './hooks/useOBS';
import { usePNGTuber } from './hooks/usePNGTuber';
import { useChatSettings } from './hooks/useChatSettings';
import { useResizer } from './hooks/useResizer';
import { encodeOBSConfig, decodeOBSConfig } from './utils/urlHelpers';
import './App.css';

function App() {
  // Manejo del tema global (Claro/Oscuro) con persistencia en LocalStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pngtuber-app-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pngtuber-app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const urlParams = new URLSearchParams(window.location.search);
  const encodedAvatar = urlParams.get('avatar');
  const isAvatarOverlay = Boolean(encodedAvatar);
  const encodedChat = urlParams.get('chat');
  const isChatOverlay = Boolean(encodedChat);
  const isDockMode = urlParams.get('dock') === 'true';

  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  };

  const obsConfigDecoded = useMemo(() => {
    const encoded = encodedAvatar || encodedChat;
    if ((isAvatarOverlay || isChatOverlay) && encoded) {
      return decodeOBSConfig(encoded);
    }
    return {};
  }, [isAvatarOverlay, isChatOverlay, encodedAvatar, encodedChat]);

  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || 'hub';
  });

  const [mobileTab, setMobileTab] = useState('settings');
  const { sidebarWidth, isResizing, setIsResizing } = useResizer(360);

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
    setMobileTab('settings');
  };

  const [password, setPassword] = useState(obsConfigDecoded.p || localStorage.getItem('obs-pngtuber-pass') || '');
  const [serverAddress, setServerAddress] = useState(obsConfigDecoded.a || localStorage.getItem('obs-pngtuber-address') || 'localhost:4455');
  
  const [isTalking, setIsTalking] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [availableMics, setAvailableMics] = useState([]);

  const {
    fileError, previewBg, setPreviewBg, selectedMic, setSelectedMic, sensitivity, setSensitivity,
    blinkFrequency, setBlinkFrequency, isRandomBlink, setIsRandomBlink, 
    talkIntensity, setTalkIntensity, idleIntensity, setIdleIntensity,
    isVoiceReactive, setIsVoiceReactive,
    talkAnimation, setTalkAnimation, idleAnimation, setIdleAnimation, 
    images, setImages, micRef, sensRef, handleImageUpload, handleClearImage, getCurrentImage,
    presets, setPresets, activePresetId, setActivePresetId, activePreset,
    addPreset, duplicatePreset, deletePreset, updatePresetName, updatePresetTrigger
  } = usePNGTuber({ isAvatarOverlay, isTalking, isSimulating });

  const { 
    twitchInput, setTwitchInput, chatConfig, setChatConfig, defaultChatConfig 
  } = useChatSettings({ isChatOverlay });

  const { isConnected, obsError, connectToOBS, handleLogout, updatePresetGlobal } = useOBS({
    password, setPassword, serverAddress, isAvatarOverlay, isChatOverlay, isDockMode, micRef, sensRef,
    setSelectedMic, setSensitivity, setBlinkFrequency, setIsRandomBlink, 
    setBounceIntensity: setTalkIntensity, 
    setImages,
    setAvailableMics, setCurrentVolume, setIsTalking, selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity: talkIntensity, images,
    twitchInput, setTwitchInput, chatConfig, setChatConfig,
    talkAnimation, setTalkAnimation, idleAnimation, setIdleAnimation,
    talkIntensity, setTalkIntensity, idleIntensity, setIdleIntensity,
    isVoiceReactive, setIsVoiceReactive,
    presets, setPresets, activePresetId, setActivePresetId
  });

  useEffect(() => { 
    if (password && !isConnected) connectToOBS();
  }, [password, serverAddress, isConnected]); 
  
  useEffect(() => {
    const handleClickOutside = () => setIsSelectOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (fileError) showToast(fileError, 'alert');
  }, [fileError]);

  const avatarLinkGenerated = useMemo(() => {
    const encoded = encodeOBSConfig(serverAddress, password);
    return encoded ? `${window.location.origin}${window.location.pathname}?avatar=${encoded}` : '';
  }, [password, serverAddress]);

  const chatLinkGenerated = useMemo(() => {
    const encoded = encodeOBSConfig(serverAddress, password);
    return encoded ? `${window.location.origin}${window.location.pathname}?chat=${encoded}` : '';
  }, [password, serverAddress]);

  const staticDockUrl = useMemo(() => {
    return `${window.location.origin}${window.location.pathname}?dock=true`;
  }, []);

  const memoizedTwitchChat = useMemo(() => (
    <TwitchChat 
      targetChannel={twitchInput} 
      isOverlayMode={isChatOverlay} 
      config={chatConfig} 
      presets={presets}
      onSelectPreset={(id) => {
        const p = presets.find(item => item.id === id);
        setActivePresetId(id);
        if (p && !isAvatarOverlay && !isChatOverlay && !isDockMode) showToast(`Comando ejecutado: Avatar "${p.nombre}"`, 'success');
      }}
    />
  ), [twitchInput, isChatOverlay, chatConfig, presets, setActivePresetId, isAvatarOverlay, isDockMode]);
  
  const activeTalkingState = isTalking || isSimulating;

  const effectiveTalkIntensity = useMemo(() => {
    if (!isVoiceReactive) return talkIntensity;
    if (isSimulating) return talkIntensity; 
    if (currentVolume < sensitivity) return 0;
    const range = 100 - sensitivity;
    const normalizedVolume = range > 0 ? (currentVolume - sensitivity) / range : 1;
    return Math.round(talkIntensity * Math.min(Math.max(normalizedVolume, 0), 1));
  }, [isVoiceReactive, isSimulating, currentVolume, sensitivity, talkIntensity]);


  // VISTA 1: Panel Dock directo dentro de OBS
  if (isDockMode) {
    return (
      <OBSDock 
        presets={presets} 
        activePresetId={activePresetId} 
        onSelectPreset={updatePresetGlobal} 
      />
    );
  }

  // VISTA 2: Overlay de Chat
  if (isChatOverlay) {
    return (
      <div style={{width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: 'transparent'}}>
        {memoizedTwitchChat}
      </div>
    );
  }

  // VISTA 3: Overlay del Avatar
  if (isAvatarOverlay) {
    return (
      <div className="overlay-mode preview-container" style={{width: '100vw', height: '100vh', margin: 0, padding: 0, backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Avatar isTalking={activeTalkingState} currentImage={getCurrentImage()} talkIntensity={effectiveTalkIntensity} idleIntensity={idleIntensity} talkAnimation={talkAnimation} idleAnimation={idleAnimation} />
        <div style={{ display: 'none' }}>
          {memoizedTwitchChat}
        </div>
      </div>
    );
  }

  // VISTA 4: Pantalla Completa del Simulador del Dock
  if (currentView === 'dock-simulator') {
    return (
      <>
        <DockSimulator 
          setCurrentView={navigateTo} 
          presets={presets} 
          dockUrl={staticDockUrl} 
        />
        <div style={{ display: 'none' }}>
          {memoizedTwitchChat}
        </div>
        <ToastNotification toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  // VISTA 5: Pantalla de Inicio (Hub)
  if (currentView === 'hub') {
    return (
      <>
        <Hub 
          setCurrentView={navigateTo} isConnected={isConnected} serverAddress={serverAddress} 
          setServerAddress={setServerAddress} password={password} setPassword={setPassword} 
          connectToOBS={connectToOBS} obsError={obsError} handleLogout={handleLogout} presets={presets}
          theme={theme} toggleTheme={toggleTheme}
        />
        <div style={{ display: 'none' }}>
          {memoizedTwitchChat}
        </div>
        <ToastNotification toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  // VISTA 6: Editor Principal Web (Avatar y Chat)
  return (
    <div className="app-layout">
      {currentView !== 'chat' && (
        <div style={{ display: 'none' }}>
          {memoizedTwitchChat}
        </div>
      )}

      <EditorHeader 
        currentView={currentView} setCurrentView={navigateTo} avatarLinkGenerated={avatarLinkGenerated} 
        chatLinkGenerated={chatLinkGenerated} twitchInput={twitchInput} isConnected={isConnected} 
        serverAddress={serverAddress} setServerAddress={setServerAddress} password={password} 
        setPassword={setPassword} connectToOBS={connectToOBS} handleLogout={handleLogout} obsError={obsError}
        presets={presets} theme={theme} toggleTheme={toggleTheme}
      />

      <div className="editor-body">
        
        <div className="mobile-tabs">
          <button 
            className={`mobile-tab ${mobileTab === 'settings' ? 'active' : ''}`}
            onClick={() => setMobileTab('settings')}
          >
            <span className="material-symbols-outlined">settings</span> Ajustes
          </button>
          {currentView === 'pngtuber' && (
            <button 
              className={`mobile-tab ${mobileTab === 'preview' ? 'active' : ''}`}
              onClick={() => setMobileTab('preview')}
            >
              <span className="material-symbols-outlined">visibility</span> Vista Previa
            </button>
          )}
        </div>

        <div 
          className={`sidebar ${currentView === 'chat' ? 'full-width' : ''} ${currentView === 'pngtuber' && mobileTab === 'preview' ? 'mobile-hidden' : ''}`}
          style={{ width: currentView === 'pngtuber' ? sidebarWidth : undefined }}
        >
          <SettingsPanel 
            currentView={currentView} twitchInput={twitchInput} setTwitchInput={setTwitchInput}
            chatConfig={chatConfig} setChatConfig={setChatConfig} defaultChatConfig={defaultChatConfig}
            selectedMic={selectedMic} setSelectedMic={setSelectedMic} availableMics={availableMics} 
            sensitivity={sensitivity} setSensitivity={setSensitivity} blinkFrequency={blinkFrequency} 
            setBlinkFrequency={setBlinkFrequency} isRandomBlink={isRandomBlink} setIsRandomBlink={setIsRandomBlink}
            talkIntensity={talkIntensity} setTalkIntensity={setTalkIntensity} idleIntensity={idleIntensity} setIdleIntensity={setIdleIntensity}
            isVoiceReactive={isVoiceReactive} setIsVoiceReactive={setIsVoiceReactive}
            talkAnimation={talkAnimation} setTalkAnimation={setTalkAnimation} idleAnimation={idleAnimation} setIdleAnimation={setIdleAnimation}
            handleImageUpload={handleImageUpload} handleClearImage={handleClearImage}
            isSelectOpen={isSelectOpen} setIsSelectOpen={setIsSelectOpen} images={images} currentVolume={currentVolume} 
            isTalking={activeTalkingState} fileError={fileError} isConnected={isConnected} chatPreview={memoizedTwitchChat}
            presets={presets} activePresetId={activePresetId} setActivePresetId={setActivePresetId}
            activePreset={activePreset} addPreset={addPreset} duplicatePreset={duplicatePreset}
            deletePreset={deletePreset} updatePresetName={updatePresetName} updatePresetTrigger={updatePresetTrigger}
          />
        </div>
        
        {currentView === 'pngtuber' && (
          <>
            <div className={`resizer ${mobileTab === 'settings' ? 'mobile-hidden' : ''}`} onMouseDown={() => setIsResizing(true)}></div>
            <div className={`preview-area ${mobileTab === 'settings' ? 'mobile-hidden' : ''}`}>
              <div className={`preview-container bg-${previewBg}`}>
                
                <div className="floating-status">
                  <span className={activeTalkingState ? "dot-listening" : "dot-idle"}>{activeTalkingState ? "●" : "○"}</span>
                  <span className="status-text-label">{activeTalkingState ? "Escuchando..." : "En Reposo"}</span>
                  
                  <button 
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setIsSimulating(true);
                    }}
                    onPointerUp={(e) => {
                      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }
                      setIsSimulating(false);
                    }}
                    onPointerCancel={() => setIsSimulating(false)}
                    className={`header-sim-btn ${isSimulating ? "active" : ""}`}
                    title="Mantén presionado para probar"
                  >
                    <span className="material-symbols-outlined" style={{fontSize: '18px'}}>record_voice_over</span>
                    Hablar
                  </button>
                </div>

                <div className="floating-bar">
                  <button className={`icon-btn ${previewBg === 'grid' ? 'active' : ''}`} onClick={() => setPreviewBg('grid')} title="Fondo Transparente">🏁</button>
                  <button className={`icon-btn ${previewBg === 'chroma' ? 'active' : ''}`} onClick={() => setPreviewBg('chroma')} title="Fondo Croma">🟩</button>
                  <button className={`icon-btn ${previewBg === 'dark' ? 'active' : ''}`} onClick={() => setPreviewBg('dark')} title="Fondo Oscuro">🌙</button>
                </div>
                <Avatar isTalking={activeTalkingState} currentImage={getCurrentImage()} talkIntensity={effectiveTalkIntensity} idleIntensity={idleIntensity} talkAnimation={talkAnimation} idleAnimation={idleAnimation} />
              </div>
            </div>
          </>
        )}
      </div>
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default App;