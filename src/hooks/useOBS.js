import { useState, useRef, useEffect, useCallback } from 'react';
import OBSWebSocket from 'obs-websocket-js';
import { calculateVolumePercentage, buildPngTuberPayload } from '../utils/obsHelpers';

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

  // Función reutilizable para aplicar datos de sincronización recibidos del panel o del overlay
  const applySyncData = useCallback((data) => {
    if (!data) return;
    if (data.presets && setPresets) setPresets(data.presets);
    if (data.activePresetId && setActivePresetId) setActivePresetId(data.activePresetId);
    if (data.selectedMic !== undefined && setSelectedMic) setSelectedMic(data.selectedMic);
    if (data.sensitivity !== undefined && setSensitivity) setSensitivity(data.sensitivity);
    if (data.blinkFrequency !== undefined && setBlinkFrequency) setBlinkFrequency(data.blinkFrequency);
    if (data.isRandomBlink !== undefined && setIsRandomBlink) setIsRandomBlink(data.isRandomBlink);
    if (data.bounceIntensity !== undefined && setBounceIntensity) setBounceIntensity(data.bounceIntensity);
    if (data.images && setImages) setImages(data.images);
    if (data.twitchInput !== undefined && setTwitchInput) setTwitchInput(data.twitchInput);
    if (data.chatConfig !== undefined && setChatConfig) setChatConfig(data.chatConfig);
    if (data.talkAnimation !== undefined && setTalkAnimation) setTalkAnimation(data.talkAnimation);
    if (data.idleAnimation !== undefined && setIdleAnimation) setIdleAnimation(data.idleAnimation);
    if (data.talkIntensity !== undefined && setTalkIntensity) setTalkIntensity(data.talkIntensity);
    if (data.idleIntensity !== undefined && setIdleIntensity) setIdleIntensity(data.idleIntensity);
    if (data.isVoiceReactive !== undefined && setIsVoiceReactive) setIsVoiceReactive(data.isVoiceReactive);
  }, [
    setPresets, setActivePresetId, setSelectedMic, setSensitivity,
    setBlinkFrequency, setIsRandomBlink, setBounceIntensity, setImages,
    setTwitchInput, setChatConfig, setTalkAnimation, setIdleAnimation,
    setTalkIntensity, setIdleIntensity, setIsVoiceReactive
  ]);

  const imagesStr = JSON.stringify(images || {});
  const presetsStr = JSON.stringify(presets || []);
  const chatConfigStr = JSON.stringify(chatConfig || {});

  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [imagesStr]);

  const presetsRef = useRef(presets);
  useEffect(() => { presetsRef.current = presets; }, [presetsStr]);

  const activePresetIdRef = useRef(activePresetId);
  useEffect(() => { activePresetIdRef.current = activePresetId; }, [activePresetId]);

  // Construcción limpia del paquete de datos usando la función auxiliar de obsHelpers.js
  const payloadRef = useRef(buildPngTuberPayload({
    selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig,
    talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
    activePresetId, presets
  }));

  useEffect(() => {
    payloadRef.current = buildPngTuberPayload({
      selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig,
      talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
      activePresetId, presets
    });
  }, [
    selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfigStr,
    talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
    activePresetId, presetsStr
  ]);

  // Limpieza del temporizador de habla al desmontar el hook
  useEffect(() => {
    return () => {
      if (talkingTimeoutRef.current) clearTimeout(talkingTimeoutRef.current);
    };
  }, []);

  // 1. Escuchador BroadcastChannel: Sincronización instantánea entre pestañas locales del navegador
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    const bc = new BroadcastChannel('pngtuber_overlay_sync');

    if (isAvatarOverlay || isChatOverlay) {
      bc.onmessage = (event) => {
        if (event.data?.action === 'SYNC_AVATAR_FULL' && event.data.data) {
          applySyncData(event.data.data);
        }
      };
    }

    return () => bc.close();
  }, [isAvatarOverlay, isChatOverlay, applySyncData]);

  // 2. Heartbeat Constante: Transmisión periódica cada 3 segundos hacia OBS WebSocket
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

  // 3. Emisión instantánea: Dispara los cambios a BroadcastChannel y OBS WebSocket inmediatamente al interactuar con la UI
  useEffect(() => {
    if (!isAvatarOverlay && !isChatOverlay) {
      const currentPayload = buildPngTuberPayload({
        selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig,
        talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
        activePresetId, presets, images
      });

      // Transmisión local entre pestañas
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        try {
          const bc = new BroadcastChannel('pngtuber_overlay_sync');
          bc.postMessage({ action: 'SYNC_AVATAR_FULL', data: currentPayload });
          bc.close();
        } catch (e) {}
      }

      // Transmisión y persistencia en OBS Studio
      if (isConnected && obs.current) {
        obs.current.call('BroadcastCustomEvent', {
          eventData: { action: 'SYNC_IMAGES', data: { images, activePresetId, presets } }
        }).catch(() => {});

        obs.current.call('BroadcastCustomEvent', {
          eventData: { action: 'SYNC_PNGTUBER', data: currentPayload }
        }).catch(() => {});

        obs.current.call('SetPersistentData', {
          realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE',
          slotName: 'StreamTools_PNGTuber',
          slotValue: currentPayload
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
    imagesStr, activePresetId, presetsStr, talkAnimation, idleAnimation,
    talkIntensity, idleIntensity, isVoiceReactive, selectedMic, sensitivity,
    blinkFrequency, isRandomBlink, bounceIntensity, isConnected, isAvatarOverlay, isChatOverlay
  ]);

  // Cierra la conexión de OBS y limpia las credenciales en LocalStorage
  const handleLogout = () => {
    try { obs.current.disconnect(); } catch (e) {}
    setIsConnected(false);
    setPassword('');
    setObsError('');
    localStorage.removeItem('obs-pngtuber-pass');
  };

  // Conexión principal con OBS WebSocket v5
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

      // Carga de configuración persistente desde OBS Studio al iniciar el overlay
      if (isAvatarOverlay || isChatOverlay) {
        try {
          const data = await obs.current.call('GetPersistentData', {
            realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE',
            slotName: 'StreamTools_PNGTuber'
          });
          if (data?.slotValue) {
            applySyncData(data.slotValue);
          }
        } catch (err) { console.error("Error GetPersistent", err); }

        obs.current.call('BroadcastCustomEvent', {
          eventData: { action: 'REQUEST_SYNC' }
        }).catch(() => {});
      }

      // Escucha de eventos personalizados provenientes de OBS
      obs.current.on('CustomEvent', (event) => {
        if (!event) return;
        const evtData = event.eventData || event;
        const action = evtData.action;
        const data = evtData.data;

        // Responder a peticiones del overlay desde el panel principal
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

        // Aplicar datos recibidos en el overlay
        if (isAvatarOverlay || isChatOverlay) {
          if (action === 'SYNC_PNGTUBER' && data) {
            applySyncData(data);
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

      // Captura de niveles de volumen en tiempo real
      if (!isChatOverlay) {
        obs.current.on('InputVolumeMeters', (data) => {
          let maxVolume = 0;
          let newMicsFound = false;
          data.inputs.forEach(input => {
            if (!knownMics.current.has(input.inputName)) { 
              knownMics.current.add(input.inputName); 
              newMicsFound = true; 
            }
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

          // Control de animación 'hablando' mediante detección de umbral e histéresis
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