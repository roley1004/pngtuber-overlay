// Configuración básica de IndexedDB v2 para guardar los modelos del PNGTuber
const DB_NAME = 'pngtuber-db';
const STORE_NAME = 'presets';
const DB_VERSION = 2;

// Inicializa y abre la conexión con la base de datos del navegador
export const initDB = () => {
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

// Obtiene la lista completa de avatares guardados en IndexedDB
export const getAllPresetsFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

// Guarda o actualiza un avatar en la base de datos local
export const savePresetToDB = async (preset) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(preset);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Elimina un avatar de la base de datos local por su ID
export const deletePresetFromDB = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Crea la estructura inicial para un nuevo avatar o una copia de uno existente
export const createNewPresetObject = (name = 'Nuevo Avatar', basePreset = null) => {
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