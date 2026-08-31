import React from 'react';
import { PresetCarousel } from './PresetCarousel';
import { ImageUploaders } from './ImageUploaders';
import { TwitchTriggerSettings } from './TwitchTriggerSettings';
import { AudioSettings } from './AudioSettings';
import { AnimationSettings } from './AnimationSettings';

// Componente principal de configuración del avatar que orquesta y conecta todos los subcomponentes modulares
export function AvatarSettings({
  isConnected,
  selectedMic, setSelectedMic, availableMics,
  sensitivity, setSensitivity,
  blinkFrequency, setBlinkFrequency,
  isRandomBlink, setIsRandomBlink,
  talkIntensity, setTalkIntensity,
  idleIntensity, setIdleIntensity,
  isVoiceReactive, setIsVoiceReactive,
  talkAnimation, setTalkAnimation,
  idleAnimation, setIdleAnimation,
  isSelectOpen, setIsSelectOpen,
  handleImageUpload, handleClearImage,
  images, currentVolume, fileError,
  presets = [],
  activePresetId,
  setActivePresetId,
  activePreset,
  addPreset,
  duplicatePreset,
  deletePreset,
  updatePresetName,
  updatePresetTrigger
}) {
  return (
    <div className="settings-module">
      {/* Carrusel horizontal y gestión de modelos de avatar */}
      <PresetCarousel
        presets={presets}
        activePresetId={activePresetId}
        setActivePresetId={setActivePresetId}
        activePreset={activePreset}
        addPreset={addPreset}
        duplicatePreset={duplicatePreset}
        deletePreset={deletePreset}
        updatePresetName={updatePresetName}
      />

      <hr className="divider" />

      {/* Carga y vista previa de las imágenes de los estados del avatar */}
      <ImageUploaders
        images={images}
        handleImageUpload={handleImageUpload}
        handleClearImage={handleClearImage}
        fileError={fileError}
      />

      <hr className="divider" />

      {/* Configuración del comando accionador en el chat de Twitch */}
      <TwitchTriggerSettings
        activePresetId={activePresetId}
        activePreset={activePreset}
        presets={presets}
        updatePresetTrigger={updatePresetTrigger}
      />

      <hr className="divider" />

      {/* Configuración de captura de micrófono, sensibilidad y medidor de volumen */}
      <AudioSettings
        isConnected={isConnected}
        selectedMic={selectedMic}
        setSelectedMic={setSelectedMic}
        availableMics={availableMics}
        isSelectOpen={isSelectOpen}
        setIsSelectOpen={setIsSelectOpen}
        sensitivity={sensitivity}
        setSensitivity={setSensitivity}
        currentVolume={currentVolume}
      />

      <hr className="divider" />

      {/* Configuración de parpadeos y físicas de movimiento */}
      <AnimationSettings
        blinkFrequency={blinkFrequency}
        setBlinkFrequency={setBlinkFrequency}
        isRandomBlink={isRandomBlink}
        setIsRandomBlink={setIsRandomBlink}
        talkAnimation={talkAnimation}
        setTalkAnimation={setTalkAnimation}
        talkIntensity={talkIntensity}
        setTalkIntensity={setTalkIntensity}
        isVoiceReactive={isVoiceReactive}
        setIsVoiceReactive={setIsVoiceReactive}
        idleAnimation={idleAnimation}
        setIdleAnimation={setIdleAnimation}
        idleIntensity={idleIntensity}
        setIdleIntensity={setIdleIntensity}
      />
    </div>
  );
}