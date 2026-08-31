import { useState, useRef, useEffect, useCallback } from 'react';
import OBSWebSocket from 'obs-websocket-js';
import { calculateVolumePercentage, buildPngTuberPayload } from '../utils/obsHelpers';

export function useOBS({
  password, setPassword, serverAddress, isAvatarOverlay, isChatOverlay, isDockMode,
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

  // Función reutilizable para aplicar datos de sincronización
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

  // Mantenemos referencias actualizadas sin forzar la serialización con JSON.stringify
  const imagesRef = useRef(images);
  const presetsRef = useRef(presets);
  const activePresetIdRef = useRef(activePresetId);
  const payloadRef = useRef(null);

  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => { presetsRef.current = presets; }, [presets]);
  useEffect(() => { activePresetIdRef.current = activePresetId; }, [activePresetId]);

  useEffect(() => {
    payloadRef.current = buildPngTuberPayload({
      selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig,
      talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
      activePresetId, presets
    });
  }, [
    selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig,
    talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
    activePresetId, presets
  ]);

  useEffect(() => {
    return () => {
      if (talkingTimeoutRef.current) clearTimeout(talkingTimeoutRef.current);
    };
  }, []);

  // Función exclusiva para que el Dock cambie de avatar sin destruir configuraciones previas de OBS
  const updatePresetGlobal = async (newPresetId) => {
    if (setActivePresetId) setActivePresetId(newPresetId);

    // 1. Envío ultrarrápido por memoria local (BroadcastChannel)
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        const bc = new BroadcastChannel('pngtuber_overlay_sync');
        bc.postMessage({ action: 'CHANGE_PRESET_QUICK', data: { activePresetId: newPresetId } });
        bc.close();
      } catch (e) {}
    }

    // 2. Transmisión a todos los overlays conectados por OBS WebSocket y guardado persistente
    if (isConnected && obs.current) {
      try {
        await obs.current.call('BroadcastCustomEvent', {
          eventData: { action: 'QUICK_PRESET_CHANGE', data: { activePresetId: newPresetId } }
        });

        const data = await obs.current.call('GetPersistentData', {
          realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE',
          slotName: 'StreamTools_PNGTuber'
        });

        if (data?.slotValue) {
          const updatedPayload = { ...data.slotValue, activePresetId: newPresetId };
          await obs.current.call('SetPersistentData', {
            realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE',
            slotName: 'StreamTools_PNGTuber',
            slotValue: updatedPayload
          });
        }
      } catch (err) {
        console.error("Error al actualizar preset global:", err);
      }
    }
  };

  // 1. Escuchador BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;
    const bc = new BroadcastChannel('pngtuber_overlay_sync');

    if (isAvatarOverlay || isChatOverlay || isDockMode) {
      bc.onmessage = (event) => {
        if (event.data?.action === 'SYNC_AVATAR_FULL' && event.data.data) {
          applySyncData(event.data.data);
        } else if (event.data?.action === 'CHANGE_PRESET_QUICK' && event.data.data?.activePresetId) {
          if (setActivePresetId) setActivePresetId(event.data.data.activePresetId);
        }
      };
    }

    return () => bc.close();
  }, [isAvatarOverlay, isChatOverlay, isDockMode, applySyncData, setActivePresetId]);

  // 2. Heartbeat Constante (Solo panel principal de edición)
  useEffect(() => {
    if (isConnected && !isAvatarOverlay && !isChatOverlay && !isDockMode && obs.current) {
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
  }, [isConnected, isAvatarOverlay, isChatOverlay, isDockMode]);

  // 3. Emisión sincronizada con retardo suave (Solo panel principal de edición)
  useEffect(() => {
    if (isAvatarOverlay || isChatOverlay || isDockMode) return;

    const syncTimer = setTimeout(() => {
      const currentPayload = buildPngTuberPayload({
        selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig,
        talkAnimation, idleAnimation, talkIntensity, idleIntensity, isVoiceReactive,
        activePresetId, presets, images
      });

      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        try {
          const bc = new BroadcastChannel('pngtuber_overlay_sync');
          bc.postMessage({ action: 'SYNC_AVATAR_FULL', data: currentPayload });
          bc.close();
        } catch (e) {}
      }

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
        }).catch(() => {});
      }
    }, 150);

    return () => clearTimeout(syncTimer);
  }, [
    images, activePresetId, presets, talkAnimation, idleAnimation,
    talkIntensity, idleIntensity, isVoiceReactive, selectedMic, sensitivity,
    blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig,
    isConnected, isAvatarOverlay, isChatOverlay, isDockMode
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
      
      if (!isAvatarOverlay && !isChatOverlay && !isDockMode) {
        localStorage.setItem('obs-pngtuber-pass', password);
        localStorage.setItem('obs-pngtuber-address', serverAddress);
      }
      setIsConnected(true);
      setObsError('');

      if (isAvatarOverlay || isChatOverlay || isDockMode) {
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

      obs.current.on('CustomEvent', (event) => {
        if (!event) return;
        const evtData = event.eventData || event;
        const action = evtData.action;
        const data = evtData.data;

        if (!isAvatarOverlay && !isChatOverlay && !isDockMode) {
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

        if (isAvatarOverlay || isChatOverlay || isDockMode) {
          if (action === 'SYNC_PNGTUBER' && data) {
            applySyncData(data);
          } 
          else if (action === 'SYNC_IMAGES' && data) {
            if (data.presets && setPresets) setPresets(data.presets);
            if (data.activePresetId && setActivePresetId) setActivePresetId(data.activePresetId);
            if (data.images && setImages) {
              setImages(data.images);
            }
          }
          else if (action === 'QUICK_PRESET_CHANGE' && data?.activePresetId) {
            if (setActivePresetId) setActivePresetId(data.activePresetId);
          }
        }
      });

      if (!isChatOverlay && !isDockMode) {
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
      if (!isAvatarOverlay && !isChatOverlay && !isDockMode) setObsError("Fallo de conexión. Verifica OBS.");
    } finally {
      isConnecting.current = false; 
    }
  };

  return { isConnected, obsError, connectToOBS, handleLogout, updatePresetGlobal };
}