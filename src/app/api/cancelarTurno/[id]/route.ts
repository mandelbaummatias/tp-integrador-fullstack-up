import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EstadoReserva, EstadoTurno, TipoMoneda } from '@prisma/client';
import { validarReservaId, validarExistenciaReserva, validarReglaCancelacion } from './utils/validaciones';

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"]
});

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { params } = context;
    const awaitedParams = await params;
    const turnoId = awaitedParams.id;




    const errorTurnoId = validarReservaId(turnoId);
    if (errorTurnoId) return errorTurnoId;


    const turno = await prisma.turno.findUnique({
      where: { id: turnoId },
      include: {
        reserva: {
          include: {
            cliente: true,
            producto: true,
            pagos: true
          }
        }
      }
    });


    const errorTurnoReserva = validarExistenciaReserva(turno);
    if (errorTurnoReserva) return errorTurnoReserva;


    const errorReglaCancelacion = validarReglaCancelacion(turno!.fechaHora);
    if (errorReglaCancelacion) return errorReglaCancelacion;


    const resultado = await prisma.$transaction(async (tx) => {
      const reservaActualizada = await tx.reserva.update({
        where: { id: turno!.reserva!.id },
        data: { estado: EstadoReserva.CANCELADA }
      });

      const turnoActualizado = await tx.turno.update({
        where: { id: turnoId },
        data: { estado: EstadoTurno.DISPONIBLE }
      });

      let saldoClienteActualizado = null;


      if (turno!.reserva?.estado === EstadoReserva.PAGADA) {

        const pago = turno!.reserva.pagos && turno!.reserva.pagos.length > 0
          ? turno!.reserva.pagos[0]
          : null;


        if (!pago) {

          return {
            reservaActualizada,
            turnoActualizado,
            saldoClienteActualizado
          };
        }


        const montoTotal = pago.monto;
        const tipoMoneda = pago.moneda;
        const clienteId = turno!.reserva.clienteId;


        const saldoExistente = await tx.saldoCliente.findUnique({
          where: { clienteId }
        });


        if (saldoExistente) {
          if (tipoMoneda === TipoMoneda.MONEDA_LOCAL) {
            saldoClienteActualizado = await tx.saldoCliente.update({
              where: { id: saldoExistente.id },
              data: { montoLocal: saldoExistente.montoLocal + montoTotal }
            });
          } else {
            saldoClienteActualizado = await tx.saldoCliente.update({
              where: { id: saldoExistente.id },
              data: { montoExtranjero: saldoExistente.montoExtranjero + montoTotal }
            });
          }
        } else {

          const dataSaldo = {
            clienteId,
            montoLocal: tipoMoneda === TipoMoneda.MONEDA_LOCAL ? montoTotal : 0,
            montoExtranjero: tipoMoneda === TipoMoneda.MONEDA_EXTRANJERA ? montoTotal : 0
          };

          saldoClienteActualizado = await tx.saldoCliente.create({
            data: dataSaldo
          });
        }


      }

      return {
        reservaActualizada,
        turnoActualizado,
        saldoClienteActualizado
      };
    });

    return NextResponse.json({
      message: 'Reserva cancelada exitosamente',
      reserva: resultado.reservaActualizada,
      turno: resultado.turnoActualizado,
      saldoCliente: resultado.saldoClienteActualizado
    }, { status: 200 });

  } catch (error) {
    console.error('Error al cancelar la reserva:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de cancelación.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}