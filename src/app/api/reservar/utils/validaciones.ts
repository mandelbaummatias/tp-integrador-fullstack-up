import { NextResponse } from 'next/server';
import { Cliente, Producto, Turno, PrismaClient, DispositivoSeguridad, EstadoReserva, EstadoTurno, MedioPago, NombreDispositivo, TipoMoneda, TipoProducto } from '@prisma/client';
import { obtenerHoraActualLocal } from '@/utils/conversorHora';



const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"]
});

/**
 * Valida las opciones de pago según el medio de pago y el tipo de moneda.
 * Solo el pago en efectivo puede realizarse con moneda extranjera.
 *
 * @param medioPago El medio de pago seleccionado.
 * @param tipoMoneda El tipo de moneda seleccionado.
 * @returns NextResponse | null Retorna un NextResponse con un error si la combinación no es válida, o null si es válida.
 */
const validarOpcionesPago = (medioPago: MedioPago, tipoMoneda: TipoMoneda): NextResponse | null => {
  if (medioPago !== MedioPago.EFECTIVO && tipoMoneda === TipoMoneda.MONEDA_EXTRANJERA) {
    return NextResponse.json({
      error: 'Solo el pago en efectivo puede realizarse con moneda extranjera.'
    }, { status: 400 });
  }
  return null;
};

/**
 * Valida que se proporcionen los datos básicos requeridos: clienteId, productoId y turnoId.
 *
 * @param clienteId El ID del cliente.
 * @param productoId El ID del producto.
 * @param turnoId El ID del turno.
 * @returns NextResponse | null Retorna un NextResponse con un error si algún dato básico falta, o null si todos están presentes.
 */
const validarDatosBasicos = async (clienteId: string, productoId: string, turnoId: string): Promise<NextResponse | null> => {
  if (!clienteId || !productoId || !turnoId) {
    return NextResponse.json({ error: 'Datos incompletos. Se requiere clienteId, productoId y turnoId.' }, { status: 400 });
  }
  return null;
};

/**
 * Valida la existencia de las entidades (cliente, producto, turno) y la capacidad del producto.
 *
 * @param cliente El objeto Cliente o null si no se encuentra.
 * @param producto El objeto Producto o null si no se encuentra.
 * @param turno El objeto Turno o null si no se encuentra.
 * @param cantidadPersonas La cantidad de personas para la reserva.
 * @returns NextResponse | null Retorna un NextResponse con un error si alguna validación falla, o null si todas son exitosas.
 */
const validarEntidades = (cliente: Cliente | null, producto: Producto | null, turno: Turno | null, cantidadPersonas: number): NextResponse | null => {
  if (!cliente) {
    return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 404 });
  }

  if (!producto) {
    return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
  }

  if (!turno) {
    return NextResponse.json({ error: 'Turno no encontrado.' }, { status: 404 });
  }

  if (turno.estado !== EstadoTurno.DISPONIBLE) {
    return NextResponse.json({ error: 'El turno seleccionado no está disponible.' }, { status: 400 });
  }


  if (cantidadPersonas < 1) {
    return NextResponse.json({ error: 'La cantidad de personas no puede ser menor a 1.' }, { status: 400 });
  }


  if (producto.capacidadMax !== null && cantidadPersonas > producto.capacidadMax) {
    return NextResponse.json({
      error: `La cantidad de personas excede la capacidad máxima del producto (${producto.capacidadMax}).`
    }, { status: 400 });
  }
  return null;
};

/**
 * Valida las reglas de negocio para la creación de una reserva, incluyendo la no existencia de reservas en el mismo turno,
 * la no reserva de turnos pasados, restricciones de pago en efectivo según la anticipación y la no superación de 3 turnos consecutivos previos.
 *
 * @param clienteId El ID del cliente que realiza la reserva.
 * @param turnoId El ID del turno que se intenta reservar.
 * @param medioPago El medio de pago seleccionado para la reserva.
 * @returns NextResponse | null Retorna un NextResponse con un error si alguna regla de negocio no se cumple, o null si todas son válidas.
 */
