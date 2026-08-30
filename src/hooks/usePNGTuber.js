import { useState, useEffect, useRef, useMemo } from 'react';
import { compressImage } from '../utils/imageHelpers';

const DB_NAME = 'pngtuber-db';
const STORE_NAME = 'presets';
const DB_VERSION = 2;

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getAllPresetsFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const savePresetToDB = async (preset) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(preset);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const deletePresetFromDB = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const createNewPresetObject = (name = 'Nuevo Avatar', basePreset = null) => {
  const id = `preset_${Date.now()}`;
  if (basePreset) {
    return {
      ...JSON.parse(JSON.stringify(basePreset)),
      id,
      nombre: `${basePreset.nombre} (Copia)`
    };
  }
  return {
    id,
    nombre: name,
    imagenes: { idle: null, talk: null, blink: null, talkBlink: null },
    animaciones: {
      talkAnimation: 'bounce',
      talkIntensity: 75,
      idleAnimation: 'none',
      idleIntensity: 50,
      isVoiceReactive: true
    },
    disparadores: { hotkey: '', twitchCommand: '' }
  };
};

export function usePNGTuber({ isAvatarOverlay, isTalking, isSimulating }) {
  const [fileError, setFileError] = useState('');
  const [isBlinking, setIsBlinking] = useState(false);
  const [previewBg, setPreviewBg] = useState('grid');
  
  const [selectedMic, setSelectedMic] = useState(localStorage.getItem('obs-pngtuber-mic') || '');
  const [sensitivity, setSensitivity] = useState(parseFloat(localStorage.getItem('obs-pngtuber-sens')) || 25);
  const [blinkFrequency, setBlinkFrequency] = useState(parseFloat(localStorage.getItem('obs-pngtuber-blink-freq')) || 4.0);
  const [isRandomBlink, setIsRandomBlink] = useState(localStorage.getItem('obs-pngtuber-random-blink') === 'true');

  const [presets, setPresets] = useState([]);
  const [activePresetId, setActivePresetId] = useState('');

  const micRef = useRef(selectedMic);
  const sensRef = useRef(sensitivity);

  // Carga inicial y migración de presets desde IndexedDB
  useEffect(() => {
    const loadPresets = async () => {
      try {
        let dbPresets = await getAllPresetsFromDB();
        
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

  useEffect(() => {
    if (activePresetId) {
      localStorage.setItem('obs-pngtuber-active-preset-id', activePresetId);
    }
  }, [activePresetId]);

  const activePreset = useMemo(() => {
    return presets.find(p => p.id === activePresetId) || presets[0] || null;
  }, [presets, activePresetId]);

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

  const images = activePreset?.imagenes || { idle: null, talk: null, blink: null, talkBlink: null };
  const talkIntensity = activePreset?.animaciones?.talkIntensity ?? 75;
  const idleIntensity = activePreset?.animaciones?.idleIntensity ?? 50;
  const talkAnimation = activePreset?.animaciones?.talkAnimation ?? 'bounce';
  const idleAnimation = activePreset?.animaciones?.idleAnimation ?? 'none';
  const isVoiceReactive = activePreset?.animaciones?.isVoiceReactive ?? true;

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

  useEffect(() => { micRef.current = selectedMic; localStorage.setItem('obs-pngtuber-mic', selectedMic); }, [selectedMic]);
  useEffect(() => { sensRef.current = sensitivity; localStorage.setItem('obs-pngtuber-sens', sensitivity); }, [sensitivity]);
  useEffect(() => { localStorage.setItem('obs-pngtuber-blink-freq', blinkFrequency); }, [blinkFrequency]);
  useEffect(() => { localStorage.setItem('obs-pngtuber-random-blink', isRandomBlink); }, [isRandomBlink]);

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

  const handleClearImage = async (key, event) => {
    if (event) event.stopPropagation();
    updateActivePreset(p => ({
      ...p,
      imagenes: { ...p.imagenes, [key]: null }
    }));
  };

  const addPreset = async (name = 'Nuevo Avatar') => {
    const newPreset = createNewPresetObject(name);
    const updated = [...presets, newPreset];
    setPresets(updated);
    setActivePresetId(newPreset.id);
    if (!isAvatarOverlay) await savePresetToDB(newPreset);
  };

  const duplicatePreset = async (id) => {
    const target = presets.find(p => p.id === id);
    if (!target) return;
    const cloned = createNewPresetObject(null, target);
    const updated = [...presets, cloned];
    setPresets(updated);
    setActivePresetId(cloned.id);
    if (!isAvatarOverlay) await savePresetToDB(cloned);
  };

  const deletePreset = async (id) => {
    if (presets.length <= 1) return;
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    if (activePresetId === id) {
      setActivePresetId(updated[0].id);
    }
    if (!isAvatarOverlay) await deletePresetFromDB(id);
  };

  const updatePresetName = (id, newName) => {
    setPresets(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, nombre: newName } : p);
      const target = updated.find(p => p.id === id);
      if (target && !isAvatarOverlay) savePresetToDB(target);
      return updated;
    });
  };

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