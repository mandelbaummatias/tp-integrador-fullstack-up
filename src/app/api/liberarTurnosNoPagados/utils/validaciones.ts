import { ReservaPendienteConTurno } from "../interface/ReservaPendienteConTurno";

/**
 * Valida si una reserva pendiente de pago en efectivo debe ser liberada.
 * La liberación ocurre si la hora actual es posterior a 2 horas antes de la fecha y hora del turno.
 *
 * @param reserva La reserva pendiente de pago en efectivo con su turno asociado.
 * @param ahora La fecha y hora actual.
 * @returns true si la reserva debe ser liberada, false en caso contrario.
 */
const debeLiberarReserva = (reserva: ReservaPendienteConTurno, ahora: Date): boolean => {
  const fechaLimite = new Date(reserva.turno.fechaHora);
  fechaLimite.setHours(fechaLimite.getHours() - 2);
  return ahora > fechaLimite;
};

export {
  debeLiberarReserva
};