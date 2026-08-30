import { useState, useRef, useEffect } from 'react';
import OBSWebSocket from 'obs-websocket-js';
import { calculateVolumePercentage } from '../utils/obsHelpers';

export function useOBS({
  password, setPassword, serverAddress, isAvatarOverlay, isChatOverlay,
  micRef, sensRef,
  setSelectedMic, setSensitivity, setBlinkFrequency, setIsRandomBlink, setBounceIntensity, setImages,
  setAvailableMics, setCurrentVolume, setIsTalking,
  selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, images,
  twitchInput, setTwitchInput, chatConfig, setChatConfig,
  talkAnimation, setTalkAnimation, idleAnimation, setIdleAnimation,
  talkIntensity, setTalkIntensity, idleIntensity, setIdleIntensity,
  isVoiceReactive, setIsVoiceReactive,
  presets, setPresets, activePresetId, setActivePresetId
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [obsError, setObsError] = useState('');
  const obs = useRef(new OBSWebSocket());
  const knownMics = useRef(new Set());
  const isConnecting = useRef(false);
  const talkingTimeoutRef = useRef(null);

  const imagesStr = JSON.stringify(images || {});
  const presetsStr = JSON.stringify(presets || []);
  const chatConfigStr = JSON.stringify(chatConfig || {});

  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [imagesStr]);

  const presetsRef = useRef(presets);
  useEffect(() => { presetsRef.current = presets; }, [presetsStr]);

  const activePresetIdRef = useRef(activePresetId);
  useEffect(() => { activePresetIdRef.current = activePresetId; }, [activePresetId]);

  const payloadRef = useRef({
    selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig,
    talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
    activePresetId, presets
  });

  useEffect(() => {
    payloadRef.current = {
      selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig,
      talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
      activePresetId, presets
    };
  }, [
    selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfigStr,
    talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
    activePresetId, presetsStr
  ]);

  useEffect(() => {
    return () => {
      if (talkingTimeoutRef.current) clearTimeout(talkingTimeoutRef.current);
    };
  }, []);

  // Escuchador BroadcastChannel para sincronización instantánea entre pestañas de navegador
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    const bc = new BroadcastChannel('pngtuber_overlay_sync');

    if (isAvatarOverlay || isChatOverlay) {
      bc.onmessage = (event) => {
        if (!event.data) return;
        const { action, data } = event.data;
        if (action === 'SYNC_AVATAR_FULL' && data) {
          if (data.presets && setPresets) setPresets(data.presets);
          if (data.activePresetId && setActivePresetId) setActivePresetId(data.activePresetId);
          if (data.images && setImages) setImages(data.images);
          if (data.talkAnimation !== undefined && setTalkAnimation) setTalkAnimation(data.talkAnimation);
          if (data.idleAnimation !== undefined && setIdleAnimation) setIdleAnimation(data.idleAnimation);
          if (data.talkIntensity !== undefined && setTalkIntensity) setTalkIntensity(data.talkIntensity);
          if (data.idleIntensity !== undefined && setIdleIntensity) setIdleIntensity(data.idleIntensity);
          if (data.isVoiceReactive !== undefined && setIsVoiceReactive) setIsVoiceReactive(data.isVoiceReactive);
        }
      };
    }

    return () => bc.close();
  }, [isAvatarOverlay, isChatOverlay, setPresets, setActivePresetId, setImages, setTalkAnimation, setIdleAnimation, setTalkIntensity, setIdleIntensity, setIsVoiceReactive]);

  // 1. Heartbeat Constante (Sincronización periódica)
  useEffect(() => {
    if (isConnected && !isAvatarOverlay && !isChatOverlay && obs.current) {
      const syncData = () => {
        obs.current.call('BroadcastCustomEvent', {
          eventData: { 
            action: 'SYNC_PNGTUBER', 
            data: { 
              ...payloadRef.current, 
              images: imagesRef.current,
              activePresetId: activePresetIdRef.current,
              presets: presetsRef.current
            } 
          }
        }).catch(() => {});
      };
      syncData();
      const interval = setInterval(syncData, 3000);
      return () => clearInterval(interval);
    }
  }, [isConnected, isAvatarOverlay, isChatOverlay]);

  // 2. Sincronización instantánea al cambiar Preset/Avatar o modificar configuraciones
  useEffect(() => {
    if (!isAvatarOverlay && !isChatOverlay) {
      const currentPayload = {
        selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig,
        talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
        activePresetId, presets
      };

      // Transmisión directa e instantánea mediante BroadcastChannel
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        try {
          const bc = new BroadcastChannel('pngtuber_overlay_sync');
          bc.postMessage({ action: 'SYNC_AVATAR_FULL', data: { ...currentPayload, images } });
          bc.close();
        } catch (e) {}
      }

      // Transmisión mediante OBS WebSocket
      if (isConnected && obs.current) {
        obs.current.call('BroadcastCustomEvent', {
          eventData: { action: 'SYNC_IMAGES', data: { images, activePresetId, presets } }
        }).catch(() => {});

        obs.current.call('BroadcastCustomEvent', {
          eventData: { action: 'SYNC_PNGTUBER', data: { ...currentPayload, images } }
        }).catch(() => {});

        obs.current.call('SetPersistentData', {
          realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE',
          slotName: 'StreamTools_PNGTuber',
          slotValue: { ...currentPayload, images }
        }).catch(() => {
          obs.current.call('SetPersistentData', {
            realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE',
            slotName: 'StreamTools_PNGTuber',
            slotValue: currentPayload
          }).catch(() => {});
        });
      }
    }
  }, [
    imagesStr,
    activePresetId,
    presetsStr,
    talkAnimation,
    idleAnimation,
    talkIntensity,
    idleIntensity,
    isVoiceReactive,
    selectedMic,
    sensitivity,
    blinkFrequency,
    isRandomBlink,
    bounceIntensity,
    isConnected,
    isAvatarOverlay,
    isChatOverlay
  ]);

  const handleLogout = () => {
    try { obs.current.disconnect(); } catch (e) {}
    setIsConnected(false);
    setPassword('');
    setObsError('');
    localStorage.removeItem('obs-pngtuber-pass');
  };

  const connectToOBS = async () => {
    if (!password || !serverAddress || isConnecting.current || isConnected) return;
    
    isConnecting.current = true;
    setObsError("Conectando...");
    
    try {
      obs.current.removeAllListeners();
      await obs.current.connect(`ws://${serverAddress}`, password, { eventSubscriptions: 4194303 });
      
      if (!isAvatarOverlay && !isChatOverlay) {
        localStorage.setItem('obs-pngtuber-pass', password);
        localStorage.setItem('obs-pngtuber-address', serverAddress);
      }
      setIsConnected(true);
      setObsError('');

      // Carga inicial en el Overlay + Solicitud activa al panel principal
      if (isAvatarOverlay || isChatOverlay) {
        try {
          const data = await obs.current.call('GetPersistentData', {
            realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE',
            slotName: 'StreamTools_PNGTuber'
          });
          if (data && data.slotValue) {
            const val = data.slotValue;
            if (val.presets && setPresets) setPresets(val.presets);
            if (val.activePresetId && setActivePresetId) setActivePresetId(val.activePresetId);
            if (val.selectedMic !== undefined && setSelectedMic) setSelectedMic(val.selectedMic);
            if (val.sensitivity !== undefined && setSensitivity) setSensitivity(val.sensitivity);
            if (val.blinkFrequency !== undefined && setBlinkFrequency) setBlinkFrequency(val.blinkFrequency);
            if (val.isRandomBlink !== undefined && setIsRandomBlink) setIsRandomBlink(val.isRandomBlink);
            if (val.bounceIntensity !== undefined && setBounceIntensity) setBounceIntensity(val.bounceIntensity);
            if (val.images && setImages) setImages(val.images);
            if (val.twitchInput !== undefined && setTwitchInput) setTwitchInput(val.twitchInput);
            if (val.chatConfig !== undefined && setChatConfig) setChatConfig(val.chatConfig);
            if (val.talkAnimation !== undefined && setTalkAnimation) setTalkAnimation(val.talkAnimation);
            if (val.idleAnimation !== undefined && setIdleAnimation) setIdleAnimation(val.idleAnimation);
            if (val.talkIntensity !== undefined && setTalkIntensity) setTalkIntensity(val.talkIntensity);
            if (val.idleIntensity !== undefined && setIdleIntensity) setIdleIntensity(val.idleIntensity);
            if (val.isVoiceReactive !== undefined && setIsVoiceReactive) setIsVoiceReactive(val.isVoiceReactive);
          }
        } catch (err) { console.error("Error GetPersistent", err); }

        obs.current.call('BroadcastCustomEvent', {
          eventData: { action: 'REQUEST_SYNC' }
        }).catch(() => {});
      }

      // Escuchador de eventos personalizados con lectura corregida
      obs.current.on('CustomEvent', (event) => {
        if (!event) return;
        const evtData = event.eventData || event;
        const action = evtData.action;
        const data = evtData.data;

        // El Panel principal responde a peticiones del Overlay
        if (!isAvatarOverlay && !isChatOverlay) {
          if (action === 'REQUEST_SYNC') {
            obs.current.call('BroadcastCustomEvent', {
              eventData: { 
                action: 'SYNC_PNGTUBER', 
                data: { 
                  ...payloadRef.current, 
                  images: imagesRef.current,
                  activePresetId: activePresetIdRef.current,
                  presets: presetsRef.current
                } 
              }
            }).catch(() => {});
            obs.current.call('BroadcastCustomEvent', {
              eventData: { 
                action: 'SYNC_IMAGES', 
                data: { 
                  images: imagesRef.current,
                  activePresetId: activePresetIdRef.current,
                  presets: presetsRef.current
                } 
              }
            }).catch(() => {});
          }
        }

        // El Overlay aplica los cambios recibidos
        if (isAvatarOverlay || isChatOverlay) {
          if (action === 'SYNC_PNGTUBER' && data) {
            if (data.presets && setPresets) setPresets(data.presets);
            if (data.activePresetId && setActivePresetId) setActivePresetId(data.activePresetId);
            if (data.selectedMic !== undefined && setSelectedMic) setSelectedMic(data.selectedMic);
            if (data.sensitivity !== undefined && setSensitivity) setSensitivity(data.sensitivity);
            if (data.blinkFrequency !== undefined && setBlinkFrequency) setBlinkFrequency(data.blinkFrequency);
            if (data.isRandomBlink !== undefined && setIsRandomBlink) setIsRandomBlink(data.isRandomBlink);
            if (data.bounceIntensity !== undefined && setBounceIntensity) setBounceIntensity(data.bounceIntensity);
            if (data.twitchInput !== undefined && setTwitchInput) setTwitchInput(data.twitchInput);
            if (data.chatConfig !== undefined && setChatConfig) setChatConfig(data.chatConfig);
            if (data.talkAnimation !== undefined && setTalkAnimation) setTalkAnimation(data.talkAnimation);
            if (data.idleAnimation !== undefined && setIdleAnimation) setIdleAnimation(data.idleAnimation);
            if (data.talkIntensity !== undefined && setTalkIntensity) setTalkIntensity(data.talkIntensity);
            if (data.idleIntensity !== undefined && setIdleIntensity) setIdleIntensity(data.idleIntensity);
            if (data.isVoiceReactive !== undefined && setIsVoiceReactive) setIsVoiceReactive(data.isVoiceReactive);
            if (data.images && setImages) setImages(data.images);
          } 
          else if (action === 'SYNC_IMAGES' && data) {
            if (data.presets && setPresets) setPresets(data.presets);
            if (data.activePresetId && setActivePresetId) setActivePresetId(data.activePresetId);
            if (data.images && setImages) {
              setImages(data.images);
              Object.entries(data.images).forEach(([key, val]) => {
                if (val) localStorage.setItem(`obs-pngtuber-img-${key}`, val);
                else localStorage.removeItem(`obs-pngtuber-img-${key}`);
              });
            }
          }
        }
      });

      if (!isChatOverlay) {
        obs.current.on('InputVolumeMeters', (data) => {
          let maxVolume = 0;
          let newMicsFound = false;
          data.inputs.forEach(input => {
            if (!knownMics.current.has(input.inputName)) { knownMics.current.add(input.inputName); newMicsFound = true; }
            if (micRef && input.inputName === micRef.current && input.inputLevelsMul) {
              input.inputLevelsMul.forEach(channel => { 
                const percent = calculateVolumePercentage(channel);
                if (percent > maxVolume) maxVolume = percent;
              });
            }
          });
          if (newMicsFound && setAvailableMics) {
            const micList = Array.from(knownMics.current);
            setAvailableMics(micList);
            if (micRef && !micRef.current && micList.length > 0 && setSelectedMic) setSelectedMic(micList[0]);
          }
          if (setCurrentVolume) setCurrentVolume(maxVolume);

          // Lógica con histéresis y retardo
          if (setIsTalking && sensRef) {
            const turnOnThreshold = sensRef.current + 2.0;

            if (maxVolume >= turnOnThreshold) {
              if (talkingTimeoutRef.current) {
                clearTimeout(talkingTimeoutRef.current);
                talkingTimeoutRef.current = null;
              }
              setIsTalking(true);
            } else if (maxVolume < sensRef.current) {
              if (!talkingTimeoutRef.current) {
                talkingTimeoutRef.current = setTimeout(() => {
                  setIsTalking(false);
                  talkingTimeoutRef.current = null;
                }, 250);
              }
            }
          }
        });
      }
    } catch (error) {
      setIsConnected(false);
      if (!isAvatarOverlay && !isChatOverlay) setObsError("Fallo de conexión. Verifica OBS.");
    } finally {
      isConnecting.current = false; 
    }
  };

  return { isConnected, obsError, connectToOBS, handleLogout };
}