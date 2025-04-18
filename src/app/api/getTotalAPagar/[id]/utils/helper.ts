import { PrismaClient, EstadoReserva, TipoMoneda, MedioPago } from '@prisma/client';
import { ReservaConProducto } from '../../../interface/ReservaConProductos';

const prisma = new PrismaClient();

/**
 * Valida que se haya proporcionado un ID de cliente.
 * @param clienteId - ID del cliente
 * @returns Un mensaje de error si no es válido, de lo contrario null
 */
const validarClienteId = (clienteId: string): string | null => {
  if (!clienteId) {
    return 'Se requiere el ID del cliente.';
  }
  return null;
};

/**
 * Verifica si un cliente con el ID dado existe en la base de datos.
 * @param clienteId - ID del cliente
 * @returns El cliente encontrado o null si no existe
 */
const obtenerCliente = async (clienteId: string) => {
  return await prisma.cliente.findUnique({
    where: { id: clienteId },
  });
};

/**
 * Obtiene todas las reservas pendientes de pago de un cliente.
 * @param clienteId - ID del cliente
 * @returns Arreglo de reservas
 */
const obtenerReservasPendientes = async (clienteId: string) => {
  return await prisma.reserva.findMany({
    where: {
      clienteId,
      estado: EstadoReserva.PENDIENTE_PAGO,
    },
    include: {
      producto: true,
    },
  });
};

/**
 * Obtiene la tasa de cambio actual para un tipo de moneda específico
 * @param tipoMoneda - Tipo de moneda
 * @returns La tasa de cambio
 */
const obtenerTasaCambio = async (tipoMoneda: TipoMoneda): Promise<number> => {
  const configuracionMoneda = await prisma.tipoMonedaConfig.findFirst({
    where: { nombre: tipoMoneda },
  });

  return configuracionMoneda?.tasaCambio || 1;
};

/**
 * Calcula el total de las reservas pendientes, diferenciando moneda local y extranjera
 * @param reservas - Arreglo de reservas con sus productos
 * @returns Objeto con los detalles de los totales por moneda y medio de pago
 */
const calcularTotalReservas = async (reservas: ReservaConProducto[]) => {

  const reservasPorMoneda = reservas.reduce((acc, reserva) => {
    const tipoMoneda = reserva.tipoMoneda || TipoMoneda.MONEDA_LOCAL;
    if (!acc[tipoMoneda]) {
      acc[tipoMoneda] = [];
    }
    acc[tipoMoneda].push(reserva);
    return acc;
  }, {} as Record<TipoMoneda, ReservaConProducto[]>);


  const tasasCambio: Record<TipoMoneda, number> = {
    [TipoMoneda.MONEDA_LOCAL]: 1,
    [TipoMoneda.MONEDA_EXTRANJERA]: await obtenerTasaCambio(TipoMoneda.MONEDA_EXTRANJERA)
  };


  const totalesPorMoneda = {} as Record<TipoMoneda, number>;
  for (const [moneda, reservasMoneda] of Object.entries(reservasPorMoneda)) {
    let totalMoneda = 0;
    for (const reserva of reservasMoneda) {
      totalMoneda += reserva.producto.precio;
    }
    totalesPorMoneda[moneda as TipoMoneda] = totalMoneda;
  }


  const descuentoAplicado = reservas.length > 1;


  const totalesConDescuentoPorMoneda = {} as Record<TipoMoneda, number>;
  for (const [moneda, total] of Object.entries(totalesPorMoneda)) {
    totalesConDescuentoPorMoneda[moneda as TipoMoneda] = descuentoAplicado
      ? total * 0.9
      : total;
  }


  const medioPagoPorReserva = reservas.reduce((acc, reserva) => {
    const tipoMoneda = reserva.tipoMoneda || TipoMoneda.MONEDA_LOCAL;
    const key = `${tipoMoneda}_${reserva.medioPago}`;

    if (!acc[key]) {
      acc[key] = {
        tipoMoneda,
        medioPago: reserva.medioPago,
        subtotal: 0,
        totalConDescuento: 0,
        importeOriginal: 0,
        tasaCambio: tasasCambio[tipoMoneda]
      };
    }

    acc[key].subtotal += reserva.producto.precio;
    acc[key].importeOriginal += reserva.producto.precio;
    return acc;
  }, {} as Record<string, {
    tipoMoneda: TipoMoneda,
    medioPago: MedioPago,
    subtotal: number,
    totalConDescuento: number,
    importeOriginal: number,
    tasaCambio: number
  }>);


  for (const key in medioPagoPorReserva) {
    const detalle = medioPagoPorReserva[key];
    const proporcion = detalle.subtotal / totalesPorMoneda[detalle.tipoMoneda];
    const totalConDescuentoMoneda = totalesConDescuentoPorMoneda[detalle.tipoMoneda];
    detalle.totalConDescuento = totalConDescuentoMoneda * proporcion;
  }


  const detallesPorMonedaYPago = Object.values(medioPagoPorReserva).map(detalle => {
    const resultado = {
      tipoMoneda: detalle.tipoMoneda,
      medioPago: detalle.medioPago,
      subtotal: detalle.subtotal,
      totalAPagar: detalle.totalConDescuento,
    };


    if (detalle.tipoMoneda === TipoMoneda.MONEDA_EXTRANJERA) {
      return {
        ...resultado,
        importeOriginal: detalle.importeOriginal,
        tasaCambio: detalle.tasaCambio,
        montoEnMonedaExtranjera: detalle.totalConDescuento / detalle.tasaCambio
      };
    }

    return resultado;
  });


  let totalMonedaLocal = 0;
  let totalMonedaExtranjera = 0;
  let totalMonedaExtranjeraConvertido = 0;

  for (const detalle of Object.values(medioPagoPorReserva)) {
    if (detalle.tipoMoneda === TipoMoneda.MONEDA_LOCAL) {
      totalMonedaLocal += detalle.totalConDescuento;
    } else if (detalle.tipoMoneda === TipoMoneda.MONEDA_EXTRANJERA) {
      totalMonedaExtranjera += detalle.totalConDescuento / detalle.tasaCambio;
      totalMonedaExtranjeraConvertido += detalle.totalConDescuento;
    }
  }

  const totalGeneralMonedaLocal = totalMonedaLocal + totalMonedaExtranjeraConvertido;

  return {
    detallesPorMonedaYPago,
    tieneDescuento: descuentoAplicado,
    porcentajeDescuento: descuentoAplicado ? 10 : 0,
    totalSinDescuento: Object.values(totalesPorMoneda).reduce((acc, val) => acc + val, 0),
    totalMonedaLocal,
    totalMonedaExtranjera,
    totalMonedaExtranjeraConvertido,
    totalGeneral: totalGeneralMonedaLocal,
  };
};

export {
  validarClienteId,
  obtenerCliente,
  obtenerReservasPendientes,
  calcularTotalReservas,
};