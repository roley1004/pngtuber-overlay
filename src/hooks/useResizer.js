import { useState, useEffect } from 'react';

// Maneja la lógica para arrastrar y cambiar el ancho del panel lateral
export function useResizer(initialWidth = 360) {
  const [sidebarWidth, setSidebarWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const maxWidth = window.innerWidth * 0.4; // 40% máximo de la pantalla
      const newWidth = Math.max(320, Math.min(e.clientX, maxWidth)); // 320px mínimo
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => setIsResizing(false);
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return { sidebarWidth, isResizing, setIsResizing };
}