import { NextResponse } from 'next/server';

import { obtenerHoraActualLocal } from '@/utils/conversorHora';
import { TurnoConReserva } from '../interface/TurnoConReserva';

/**
 * Valida si se proporciona un ID de turno.
 * @param turnoId string - El ID del turno a validar.
 * @returns NextResponse | null - Retorna una respuesta de error (JSON con código de estado 400) si el ID no es proporcionado. Si el ID es proporcionado, retorna null.
 */
const validarTurnoId = (turnoId: string) => {
  if (!turnoId) {
    return NextResponse.json(
      { error: 'Se requiere el ID del turno.' },
      { status: 400 }
    );
  }
  return null;
};

/**
 * Valida si existe un turno y si ese turno tiene una reserva asociada.
 * @param turno TurnoConReserva | null - El objeto TurnoConReserva a validar (puede ser null si no se encuentra el turno).
 * @returns NextResponse | null - Retorna una respuesta de error (JSON con código de estado 404) si el turno no se encuentra, o una respuesta de error (JSON con código de estado 400) si el turno existe pero no tiene una reserva asociada. Si el turno y su reserva existen, retorna null.
 */
const validarExistenciaTurnoYReserva = (turno: TurnoConReserva | null) => {
  if (!turno) {
    return NextResponse.json(
      { error: 'Turno no encontrado' },
      { status: 404 }
    );
  }

  if (!turno.reserva) {
    return NextResponse.json(
      { error: 'El turno no tiene una reserva asociada para cancelar.' },
      { status: 400 }
    );
  }

  return null;
};

/**
 * Valida si se cumple la regla de cancelación anticipada, que requiere que la cancelación se realice al menos 2 horas antes de la hora programada del turno.
 * @param fechaHoraTurno Date - La fecha y hora del turno.
 * @returns NextResponse | null - Retorna una respuesta de error (JSON con código de estado 400) si la hora actual es posterior al límite de cancelación (2 horas antes del turno). Si la cancelación se realiza dentro del plazo permitido, retorna null.
 */
const validarReglaCancelacion = (fechaHoraTurno: Date) => {
  const ahora = obtenerHoraActualLocal();
  const limiteCancelacion = new Date(fechaHoraTurno);
  limiteCancelacion.setHours(limiteCancelacion.getHours() - 2);

  if (ahora > limiteCancelacion) {
    return NextResponse.json(
      { error: 'No se puede cancelar la reserva. Debe cancelarse al menos 2 horas antes del turno.' },
      { status: 400 }
    );
  }

  return null;
};



export {
  validarExistenciaTurnoYReserva,
  validarReglaCancelacion,
  validarTurnoId,

}