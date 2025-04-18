import { NextRequest, NextResponse } from 'next/server';
import { EstadoReserva } from '@prisma/client';
import {
  actualizarSaldoCliente,
  obtenerReservasActivasHoy,
  procesarCancelacionesPorTormenta,
  validarClienteId,
  validarExistenciaCliente,
  validarReservasExistentes
} from './utils/validaciones';



export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clienteId = params.id;

    const errorId = validarClienteId(clienteId);
    if (errorId) return errorId;

    try {

      const { error } = await validarExistenciaCliente(clienteId);
      if (error) return error;


      const { reservas } = await obtenerReservasActivasHoy(clienteId);


      const sinReservas = validarReservasExistentes(reservas, clienteId);
      if (sinReservas) return sinReservas;


      const reservasPagadasConSeguro = reservas.filter(
        reserva => reserva.estado === EstadoReserva.PAGADA && reserva.incluyeSeguro
      );

      if (reservasPagadasConSeguro.length === 0) {
        return NextResponse.json({
          message: 'El cliente no tiene reservas pagadas con seguro para el día de hoy.',
          clienteId: clienteId,
          reservasCanceladas: 0,
          compensacionTotal: {
            monedaLocal: 0,
            monedaExtranjera: 0
          }
        }, { status: 200 });
      }


      const { reservasCanceladas, montoLocalTotal, montoExtranjeroTotal } =
        await procesarCancelacionesPorTormenta(reservasPagadasConSeguro);


      await actualizarSaldoCliente(clienteId, montoLocalTotal, montoExtranjeroTotal);


      return NextResponse.json({
        message: 'Seguro por tormenta aplicado correctamente.',
        clienteId,
        reservasCanceladas,
        compensacionTotal: {
          monedaLocal: montoLocalTotal,
          monedaExtranjera: montoExtranjeroTotal
        },
        fechaAplicacion: new Date()
      }, { status: 200 });
    } catch (error) {
      console.error('Error al calcular el total del cliente:', error);
      return NextResponse.json(
        { error: 'Error al procesar la solicitud.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
    return NextResponse.json(
      { error: 'Error inesperado en el servidor.' },
      { status: 500 }
    );
  }
}