const validarReglasNegocio = async (
  clienteId: string,
  turnoId: string,
  medioPago?: MedioPago,
): Promise<NextResponse | null> => {

  const turno = await prisma.turno.findUnique({
    where: { id: turnoId }
  });

  if (!turno) {
    return NextResponse.json({ error: 'Turno no encontrado.' }, { status: 404 });
  }

  const ahora = obtenerHoraActualLocal();


  if (turno.fechaHora < ahora) {
    return NextResponse.json({
      error: 'No se pueden reservar turnos en fechas u horas pasadas.'
    }, { status: 400 });
  }


  if (medioPago == MedioPago.EFECTIVO) {
    const dosHorasAntes = new Date(turno.fechaHora.getTime() - 2 * 60 * 60 * 1000);

    if (ahora >= dosHorasAntes) {
      return NextResponse.json({
        error: 'El pago en efectivo solo se permite si se realiza con al menos 2 horas de anticipación al turno.'
      }, { status: 400 });
    }
  }

  const fechaTurno = turno.fechaHora;


  const reservasCliente = await prisma.reserva.findMany({
    where: {
      clienteId,
      estado: {
        in: [EstadoReserva.PENDIENTE_PAGO, EstadoReserva.PAGADA]
      }
    },
    include: {
      turno: true
    }
  });


  const turnoYaReservado = reservasCliente.some(
    reserva => reserva.turnoId === turnoId
  );

  if (turnoYaReservado) {
    return NextResponse.json({
      error: 'Ya tiene una reserva para este turno.'
    }, { status: 400 });
  }


  const fechasTurnos = reservasCliente.map(reserva => reserva.turno.fechaHora);


  const todasLasFechas = [...fechasTurnos, fechaTurno];


  todasLasFechas.sort((a, b) => a.getTime() - b.getTime());


  let consecutivos = 1;

  for (let i = 1; i < todasLasFechas.length; i++) {
    const fechaActual = todasLasFechas[i];
    const fechaAnterior = todasLasFechas[i - 1];


    const diffMinutos = (fechaActual.getTime() - fechaAnterior.getTime()) / (1000 * 60);

    if (diffMinutos === 30) {
      consecutivos++;


      if (consecutivos >= 4 && (
        fechaActual.getTime() === fechaTurno.getTime() ||
        fechaAnterior.getTime() === fechaTurno.getTime() ||
        (i >= 2 && todasLasFechas[i - 2].getTime() === fechaTurno.getTime()) ||
        (i >= 3 && todasLasFechas[i - 3].getTime() === fechaTurno.getTime())
      )) {
        return NextResponse.json({
          error: 'No se pueden reservar más de 3 turnos consecutivos.'
        }, { status: 400 });
      }
    } else {

      consecutivos = 1;
    }
  }


  const diferenciaHoras = (fechaTurno.getTime() - ahora.getTime()) / (1000 * 60 * 60);

  if (diferenciaHoras > 48) {
    return NextResponse.json({
      error: 'Los turnos solo pueden reservarse con una anticipación máxima de 48 horas.'
    }, { status: 400 });
  }

  return null;
};
/**
 * Obtiene los dispositivos de seguridad necesarios según el tipo de producto y la cantidad de personas.
 *
 * @param producto El objeto Producto para el cual se requieren los dispositivos.
 * @param cantidadPersonas La cantidad de personas que utilizarán el producto (por defecto es 1).
 * @returns Promise<{ dispositivos: DispositivoSeguridad[] } | { error: string; status: number }> Un objeto con la lista de dispositivos o un objeto de error con el mensaje y el código de estado.
 */
const obtenerDispositivosSeguridad = async (producto: Producto | null, cantidadPersonas: number = 1): Promise<{ dispositivos: DispositivoSeguridad[] } | { error: string; status: number }> => {
  if (!producto) {
    return { error: 'Producto no proporcionado', status: 400 };
  }


  let nombreDispositivo: NombreDispositivo | null = null;

  if (producto.tipo === TipoProducto.JETSKY) {
    nombreDispositivo = NombreDispositivo.CHALECO_SALVAVIDAS;
  } else if (producto.tipo === TipoProducto.CUATRICICLO) {
    nombreDispositivo = NombreDispositivo.CASCO;
  } else {

    return { dispositivos: [] };
  }


  const dispositivos = await prisma.dispositivoSeguridad.findMany({
    where: { nombre: nombreDispositivo },
    take: cantidadPersonas
  });


  if (dispositivos.length < cantidadPersonas) {
    return {
      error: `No hay suficientes ${nombreDispositivo === NombreDispositivo.CASCO ? 'cascos' : 'chalecos salvavidas'} disponibles para ${cantidadPersonas} personas.`,
      status: 400
    };
  }

  return { dispositivos };
};

/**
 * Valida si el tipo de moneda proporcionado es un valor válido del enum TipoMoneda.
 *
 * @param tipoMoneda El tipo de moneda a validar.
 * @returns NextResponse | null Retorna un NextResponse con error si no es válido, o null si es válido.
 */
const validarTipoMonedaInput = (tipoMoneda: TipoMoneda): NextResponse | null => {
  if (!Object.values(TipoMoneda).includes(tipoMoneda)) {
    return NextResponse.json({ error: `El tipo de moneda '${tipoMoneda}' no es válido.` }, { status: 400 });
  }
  return null;
};

/**
 * Valida si el medio de pago proporcionado es un valor válido del enum MedioPago.
 *
 * @param medioPago El medio de pago a validar.
 * @returns NextResponse | null Retorna un NextResponse con error si no es válido, o null si es válido.
 */
const validarMedioPagoInput = (medioPago: MedioPago): NextResponse | null => {
  if (!Object.values(MedioPago).includes(medioPago)) {
    return NextResponse.json({ error: `El medio de pago '${medioPago}' no es válido.` }, { status: 400 });
  }
  return null;
};

export {
  validarOpcionesPago,
  validarDatosBasicos,
  validarEntidades,
  validarReglasNegocio,
  obtenerDispositivosSeguridad,
  validarTipoMonedaInput,
  validarMedioPagoInput
};