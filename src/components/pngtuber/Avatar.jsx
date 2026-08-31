import React from 'react';
import './Avatar.css';

// Renderiza el avatar aplicando físicas adaptativas de forma optimizada sin inyección constante de CSS
export function Avatar({ isTalking, currentImage, talkIntensity, idleIntensity, talkAnimation = 'bounce', idleAnimation = 'none' }) {
  const jumpValue = isTalking ? talkIntensity * 0.2 : 0; 
  const squashY = isTalking ? 1 + (talkIntensity * 0.005) : 1; 
  const squashX = isTalking ? 1 - (talkIntensity * 0.0025) : 1; 
  const maxAngle = isTalking ? talkIntensity * 0.35 : 0; 
  
  const tiltDuration = 0.4 + (talkIntensity * 0.006); 
  const idleScale = idleIntensity * 0.01; 

  return (
    <div className="avatar-wrapper">
      <div 
        className={`idle-container ${!isTalking && idleAnimation !== 'none' ? `idle-${idleAnimation}` : ''}`} 
        style={{ '--idle-scale': idleScale }}
      >
        <img 
          className={`avatar-img talk-${talkAnimation}`}
          src={currentImage} 
          alt="PNGTuber Avatar" 
          style={{
            '--jump': jumpValue,
            '--squash-x': squashX,
            '--squash-y': squashY,
            '--max-angle': maxAngle,
            '--sway-anim': isTalking ? `rhythmic-sway ${tiltDuration}s ease-in-out infinite` : 'none',
            transform: !isTalking && talkAnimation === 'tilt' ? 'rotate(0deg)' : undefined
          }} 
        />
      </div>
    </div>
  );
}