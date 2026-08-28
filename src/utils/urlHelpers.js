/**
 * Encripta la dirección y contraseña de OBS en Base64 para usarlas en un enlace
 */
export const encodeOBSConfig = (address, password) => {
  if (!password || !address) return '';
  return btoa(`${address}||${password}`);
};

/**
 * Desencripta el Base64 proveniente de la URL para extraer dirección y contraseña
 */
export const decodeOBSConfig = (encodedString) => {
  if (!encodedString) return {};
  try {
    const [a, p] = atob(encodedString).split('||');
    return { a, p };
  } catch (error) {
    return {};
  }
};