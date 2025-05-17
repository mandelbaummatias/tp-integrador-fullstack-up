import { NextResponse } from 'next/server';
import { PrismaClient, EstadoReserva, EstadoTurno, MedioPago } from '@prisma/client';
import { obtenerHoraActualLocal } from '@/utils/conversorHora';
import { ReservaPendienteConTurno } from './interface/ReservaPendienteConTurno';
import { debeLiberarReserva } from './utils/validaciones';

const prisma = new PrismaClient();

/**
 * POST endpoint para liberar turnos no pagados en efectivo
 */
export async function POST() {
  try {

    const ahora = obtenerHoraActualLocal();

    console.log(ahora);


    const reservasPendientes = await prisma.reserva.findMany({
      where: {
        estado: EstadoReserva.PENDIENTE_PAGO,
        medioPago: MedioPago.EFECTIVO
      },
      include: {
        turno: true
      }
    }) as ReservaPendienteConTurno[];


    const reservasALiberar = reservasPendientes.filter(reserva => debeLiberarReserva(reserva, ahora));

    if (reservasALiberar.length === 0) {
      return NextResponse.json({
        message: 'No hay turnos para liberar en este momento',
        liberados: 0
      });
    }


    const resultado = await prisma.$transaction(async (tx) => {
      let turnosLiberados = 0;

      for (const reserva of reservasALiberar) {

        await tx.reserva.update({
          where: { id: reserva.id },
          data: {
            estado: EstadoReserva.CANCELADA
          }
        });


        await tx.turno.update({
          where: { id: reserva.turnoId },
          data: {
            estado: EstadoTurno.DISPONIBLE
          }
        });

        turnosLiberados++;
      }

      return { turnosLiberados };
    });

    return NextResponse.json({
      message: `Se han liberado ${resultado.turnosLiberados} turnos por falta de pago en efectivo`,
      liberados: resultado.turnosLiberados,
      detalle: reservasALiberar.map(r => ({
        reservaId: r.id,
        turnoId: r.turnoId,
        fechaTurno: r.turno.fechaHora
      }))
    });

  } catch (error) {
    console.error('Error al liberar turnos:', error);
    return NextResponse.json({ error: 'Error al procesar la liberación de turnos.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
