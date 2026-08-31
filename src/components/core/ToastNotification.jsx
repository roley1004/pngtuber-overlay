import React, { useState, useEffect } from 'react';

// Muestra avisos flotantes temporales en la parte inferior de la pantalla
export function ToastNotification({ toast, onClose }) {
  const [isHovered, setIsHovered] = useState(false);

  // Oculta la notificación automáticamente tras 5 segundos si el cursor no está encima
  useEffect(() => {
    if (!toast) return;
    if (isHovered) return;

    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast, isHovered, onClose]);

  if (!toast) return null;

  return (
    <div 
      className={`toast-container toast-${toast.type || 'success'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{toast.type === 'alert' ? '⚠️' : '✔️'}</span>
      <span>{toast.message}</span>
      <button className="toast-close-btn" onClick={onClose}>×</button>
    </div>
  );
}