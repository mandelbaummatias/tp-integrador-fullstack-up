import { NextResponse } from 'next/server';
import { PrismaClient, Cliente, TipoMoneda, EstadoReserva, EstadoTurno } from '@prisma/client';
import { obtenerHoraActualLocal } from '@/utils/conversorHora';
import { ReservaConProducto } from '@/app/api/interface/ReservaConProductos';

const prisma = new PrismaClient();

/**
 * Valida si se proporciona un ID de cliente.
 * @param clienteId string | undefined - El ID del cliente a validar.
 * @returns NextResponse | null - Retorna una respuesta de error (JSON con código de estado 400) si el ID no es proporcionado. Si el ID es proporcionado, retorna null.
 */
const validarClienteId = (clienteId: string): NextResponse | null => {



  if (!clienteId) {
    return NextResponse.json(
      { error: 'Se requiere el ID del cliente.' },
      { status: 400 }
    );
  }
  return null;
};

/**
 * Busca un cliente en la base de datos por su ID.
 * @param clienteId string - El ID del cliente a buscar.
 * @returns Promise<{ error: NextResponse | null; cliente: Cliente | null }> - Retorna un objeto que contiene:
 * - `error`: Un NextResponse con un error (JSON con código de estado 404) si el cliente no se encuentra, o null si el cliente existe.
 * - `cliente`: El objeto Cliente encontrado en la base de datos, o null si no existe.
 */
const validarExistenciaCliente = async (clienteId: string): Promise<{
  error: NextResponse | null;
  cliente: Cliente | null;
}> => {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId }
  });

  if (!cliente) {
    return {
      error: NextResponse.json(
        { error: 'Cliente no encontrado.' },
        { status: 404 }
      ),
      cliente: null
    };
  }

  return { error: null, cliente };
};

/**
 * Obtiene las reservas activas (con estado PAGADA) de un cliente para el día actual.
 * @param clienteId string - El ID del cliente para el cual se buscarán las reservas.
 * @returns Promise<{ reservas: ReservaConProducto[]; fechaInicio: Date; fechaFin: Date }> - Retorna un objeto que contiene:
 * - `reservas`: Un array de objetos ReservaConProducto que cumplen con los criterios (del cliente, pagadas y para el día actual).
 * - `fechaInicio`: Un objeto Date que representa el inicio del día actual (medianoche en la hora local, ajustado a UTC-3).
 * - `fechaFin`: Un objeto Date que representa el fin del día actual (último milisegundo del día en la hora local, ajustado a UTC-3).
 */
const obtenerReservasActivasHoy = async (
  clienteId: string
): Promise<{
  reservas: ReservaConProducto[];
  fechaInicio: Date;
  fechaFin: Date;
}> => {
  const hoy = obtenerHoraActualLocal();


  let fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());


  fechaInicio = new Date(fechaInicio.getTime() - 3 * 60 * 60 * 1000);


  let fechaFin = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate(),
    23,
    59,
    59,
    999
  );


  fechaFin = new Date(fechaFin.getTime() - 3 * 60 * 60 * 1000);





  const reservasDelCliente = await prisma.reserva.findMany({
    where: {
      clienteId: clienteId,
      estado: EstadoReserva.PAGADA,
      turno: {
        fechaHora: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    },
    include: {
      turno: true,
      producto: true,
    },
  }) as ReservaConProducto[];

  return { reservas: reservasDelCliente, fechaInicio, fechaFin };
};

/**
 * Valida si un cliente tiene reservas para el día de hoy.
 * @param reservas ReservaConProducto[] - El array de reservas a validar.
 * @param clienteId string - El ID del cliente asociado a las reservas.
 * @returns NextResponse | null - Retorna una respuesta JSON (con código de estado 200) indicando que el cliente no tiene reservas pagas para hoy si el array de reservas está vacío. Si el array contiene reservas, retorna null.
 */
