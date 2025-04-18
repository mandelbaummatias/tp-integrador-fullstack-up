import { obtenerHoraActualLocal } from '@/utils/conversorHora';
import { EstadoReserva, EstadoTurno, MedioPago, PrismaClient, TipoMoneda, Producto, Reserva } from '@prisma/client';

const prisma = new PrismaClient();
const ahora = obtenerHoraActualLocal();

/**
 * Busca una reserva por su ID y verifica si existe. Incluye información del producto y el turno asociado.
 * @param reservaId string - El ID de la reserva a buscar.
 * @returns Promise<Reserva & { producto: Producto; turno: { fechaHora: Date; estado: EstadoTurno | null } | null }> - Retorna la reserva encontrada junto con su producto y turno.
 * @throws Error - Si la reserva no existe, lanza un error con el mensaje 'La reserva no existe.'.
 */
const validarExistenciaReserva = async (reservaId: string) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: {
      producto: true,
      turno: true,
    },
  });

  if (!reserva) {
    throw new Error('La reserva no existe.');
  }

  return reserva;
};

/**
 * Valida si el estado de una reserva es PENDIENTE_PAGO.
 * @param reserva Reserva - El objeto de la reserva a verificar.
 * @throws Error - Si el estado de la reserva no es PENDIENTE_PAGO, lanza un error indicando el estado actual de la reserva.
 */
const validarEstadoReserva = (reserva: Reserva) => {
  if (reserva.estado !== EstadoReserva.PENDIENTE_PAGO) {
    throw new Error(`La reserva no se puede pagar porque está en estado ${reserva.estado}.`);
  }
};

/**
 * Valida si la fecha y hora del turno asociado a una reserva ya han pasado.
 * @param fechaHora Date - La fecha y hora del turno a validar.
 * @throws Error - Si la fecha y hora del turno son anteriores a la hora actual, lanza un error indicando que no se puede pagar una reserva para un turno pasado.
 */
const validarHoraTurno = (fechaHora: Date) => {





  if (fechaHora < ahora) {
    throw new Error('No se puede pagar una reserva para un turno que ya pasó.');
  }
};

/**
 * Valida si se cumple el plazo para el pago en efectivo (al menos 2 horas antes del turno).
 * @param medioPago MedioPago - El medio de pago de la reserva.
 * @param fechaHora Date - La fecha y hora del turno asociado a la reserva.
 * @throws Error - Si el medio de pago es EFECTIVO y la hora actual es posterior al límite de 2 horas antes del turno, lanza un error indicando la restricción.
 * @deprecated Esta función ya no se utiliza en el endpoint principal, pero se mantiene por si se necesita en otro lugar.
 */
const validarPlazoPagoEfectivo = (medioPago: MedioPago, fechaHora: Date) => {
  if (medioPago === MedioPago.EFECTIVO) {


    const dosHorasAntesTurno = new Date(fechaHora);
    dosHorasAntesTurno.setHours(dosHorasAntesTurno.getHours() - 2);



    if (ahora > dosHorasAntesTurno) {
      throw new Error('El pago en efectivo debe realizarse al menos 2 horas antes del turno.');
    }
  }
};

/**
 * Valida si el medio de pago enviado para realizar el pago coincide con el medio de pago registrado en la reserva.
 * @param medioPagoEnviado MedioPago | undefined - El medio de pago proporcionado para el pago (puede ser undefined).
 * @param medioPagoReserva MedioPago - El medio de pago registrado en la reserva.
 * @throws Error - Si se proporciona un medio de pago y no coincide con el de la reserva, lanza un error indicando la discrepancia.
 */
const validarMedioPago = (medioPagoEnviado: MedioPago | undefined, medioPagoReserva: MedioPago) => {
  if (medioPagoEnviado && medioPagoEnviado !== medioPagoReserva) {
    throw new Error(`El medio de pago enviado (${medioPagoEnviado}) no coincide con el medio de pago de la reserva (${medioPagoReserva}).`);
  }
};

/**
 * Valida si el tipo de moneda enviado para el pago coincide con el tipo de moneda registrado en la reserva (si ya existe).
 * @param tipoMonedaEnviado TipoMoneda | undefined - El tipo de moneda proporcionado para el pago (puede ser undefined).
 * @param tipoMonedaReserva TipoMoneda | null - El tipo de moneda registrado en la reserva (puede ser null si aún no se ha definido).
 * @throws Error - Si la reserva ya tiene un tipo de moneda definido y no coincide con el enviado, lanza un error indicando la discrepancia.
 */
