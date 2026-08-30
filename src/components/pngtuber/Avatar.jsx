import React from 'react';

export function Avatar({ isTalking, currentImage, talkIntensity, idleIntensity, talkAnimation = 'bounce', idleAnimation = 'none' }) {
  // Ajustes calibrados de físicas
  const jumpValue = isTalking ? talkIntensity * 0.2 : 0; 
  const squashY = isTalking ? 1 + (talkIntensity * 0.005) : 1; 
  const squashX = isTalking ? 1 - (talkIntensity * 0.0025) : 1; 
  const maxAngle = isTalking ? talkIntensity * 0.35 : 0; 
  
  const tiltDuration = 0.4 + (talkIntensity * 0.006); 
  const idleScale = idleIntensity * 0.01; 

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end', 
      padding: '15%', boxSizing: 'border-box'
    }}>
      <style>{`
        .idle-container {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          width: 100%;
          height: 100%;
          transition: transform 0.25s ease-out;
          transform-origin: bottom center;
        }

        /* Físicas de Reposo */
        .idle-breath { animation: breath 3.5s ease-in-out infinite; transform-origin: bottom center; }
        @keyframes breath { 
          0%, 100% { transform: scaleY(1) scaleX(1); } 
          50% { transform: scaleY(calc(1 + 0.04 * var(--idle-scale))) scaleX(calc(1 - 0.02 * var(--idle-scale))); } 
        }

        .idle-sway { animation: sway 4s ease-in-out infinite; transform-origin: bottom center; }
        @keyframes sway { 
          0%, 100% { transform: rotate(calc(-6deg * var(--idle-scale))); } 
          50% { transform: rotate(calc(6deg * var(--idle-scale))); } 
        }

        .idle-float { animation: float 4s ease-in-out infinite; transform-origin: center; }
        @keyframes float { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(calc(-15px * var(--idle-scale))); } 
        }

        @keyframes rhythmic-sway {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(calc(var(--max-angle) * 1deg)); }
          75% { transform: rotate(calc(var(--max-angle) * -1deg)); }
          100% { transform: rotate(0deg); }
        }

        .avatar-img {
          max-height: 100%; max-width: 100%; object-fit: contain;
          will-change: transform;
        }
        
        /* Modificadores de Habla */
        .talk-bounce { 
          transform-origin: bottom center; 
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1); 
          transform: translateY(calc(var(--jump) * -1%)); 
        }
        
        .talk-squash { 
          transform-origin: bottom center; 
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1); 
          transform: scaleX(var(--squash-x)) scaleY(var(--squash-y)); 
        }
        
        .talk-tilt { 
          transform-origin: bottom center; 
          animation: var(--sway-anim); 
          transition: transform 0.15s ease; 
        }
      `}</style>

      {/* Si habla, se retira la clase idle para que vuelva suavemente al centro */}
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