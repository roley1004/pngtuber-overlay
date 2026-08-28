/**
 * Convierte los niveles de audio crudos de OBS a un porcentaje (0 al 100)
 */
export const calculateVolumePercentage = (channel) => {
  const peak = channel[1] !== undefined ? channel[1] : channel[0];
  const db = 20 * Math.log10(peak || 0.00001);
  return Math.max(0, Math.min(100, ((db + 60) / 60) * 100));
};