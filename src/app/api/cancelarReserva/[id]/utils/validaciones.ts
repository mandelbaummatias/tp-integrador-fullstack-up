import { NextResponse } from 'next/server';


export function validarReservaId(reservaId: string) {
  if (!reservaId || typeof reservaId !== 'string' || reservaId.trim() === '') {
    return NextResponse.json(
      { error: 'ID de reserva inválido o no proporcionado.' },
      { status: 400 }
    );
  }
  return null;
}


export function validarExistenciaReserva(reserva: any) {
  if (!reserva) {
    return NextResponse.json(
      { error: 'La reserva especificada no existe.' },
      { status: 404 }
    );
  }

  if (reserva.estado === 'CANCELADA') {
    return NextResponse.json(
      { error: 'Esta reserva ya ha sido cancelada.' },
      { status: 400 }
    );
  }

  if (!reserva.turno) {
    return NextResponse.json(
      { error: 'No se encontró un turno asociado a esta reserva.' },
      { status: 400 }
    );
  }

  return null;
}


export function validarReglaCancelacion(fechaTurno: Date) {
  const ahora = new Date();
  const tiempoLimiteCancelacion = 2;

  const fechaTurnoObj = new Date(fechaTurno);
  const diferenciaHoras = (fechaTurnoObj.getTime() - ahora.getTime()) / (1000 * 60 * 60);

  if (diferenciaHoras < tiempoLimiteCancelacion) {
    return NextResponse.json(
      {
        error: `No se puede cancelar la reserva. Las cancelaciones deben realizarse con al menos ${tiempoLimiteCancelacion} horas de anticipación.`,
        horasRestantes: diferenciaHoras
      },
      { status: 400 }
    );
  }

  return null;
}