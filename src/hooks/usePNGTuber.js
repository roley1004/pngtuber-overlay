import { useState, useEffect, useRef, useMemo } from 'react';
import { compressImage } from '../utils/imageHelpers';
import {
  getAllPresetsFromDB,
  savePresetToDB,
  deletePresetFromDB,
  createNewPresetObject
} from '../utils/dbHelpers';

export function usePNGTuber({ isAvatarOverlay, isTalking, isSimulating }) {
  // Estados visuales y de configuración básica
  const [fileError, setFileError] = useState('');
  const [isBlinking, setIsBlinking] = useState(false);
  const [previewBg, setPreviewBg] = useState('grid');
  
  // Estados cargados desde el almacenamiento local del navegador (LocalStorage)
  const [selectedMic, setSelectedMic] = useState(localStorage.getItem('obs-pngtuber-mic') || '');
  const [sensitivity, setSensitivity] = useState(parseFloat(localStorage.getItem('obs-pngtuber-sens')) || 25);
  const [blinkFrequency, setBlinkFrequency] = useState(parseFloat(localStorage.getItem('obs-pngtuber-blink-freq')) || 4.0);
  const [isRandomBlink, setIsRandomBlink] = useState(localStorage.getItem('obs-pngtuber-random-blink') === 'true');

  // Catálogo de avatares (presets) y avatar activo seleccionado
  const [presets, setPresets] = useState([]);
  const [activePresetId, setActivePresetId] = useState('');

  const micRef = useRef(selectedMic);
  const sensRef = useRef(sensitivity);

  // Carga inicial de avatares desde IndexedDB al arrancar la aplicación
  useEffect(() => {
    const loadPresets = async () => {
      try {
        let dbPresets = await getAllPresetsFromDB();
        
        // Si la base de datos está vacía, migra datos antiguos o crea el avatar predeterminado
        if (!dbPresets || dbPresets.length === 0) {
          const legacyIdle = localStorage.getItem('obs-pngtuber-img-idle');
          const legacyTalk = localStorage.getItem('obs-pngtuber-img-talk');
          const legacyBlink = localStorage.getItem('obs-pngtuber-img-blink');
          const legacyTalkBlink = localStorage.getItem('obs-pngtuber-img-talkBlink');

          const defaultPreset = {
            id: 'preset_default',
            nombre: 'Yoshi Predeterminado',
            imagenes: {
              idle: legacyIdle || null,
              talk: legacyTalk || null,
              blink: legacyBlink || null,
              talkBlink: legacyTalkBlink || null
            },
            animaciones: {
              talkAnimation: localStorage.getItem('obs-pngtuber-talk-anim') || 'bounce',
              talkIntensity: parseInt(localStorage.getItem('obs-pngtuber-talk-intensity')) || 75,
              idleAnimation: localStorage.getItem('obs-pngtuber-idle-anim') || 'none',
              idleIntensity: parseInt(localStorage.getItem('obs-pngtuber-idle-intensity')) || 50,
              isVoiceReactive: localStorage.getItem('obs-pngtuber-voice-reactive') === 'true'
            },
            disparadores: { hotkey: '', twitchCommand: '' }
          };

          dbPresets = [defaultPreset];
          if (!isAvatarOverlay) {
            await savePresetToDB(defaultPreset);
          }
        }

        setPresets(dbPresets);
        const savedActiveId = localStorage.getItem('obs-pngtuber-active-preset-id');
        if (savedActiveId && dbPresets.some(p => p.id === savedActiveId)) {
          setActivePresetId(savedActiveId);
        } else {
          setActivePresetId(dbPresets[0].id);
        }
      } catch (error) {
        console.error("Error al cargar presets desde IndexedDB:", error);
      }
    };

    loadPresets();
  }, [isAvatarOverlay]);

  // Persiste el ID del avatar seleccionado para recordarlo al reabrir la página
  useEffect(() => {
    if (activePresetId) {
      localStorage.setItem('obs-pngtuber-active-preset-id', activePresetId);
    }
  }, [activePresetId]);

  // Obtiene el objeto completo del avatar que está seleccionado actualmente
  const activePreset = useMemo(() => {
    return presets.find(p => p.id === activePresetId) || presets[0] || null;
  }, [presets, activePresetId]);

  // Función central para modificar cualquier propiedad del avatar activo y guardarlo en IndexedDB
  const updateActivePreset = (updater) => {
    setPresets(prevPresets => {
      const newPresets = prevPresets.map(p => {
        if (p.id === activePresetId) {
          return typeof updater === 'function' ? updater(p) : { ...p, ...updater };
        }
        return p;
      });
      const updatedActive = newPresets.find(p => p.id === activePresetId);
      if (updatedActive && !isAvatarOverlay) {
        savePresetToDB(updatedActive);
      }
      return newPresets;
    });
  };

  // Extrae las variables del avatar activo de forma segura con valores por defecto
  const images = activePreset?.imagenes || { idle: null, talk: null, blink: null, talkBlink: null };
  const talkIntensity = activePreset?.animaciones?.talkIntensity ?? 75;
  const idleIntensity = activePreset?.animaciones?.idleIntensity ?? 50;
  const talkAnimation = activePreset?.animaciones?.talkAnimation ?? 'bounce';
  const idleAnimation = activePreset?.animaciones?.idleAnimation ?? 'none';
  const isVoiceReactive = activePreset?.animaciones?.isVoiceReactive ?? true;

  // Funciones mutadoras para cambiar configuraciones individuales del avatar
  const setTalkIntensity = (val) => {
    const value = typeof val === 'function' ? val(talkIntensity) : val;
    updateActivePreset(p => ({ ...p, animaciones: { ...p.animaciones, talkIntensity: value } }));
  };

  const setIdleIntensity = (val) => {
    const value = typeof val === 'function' ? val(idleIntensity) : val;
    updateActivePreset(p => ({ ...p, animaciones: { ...p.animaciones, idleIntensity: value } }));
  };

  const setTalkAnimation = (val) => {
    const value = typeof val === 'function' ? val(talkAnimation) : val;
    updateActivePreset(p => ({ ...p, animaciones: { ...p.animaciones, talkAnimation: value } }));
  };

  const setIdleAnimation = (val) => {
    const value = typeof val === 'function' ? val(idleAnimation) : val;
    updateActivePreset(p => ({ ...p, animaciones: { ...p.animaciones, idleAnimation: value } }));
  };

  const setIsVoiceReactive = (val) => {
    const value = typeof val === 'function' ? val(isVoiceReactive) : val;
    updateActivePreset(p => ({ ...p, animaciones: { ...p.animaciones, isVoiceReactive: value } }));
  };

  const setImages = (val) => {
    const value = typeof val === 'function' ? val(images) : val;
    updateActivePreset(p => ({ ...p, imagenes: value }));
  };

  // Guarda los cambios del micrófono y sliders en LocalStorage
  useEffect(() => { micRef.current = selectedMic; localStorage.setItem('obs-pngtuber-mic', selectedMic); }, [selectedMic]);
  useEffect(() => { sensRef.current = sensitivity; localStorage.setItem('obs-pngtuber-sens', sensitivity); }, [sensitivity]);
  useEffect(() => { localStorage.setItem('obs-pngtuber-blink-freq', blinkFrequency); }, [blinkFrequency]);
  useEffect(() => { localStorage.setItem('obs-pngtuber-random-blink', isRandomBlink); }, [isRandomBlink]);

  // Temporizador responsable de activar el parpadeo aleatorio o constante
  useEffect(() => {
    let timeoutId;
    const scheduleBlink = () => {
      setIsBlinking(true); setTimeout(() => setIsBlinking(false), 150);
      const nextDelay = isRandomBlink ? (Math.random() * 4 + 2) * 1000 : blinkFrequency * 1000;
      timeoutId = setTimeout(scheduleBlink, nextDelay);
    };
    timeoutId = setTimeout(scheduleBlink, isRandomBlink ? (Math.random() * 4 + 2) * 1000 : blinkFrequency * 1000);
    return () => clearTimeout(timeoutId);
  }, [blinkFrequency, isRandomBlink]);

  // Comprime la imagen seleccionada y la asigna al estado correspondiente del avatar
  const handleImageUpload = async (key, event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      setFileError('');
      
      updateActivePreset(p => ({
        ...p,
        imagenes: { ...p.imagenes, [key]: compressedBase64 }
      }));
    } catch (errorMsg) {
      setFileError(errorMsg);
      setTimeout(() => setFileError(''), 4000);
    }
  };

  // Limpia la imagen de un estado del avatar
  const handleClearImage = async (key, event) => {
    if (event) event.stopPropagation();
    updateActivePreset(p => ({
      ...p,
      imagenes: { ...p.imagenes, [key]: null }
    }));
  };

  // Crea un nuevo avatar vacío
  const addPreset = async (name = 'Nuevo Avatar') => {
    const newPreset = createNewPresetObject(name);
    const updated = [...presets, newPreset];
    setPresets(updated);
    setActivePresetId(newPreset.id);
    if (!isAvatarOverlay) await savePresetToDB(newPreset);
  };

  // Duplica un avatar existente con sus mismas imágenes y ajustes
  const duplicatePreset = async (id) => {
    const target = presets.find(p => p.id === id);
    if (!target) return;
    const cloned = createNewPresetObject(null, target);
    const updated = [...presets, cloned];
    setPresets(updated);
    setActivePresetId(cloned.id);
    if (!isAvatarOverlay) await savePresetToDB(cloned);
  };

  // Elimina un avatar seleccionado de la memoria y base de datos
  const deletePreset = async (id) => {
    if (presets.length <= 1) return;
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    if (activePresetId === id) {
      setActivePresetId(updated[0].id);
    }
    if (!isAvatarOverlay) await deletePresetFromDB(id);
  };

  // Renombra un avatar en la lista
  const updatePresetName = (id, newName) => {
    setPresets(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, nombre: newName } : p);
      const target = updated.find(p => p.id === id);
      if (target && !isAvatarOverlay) savePresetToDB(target);
      return updated;
    });
  };

  // Modifica el comando de Twitch o activadores del avatar
  const updatePresetTrigger = (id, field, value) => {
    setPresets(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          return { ...p, disparadores: { ...p.disparadores, [field]: value } };
        }
        return p;
      });
      const target = updated.find(p => p.id === id);
      if (target && !isAvatarOverlay) savePresetToDB(target);
      return updated;
    });
  };

  // Calcula qué estado del PNGTuber se debe mostrar (reposo, hablar, parpadeo o ambos)
  const getCurrentImage = () => {
    const isActive = isTalking || isSimulating;
    if (isActive && isBlinking) return images.talkBlink || '/talk_blink.png';
    if (isActive && !isBlinking) return images.talk || '/talk.png';
    if (!isActive && isBlinking) return images.blink || '/blink.png';
    return images.idle || '/idle.png';
  };

  return {
    fileError, previewBg, setPreviewBg,
    selectedMic, setSelectedMic, sensitivity, setSensitivity,
    blinkFrequency, setBlinkFrequency, isRandomBlink, setIsRandomBlink,
    talkIntensity, setTalkIntensity, idleIntensity, setIdleIntensity,
    isVoiceReactive, setIsVoiceReactive,
    talkAnimation, setTalkAnimation, idleAnimation, setIdleAnimation, 
    images, setImages, micRef, sensRef, handleImageUpload, handleClearImage, getCurrentImage,
    presets, setPresets, activePresetId, setActivePresetId, activePreset,
    addPreset, duplicatePreset, deletePreset, updatePresetName, updatePresetTrigger
  };
}