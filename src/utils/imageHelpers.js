/**
 * Comprime y redimensiona una imagen subida por el usuario a formato WebP.
 */
export const compressImage = (file, maxSizeMB = 2.5) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject("No se seleccionó ningún archivo.");
    
    if (file.size > maxSizeMB * 1024 * 1024) {
      return reject(`Archivo mayor a ${maxSizeMB}MB. Usa una imagen más ligera.`);
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) { 
            height *= MAX_SIZE / width; 
            width = MAX_SIZE; 
          } else { 
            width *= MAX_SIZE / height; 
            height = MAX_SIZE; 
          }
        }
        
        canvas.width = width; 
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/webp', 0.8);
        resolve(compressedBase64);
      };
      img.onerror = () => reject("Error al procesar la imagen.");
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject("Error al leer el archivo.");
    reader.readAsDataURL(file);
  });
};