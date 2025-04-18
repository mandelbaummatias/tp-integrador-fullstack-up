import { NextRequest, NextResponse } from 'next/server';
import { EstadoTurno, PrismaClient, EstadoReserva } from '@prisma/client';
import { validarExistenciaReserva, validarEstadoReserva, validarHoraTurno, validarMedioPago, validarTipoMoneda, validarRestriccionesMedioPagoMoneda, calcularMontoFinal, procesarPago } from '../common/utils/pagarReserva/validaciones';


const prisma = new PrismaClient();

/**
 * POST endpoint para procesar el pago de una reserva
 * Recibe: reservaId, medioPago, tipoMoneda (opcionales, deben coincidir con lo que ya tiene la reserva)
 */
export async function POST(req: NextRequest) {
  try {
    const { reservaId, medioPago, tipoMoneda } = await req.json();

    if (!reservaId) {
      return NextResponse.json({ error: 'Se requiere el ID de la reserva.' }, { status: 400 });
    }


    const reserva = await validarExistenciaReserva(reservaId);


    if (!reserva.producto) {
      return NextResponse.json({ error: 'La reserva no tiene un producto asociado.' }, { status: 400 });
    }


    validarEstadoReserva(reserva);


    try {
      validarHoraTurno(reserva.turno.fechaHora);
    } catch (error) {

      await prisma.turno.update({
        where: { id: reserva.turnoId },
        data: { estado: EstadoTurno.DISPONIBLE }
      });

      throw error;
    }


    validarMedioPago(medioPago, reserva.medioPago);


    validarTipoMoneda(tipoMoneda, reserva.tipoMoneda);

    const pagoMedioPago = reserva.medioPago;
    const pagoTipoMoneda = tipoMoneda || reserva.tipoMoneda;


    validarRestriccionesMedioPagoMoneda(pagoMedioPago, pagoTipoMoneda);


    const reservasPendientes = await prisma.reserva.findMany({
      where: {
        clienteId: reserva.clienteId,
        estado: {
          in: [EstadoReserva.PENDIENTE_PAGO]
        }
      },
      include: {
        producto: true
      }
    });


    const aplicarDescuento = reservasPendientes.length > 1;
    const porcentajeDescuento = aplicarDescuento ? 0.9 : 1.0;


    const montoSinDescuento = await calcularMontoFinal(
      reserva.producto,
      pagoTipoMoneda,
      reserva.incluyeSeguro
    );
    const montoFinal = montoSinDescuento * porcentajeDescuento;


    const reservaActualizada = await procesarPago(reservaId, pagoMedioPago, pagoTipoMoneda);

    const montoRedondeado = Math.round(montoFinal * 100) / 100;


    const pago = await prisma.pago.create({
      data: {
        reservaId: reservaId,
        monto: montoRedondeado,
        moneda: pagoTipoMoneda,
        medioPago: pagoMedioPago,
        aplicoDescuento: aplicarDescuento,
        porcentajeDescuento: aplicarDescuento ? 10 : 0
      }
    });


    const recargoSeguro = reserva.incluyeSeguro ? 15 : 0;

    return NextResponse.json({
      message: 'Pago procesado exitosamente',
      reserva: reservaActualizada,
      pago: pago,
      montoOriginal: montoSinDescuento / (reserva.incluyeSeguro ? 1.15 : 1),
      montoFinal,
      descuentoAplicado: aplicarDescuento,
      porcentajeDescuento: aplicarDescuento ? 10 : 0,
      incluyeSeguro: reserva.incluyeSeguro,
      porcentajeRecargoSeguro: recargoSeguro,
      moneda: pagoTipoMoneda
    });
  } catch (error) {
    console.error('Error al procesar el pago:', error);
    return NextResponse.json({ error: (error as Error).message || 'Error al procesar el pago.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}