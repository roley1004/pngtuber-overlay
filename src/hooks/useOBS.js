import { useState, useRef, useEffect } from 'react';
import OBSWebSocket from 'obs-websocket-js';
import { calculateVolumePercentage } from '../utils/obsHelpers';

export function useOBS({
  password, setPassword, serverAddress, isAvatarOverlay, isChatOverlay,
  micRef, sensRef,
  setSelectedMic, setSensitivity, setBlinkFrequency, setIsRandomBlink, setBounceIntensity, setImages,
  setAvailableMics, setCurrentVolume, setIsTalking,
  selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, images,
  twitchInput, setTwitchInput, chatConfig, setChatConfig
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [obsError, setObsError] = useState('');
  const obs = useRef(new OBSWebSocket());
  const knownMics = useRef(new Set());
  const isConnecting = useRef(false); 

  // Serialización para evitar problemas de renderizados y ciclos infinitos
  const imagesStr = JSON.stringify(images || {});
  const chatConfigStr = JSON.stringify(chatConfig || {});

  // 1. Heartbeat Constante (Sincronización en vivo SIN IMÁGENES para no saturar)
  useEffect(() => {
    if (isConnected && !isAvatarOverlay && !isChatOverlay && obs.current) {
      const syncData = () => {
        obs.current.call('BroadcastCustomEvent', {
          eventData: { action: 'SYNC_PNGTUBER', data: { selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig } }
        }).catch(() => {});
      };
      syncData();
      const interval = setInterval(syncData, 3000); 
      return () => clearInterval(interval);
    }
  }, [selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfigStr, isConnected, isAvatarOverlay, isChatOverlay]);

  // 2. Evento Instantáneo de Imágenes (¡NUEVO!)
  // Solo se dispara una vez en vivo cuando subes o cambias una imagen.
  useEffect(() => {
    if (isConnected && !isAvatarOverlay && !isChatOverlay && obs.current) {
      const payloadBase = { selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, twitchInput, chatConfig };
      
      // Transmite la imagen inmediatamente para que el OBS la muestre sin tener que recargar
      obs.current.call('BroadcastCustomEvent', {
        eventData: { action: 'SYNC_IMAGES', data: { images } }
      }).catch(() => {});

      // Además lo guardamos en la memoria persistente por si cierras el programa
      obs.current.call('SetPersistentData', {
        realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE',
        slotName: 'StreamTools_PNGTuber',
        slotValue: { ...payloadBase, images }
      }).catch(() => {
        // Fallback: Si la imagen pesa mucho, guarda al menos la configuración
        obs.current.call('SetPersistentData', {
          realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE',
          slotName: 'StreamTools_PNGTuber',
          slotValue: payloadBase
        }).catch(() => {});
      });
    }
  }, [selectedMic, sensitivity, blinkFrequency, isRandomBlink, bounceIntensity, imagesStr, twitchInput, chatConfigStr, isConnected, isAvatarOverlay, isChatOverlay]);

  const handleLogout = () => {
    try { obs.current.disconnect() } catch (e) {}
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

      // Carga configuración persistente inicial
      if (isAvatarOverlay || isChatOverlay) {
        try {
          const data = await obs.current.call('GetPersistentData', {
            realm: 'OBS_WEBSOCKET_DATA_REALM_PROFILE',
            slotName: 'StreamTools_PNGTuber'
          });
          if (data && data.slotValue) {
            const val = data.slotValue;
            if (val.selectedMic !== undefined && setSelectedMic) setSelectedMic(val.selectedMic);
            if (val.sensitivity !== undefined && setSensitivity) setSensitivity(val.sensitivity);
            if (val.blinkFrequency !== undefined && setBlinkFrequency) setBlinkFrequency(val.blinkFrequency);
            if (val.isRandomBlink !== undefined && setIsRandomBlink) setIsRandomBlink(val.isRandomBlink);
            if (val.bounceIntensity !== undefined && setBounceIntensity) setBounceIntensity(val.bounceIntensity);
            if (val.images && setImages) setImages(val.images); 
            if (val.twitchInput !== undefined && setTwitchInput) setTwitchInput(val.twitchInput);
            if (val.chatConfig !== undefined && setChatConfig) setChatConfig(val.chatConfig);
          }
        } catch (err) { console.error("Error GetPersistent", err); }
      }

      // Escuchador de eventos en vivo
      obs.current.on('CustomEvent', (event) => {
        if (event && (isAvatarOverlay || isChatOverlay)) {
          const { data } = event;
          
          if (event.action === 'SYNC_PNGTUBER') {
            if (data.selectedMic !== undefined && setSelectedMic) setSelectedMic(data.selectedMic);
            if (data.sensitivity !== undefined && setSensitivity) setSensitivity(data.sensitivity);
            if (data.blinkFrequency !== undefined && setBlinkFrequency) setBlinkFrequency(data.blinkFrequency);
            if (data.isRandomBlink !== undefined && setIsRandomBlink) setIsRandomBlink(data.isRandomBlink);
            if (data.bounceIntensity !== undefined && setBounceIntensity) setBounceIntensity(data.bounceIntensity);
            if (data.twitchInput !== undefined && setTwitchInput) setTwitchInput(data.twitchInput);
            if (data.chatConfig !== undefined && setChatConfig) setChatConfig(data.chatConfig);
          } 
          // Atrapa la actualización instantánea de las imágenes
          else if (event.action === 'SYNC_IMAGES') {
            if (data.images && setImages) {
              setImages(data.images);
              Object.entries(data.images).forEach(([key, val]) => {
                if (val) localStorage.setItem(`obs-pngtuber-img-${key}`, val);
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
          if (setIsTalking && sensRef) setIsTalking(maxVolume > sensRef.current);
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