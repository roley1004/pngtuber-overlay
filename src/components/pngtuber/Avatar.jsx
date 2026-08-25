import React from 'react';

export function Avatar({ isTalking, currentImage, bounceIntensity }) {
  // Calculamos la altura del rebote basada en la intensidad (0 a 100)
  // Multiplicamos por 0.2 para que el porcentaje sea manejable y no salga de la pantalla
  const jumpValue = isTalking ? bounceIntensity * 0.2 : 0; 

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end', /* Ancla la imagen abajo para que salte hacia arriba */
      padding: '15%', /* Margen de seguridad superior y lateral para evitar recortes */
      boxSizing: 'border-box'
    }}>
      <img 
        src={currentImage || '/idle.png'} 
        alt="PNGTuber Avatar" 
        style={{
          maxHeight: '100%',
          maxWidth: '100%',
          objectFit: 'contain',
          transform: `translateY(-${jumpValue}%)`,
          transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)' /* Curva de animación más suave y natural */
        }} 
      />
    </div>
  );
}