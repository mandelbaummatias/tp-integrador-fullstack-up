import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EstadoReserva, EstadoTurno, TipoMoneda } from '@prisma/client';
import { validarExistenciaReserva, validarReglaCancelacion, validarReservaId } from './utils/validaciones';

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
    const reservaId = awaitedParams.id;


    const errorReservaId = validarReservaId(reservaId);
    if (errorReservaId) return errorReservaId;


    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: {
        cliente: true,
        producto: true,
        pagos: true,
        turno: true
      }
    });


    const errorReserva = validarExistenciaReserva(reserva);
    if (errorReserva) return errorReserva;


    const errorReglaCancelacion = validarReglaCancelacion(reserva!.turno!.fechaHora);
    if (errorReglaCancelacion) return errorReglaCancelacion;


    const resultado = await prisma.$transaction(async (tx) => {

      const reservaActualizada = await tx.reserva.update({
        where: { id: reservaId },
        data: { estado: EstadoReserva.CANCELADA }
      });


      const turnoActualizado = await tx.turno.update({
        where: { id: reserva!.turnoId },
        data: { estado: EstadoTurno.DISPONIBLE }
      });

      let saldoClienteActualizado = null;


      if (reserva!.estado === EstadoReserva.PAGADA) {
        const pago = reserva!.pagos && reserva!.pagos.length > 0
          ? reserva!.pagos[0]
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
        const clienteId = reserva!.clienteId;


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