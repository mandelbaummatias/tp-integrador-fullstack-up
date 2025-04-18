import { NextRequest, NextResponse } from 'next/server';
import { EstadoReserva, EstadoTurno, PrismaClient } from '@prisma/client';
import { validarExistenciaReserva, validarEstadoReserva, validarHoraTurno, calcularMontoFinal, procesarPago } from '../common/utils/pagarReserva/validaciones';

const prisma = new PrismaClient();

/**
 * POST endpoint para procesar el pago de múltiples reservas a la vez
 * Recibe: solo reservasIds (array)
 * Utiliza el medio de pago y tipo de moneda configurado en cada reserva
 * Si se envía una sola reserva, busca si hay otras reservas pendientes del mismo cliente para aplicar descuento
 */
export async function POST(req: NextRequest) {
  try {
    const { reservasIds } = await req.json();

    if (!reservasIds || !Array.isArray(reservasIds) || reservasIds.length === 0) {
      return NextResponse.json({ error: 'Se requiere un array con los IDs de las reservas.' }, { status: 400 });
    }


    const reservas = [];
    let clienteId = null;
    let totalSinDescuento = 0;
    let totalConSurcharge = 0;


    const reservasProcesadas = [];
    const pagosProcesados = [];
    const errores = [];


    for (const reservaId of reservasIds) {
      try {

        const reserva = await validarExistenciaReserva(reservaId);


        if (!reserva.producto) {
          errores.push(`La reserva ${reservaId} no tiene un producto asociado.`);
          continue;
        }


        try {
          validarEstadoReserva(reserva);
        } catch (error) {
          errores.push(`Reserva ${reservaId}: ${(error as Error).message}`);
          continue;
        }


        try {
          validarHoraTurno(reserva.turno.fechaHora);
        } catch (error) {

          await prisma.turno.update({
            where: { id: reserva.turnoId },
            data: { estado: EstadoTurno.DISPONIBLE }
          });

          errores.push(`Reserva ${reservaId}: ${(error as Error).message}`);
          continue;
        }


        if (clienteId === null) {
          clienteId = reserva.clienteId;
        } else if (clienteId !== reserva.clienteId) {
          return NextResponse.json({
            error: 'Todas las reservas deben pertenecer al mismo cliente.'
          }, { status: 400 });
        }


        const montoReserva = await calcularMontoFinal(
          reserva.producto,
          reserva.tipoMoneda,
          reserva.incluyeSeguro
        );


        totalSinDescuento += reserva.incluyeSeguro ? (montoReserva / 1.15) : montoReserva;
        totalConSurcharge += montoReserva;

        reservas.push(reserva);
      } catch (error) {
        errores.push(`Error procesando reserva ${reservaId}: ${(error as Error).message}`);
      }
    }


    if (reservas.length === 0) {
      return NextResponse.json({
        error: 'No se pudo procesar ninguna reserva',
        detalles: errores
      }, { status: 400 });
    }


    let aplicaDescuento = reservas.length > 1;
    const porcentajeDescuento = 0.9;


    if (reservas.length === 1 && clienteId) {
      const otrasReservasPendientes = await prisma.reserva.count({
        where: {
          clienteId: clienteId,
          estado: EstadoReserva.PENDIENTE_PAGO,
          id: { not: reservas[0].id }
        }
      });


      aplicaDescuento = otrasReservasPendientes > 0;
    }


    const montoFinalTotal = aplicaDescuento
      ? totalConSurcharge * porcentajeDescuento
      : totalConSurcharge;


    for (const reserva of reservas) {
      try {

        const reservaActualizada = await procesarPago(reserva.id, reserva.medioPago, reserva.tipoMoneda);
        reservasProcesadas.push(reservaActualizada);


        const montoReserva = await calcularMontoFinal(
          reserva.producto,
          reserva.tipoMoneda,
          reserva.incluyeSeguro
        );

        const proporcion = montoReserva / totalConSurcharge;
        const montoProporcional = montoFinalTotal * proporcion;


        const montoRedondeado = Math.round(montoProporcional * 100) / 100;


        const pago = await prisma.pago.create({
          data: {
            reservaId: reserva.id,
            monto: montoRedondeado,
            moneda: reserva.tipoMoneda,
            medioPago: reserva.medioPago,
            aplicoDescuento: aplicaDescuento,
            porcentajeDescuento: aplicaDescuento ? 10 : 0
          }
        });

        pagosProcesados.push(pago);
      } catch (error) {
        errores.push(`Error al procesar pago para reserva ${reserva.id}: ${(error as Error).message}`);
      }
    }


    const reservasConSeguro = reservas.filter(r => r.incluyeSeguro).length;

    return NextResponse.json({
      message: 'Pagos procesados exitosamente',
      reservas: reservasProcesadas,
      pagos: pagosProcesados,
      montoOriginalTotal: totalSinDescuento,
      montoConRecargoSeguroTotal: totalConSurcharge,
      montoFinalTotal,
      descuentoAplicado: aplicaDescuento,
      porcentajeDescuento: aplicaDescuento ? 10 : 0,
      cantidadReservas: reservas.length,
      reservasConSeguro: reservasConSeguro,
      errores: errores.length > 0 ? errores : undefined
    });
  } catch (error) {
    console.error('Error al procesar los pagos:', error);
    return NextResponse.json({ error: (error as Error).message || 'Error al procesar los pagos.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}