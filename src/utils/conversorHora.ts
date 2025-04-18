/**
 * Obtiene la hora actual ajustada a la zona horaria local.
 *
 * @returns {Date} La hora actual como un objeto `Date` en la zona horaria local.
 */
export const obtenerHoraActualLocal = (): Date => {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  return ahora;
};