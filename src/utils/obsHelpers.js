/**
 * Convierte los niveles de audio crudos de OBS a un porcentaje (0 al 100)
 */
export const calculateVolumePercentage = (channel) => {
  const peak = channel[1] !== undefined ? channel[1] : channel[0];
  const db = 20 * Math.log10(peak || 0.00001);
  return Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
};

/**
 * Agrupa y le da formato al paquete completo de configuración del PNGTuber
 * para transmitirlo a través de OBS WebSocket o BroadcastChannel
 */
export const buildPngTuberPayload = (state) => {
  return {
    selectedMic: state.selectedMic,
    sensitivity: state.sensitivity,
    blinkFrequency: state.blinkFrequency,
    isRandomBlink: state.isRandomBlink,
    bounceIntensity: state.bounceIntensity,
    twitchInput: state.twitchInput,
    chatConfig: state.chatConfig,
    talkAnimation: state.talkAnimation,
    idleAnimation: state.idleAnimation,
    talkIntensity: state.talkIntensity,
    idleIntensity: state.idleIntensity,
    isVoiceReactive: state.isVoiceReactive,
    activePresetId: state.activePresetId,
    presets: state.presets,
    images: state.images
  };
};