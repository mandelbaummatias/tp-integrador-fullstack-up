import { NextRequest, NextResponse } from 'next/server';
import { validarClienteId, calcularTotalReservas, obtenerCliente, obtenerReservasPendientes } from './utils/helper';

/**
 * GET endpoint para obtener el total a pagar por un cliente
 * Recibe: clienteId como parámetro de ruta
 **/
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  const { id: clienteId } = params;


  const errorId = validarClienteId(clienteId);
  if (errorId) {
    return NextResponse.json({ error: errorId }, { status: 400 });
  }

  try {
    const cliente = await obtenerCliente(clienteId);
    if (!cliente) {
      return NextResponse.json(
        { error: 'El cliente especificado no existe.' },
        { status: 404 }
      );
    }

    const reservas = await obtenerReservasPendientes(clienteId);

    if (reservas.length === 0) {
      return NextResponse.json(
        {
          detallesPorMonedaYPago: [],
          tieneDescuento: false,
          porcentajeDescuento: 0,
          totalSinDescuento: 0,
          totalMonedaLocal: 0,
          totalMonedaExtranjera: 0,
          totalMonedaExtranjeraConvertido: 0,
          totalGeneral: 0,
        },
        { status: 200 }
      );
    }

    const resultado = await calcularTotalReservas(reservas);

    return NextResponse.json(resultado, { status: 200 });
  } catch (error) {
    console.error('Error al calcular el total del cliente:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud.' },
      { status: 500 }
    );
  }
}