const validarTipoMoneda = (tipoMonedaEnviado: TipoMoneda | undefined, tipoMonedaReserva: TipoMoneda | null) => {
  if (tipoMonedaReserva && tipoMonedaEnviado && tipoMonedaEnviado !== tipoMonedaReserva) {
    throw new Error(`El tipo de moneda enviado (${tipoMonedaEnviado}) no coincide con el tipo de moneda de la reserva (${tipoMonedaReserva}).`);
  }
};

/**
 * Valida las restricciones entre el medio de pago y el tipo de moneda. Actualmente, solo los pagos en efectivo pueden realizarse en moneda extranjera, y las transferencias deben ser en moneda local.
 * @param medioPago MedioPago - El medio de pago seleccionado.
 * @param tipoMoneda TipoMoneda - El tipo de moneda seleccionado.
 * @throws Error - Si se intenta realizar una transferencia en moneda extranjera, lanza un error indicando la restricción.
 */
const validarRestriccionesMedioPagoMoneda = (medioPago: MedioPago, tipoMoneda: TipoMoneda) => {
  if (medioPago === MedioPago.TRANSFERENCIA && tipoMoneda === TipoMoneda.MONEDA_EXTRANJERA) {
    throw new Error('Los pagos por transferencia solo pueden realizarse en moneda local. Para pagos en moneda extranjera debe utilizar efectivo.');
  }
};

/**
 * Calcula el monto final del pago de un producto, considerando el tipo de moneda y si incluye seguro (aplica un recargo del 15%).
 * @param producto Producto - El producto asociado a la reserva.
 * @param tipoMoneda TipoMoneda - El tipo de moneda en la que se realizará el pago.
 * @param incluyeSeguro boolean - Indica si la reserva incluye seguro (opcional, por defecto es false).
 * @returns Promise<number> - Retorna el monto final del pago. Si la moneda es extranjera, realiza la conversión utilizando la tasa de cambio actual.
 */
const calcularMontoFinal = async (producto: Producto, tipoMoneda: TipoMoneda, incluyeSeguro: boolean = false) => {
  let precioBase = producto.precio;

  if (tipoMoneda === TipoMoneda.MONEDA_EXTRANJERA) {
    const tasaCambio = await prisma.tipoMonedaConfig.findFirst({
      where: { nombre: TipoMoneda.MONEDA_EXTRANJERA },
    });

    if (tasaCambio) {
      precioBase = precioBase / tasaCambio.tasaCambio;
    }
  }


  if (incluyeSeguro) {
    precioBase = precioBase * 1.15;
  }

  return precioBase;
};

/**
 * Procesa el pago de una reserva, actualizando su estado a PAGADA y registrando el tipo de moneda. Para pagos en efectivo, verifica nuevamente el plazo de pago antes de proceder. Si el plazo para el pago en efectivo ha expirado, libera el turno asociado.
 * @param reservaId string - El ID de la reserva a pagar.
 * @param medioPago MedioPago - El medio de pago utilizado.
 * @param tipoMoneda TipoMoneda - El tipo de moneda en la que se realizó el pago.
 * @returns Promise<Reserva & { producto: Producto; turno: { fechaHora: Date; estado: EstadoTurno | null } | null; cliente: Cliente | null }> - Retorna la reserva actualizada con la información del producto, turno y cliente.
 * @throws Error - Si la reserva no existe o si el pago en efectivo no se realiza dentro del plazo, lanza un error.
 */
const procesarPago = async (reservaId: string, medioPago: MedioPago, tipoMoneda: TipoMoneda) => {

  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { turno: true },
  });

  if (!reserva) {
    throw new Error('La reserva no existe.');
  }


  if (medioPago === MedioPago.EFECTIVO) {
    const dosHorasAntesTurno = new Date(reserva.turno.fechaHora);
    dosHorasAntesTurno.setHours(dosHorasAntesTurno.getHours() - 2);



    if (ahora > dosHorasAntesTurno) {

      await prisma.turno.update({
        where: { id: reserva.turnoId },
        data: { estado: EstadoTurno.DISPONIBLE },
      });

      throw new Error('El pago en efectivo debe realizarse al menos 2 horas antes del turno. El turno sera liberado');
    }
  }


  const reservaActualizada = await prisma.reserva.update({
    where: { id: reservaId },
    data: {
      estado: EstadoReserva.PAGADA,
      tipoMoneda: tipoMoneda,

    },
    include: {
      producto: true,
      turno: true,
      cliente: true,
    },
  });

  return reservaActualizada;
};

export {
  validarExistenciaReserva,
  validarEstadoReserva,
  validarHoraTurno,
  validarPlazoPagoEfectivo,
  validarMedioPago,
  validarTipoMoneda,
  validarRestriccionesMedioPagoMoneda,
  calcularMontoFinal,
  procesarPago
};