const validarReservasExistentes = (reservas: ReservaConProducto[], clienteId: string): NextResponse | null => {
  if (reservas.length === 0) {
    return NextResponse.json({
      message: 'El cliente no tiene reservas pagas para el día de hoy.',
      clienteId: clienteId,
      reservasCanceladas: 0,
      compensacionTotal: 0
    }, { status: 200 });
  }
  return null;
};

/**
 * Procesa la cancelación de reservas debido a una tormenta. Solo se cancelan las reservas que están PAGADAS y que incluyen seguro.
 * Calcula el monto total a reintegrar en moneda local y extranjera (la mitad del monto pagado).
 * Actualiza el estado de la reserva y el turno asociado a CANCELADA.
 * @param reservas ReservaConProducto[] - El array de reservas a procesar para cancelación por tormenta.
 * @returns Promise<{ reservasCanceladas: number; montoLocalTotal: number; montoExtranjeroTotal: number }> - Retorna un objeto que contiene:
 * - `reservasCanceladas`: El número total de reservas que fueron canceladas.
 * - `montoLocalTotal`: El monto total a reintegrar en moneda local.
 * - `montoExtranjeroTotal`: El monto total a reintegrar en moneda extranjera.
 */
const procesarCancelacionesPorTormenta = async (reservas: ReservaConProducto[]): Promise<{
  reservasCanceladas: number;
  montoLocalTotal: number;
  montoExtranjeroTotal: number;
}> => {
  let reservasCanceladas = 0;
  let montoLocalTotal = 0;
  let montoExtranjeroTotal = 0;

  for (const reserva of reservas) {

    if (reserva.incluyeSeguro && reserva.estado === EstadoReserva.PAGADA) {

      const pago = await prisma.pago.findFirst({
        where: { reservaId: reserva.id }
      });


      if (!pago) {

        continue;
      }


      const montoReintegro = (pago.monto) / 2;


      if (reserva.tipoMoneda === TipoMoneda.MONEDA_LOCAL) {
        montoLocalTotal += montoReintegro;
      } else {
        montoExtranjeroTotal += montoReintegro;
      }


      await prisma.reserva.update({
        where: { id: reserva.id },
        data: { estado: EstadoReserva.CANCELADA }
      });


      await prisma.turno.update({
        where: { id: reserva.turnoId },
        data: { estado: EstadoTurno.CANCELADO }
      });

      reservasCanceladas++;
    }
  }

  return { reservasCanceladas, montoLocalTotal, montoExtranjeroTotal };
};

/**
 * Actualiza el saldo de un cliente, añadiendo los montos proporcionados a su saldo existente o creando un nuevo registro de saldo si no existe.
 * @param clienteId string - El ID del cliente al que se le actualizará el saldo.
 * @param montoLocal number - El monto en moneda local a añadir al saldo del cliente.
 * @param montoExtranjero number - El monto en moneda extranjera a añadir al saldo del cliente.
 * @returns Promise<void> - No retorna ningún valor directamente. Realiza una operación de escritura en la base de datos.
 * @throws Error - Lanza un error si no se puede actualizar el saldo del cliente.
 */
const actualizarSaldoCliente = async (
  clienteId: string,
  montoLocal: number,
  montoExtranjero: number
): Promise<void> => {
  try {

    await prisma.saldoCliente.upsert({
      where: { clienteId },
      update: {
        montoLocal: { increment: montoLocal },
        montoExtranjero: { increment: montoExtranjero }
      },
      create: {
        clienteId,
        montoLocal,
        montoExtranjero
      }
    });
  } catch (error) {
    console.error('Error al actualizar el saldo del cliente:', error);
    throw new Error('No se pudo actualizar el saldo del cliente');
  }
}


export {
  validarClienteId,
  validarExistenciaCliente,
  obtenerReservasActivasHoy,
  validarReservasExistentes,
  procesarCancelacionesPorTormenta,
  actualizarSaldoCliente,
};