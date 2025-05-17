import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EstadoReserva, EstadoTurno } from '@prisma/client';

import {
  validarMedioPagoInput,
  validarTipoMonedaInput,
  validarOpcionesPago,
  validarDatosBasicos,
  validarEntidades,
  validarReglasNegocio,
  obtenerDispositivosSeguridad
} from './utils/validaciones';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  console.log('[API] Iniciando POST en /api/reservar');

  try {
    // Parse request body and log for debugging
    const body = await req.json();
    console.log('[API] Datos recibidos:', JSON.stringify(body, null, 2));

    const {
      clienteId,
      productoId,
      turnoIds, // Changed to turnoIds to indicate it's an array
      cantidadPersonas,
      medioPago,
      tipoMoneda,
      incluyeSeguro
    } = body;

    // Validate required fields
    if (!clienteId || !productoId || !turnoIds || !Array.isArray(turnoIds) || turnoIds.length === 0) {
      console.log("IMPRIMO turnoIds");

      console.log(turnoIds);

      console.error('[API] Error: Faltan campos obligatorios', { clienteId, productoId, turnoIds });
      return NextResponse.json({
        error: 'Faltan campos obligatorios para la reserva',
        details: {
          clienteId: clienteId ? 'OK' : 'Falta clienteId',
          productoId: productoId ? 'OK' : 'Falta productoId',
          turnoId: turnoIds ? (Array.isArray(turnoIds) && turnoIds.length > 0 ? 'OK' : 'Falta turnoId o es un array vacío') : 'Falta turnoId',
        }
      }, { status: 400 });
    }

    // Validate medioPago
    const validacionMedioPagoInput = validarMedioPagoInput(medioPago);
    if (validacionMedioPagoInput) {
      console.error('[API] Error en validación de medio de pago:', medioPago);
      return validacionMedioPagoInput;
    }

    // Validate tipoMoneda
    const validacionTipoMonedaInput = validarTipoMonedaInput(tipoMoneda);
    if (validacionTipoMonedaInput) {
      console.error('[API] Error en validación de tipo de moneda:', tipoMoneda);
      return validacionTipoMonedaInput;
    }

    // Validate payment options
    const validacionPago = validarOpcionesPago(medioPago, tipoMoneda);
    if (validacionPago) {
      console.error('[API] Error en validación de opciones de pago:', { medioPago, tipoMoneda });
      return validacionPago;
    }

    // Validate basic data and fetch entities outside the loop
    let cliente, producto;
    try {
      const validacionDatosBasicos = await validarDatosBasicos(clienteId, productoId, turnoIds[0]); // Use the first turnoId for basic data validation
      if (validacionDatosBasicos) {
        console.error('[API] Error en validación de datos básicos');
        return validacionDatosBasicos;
      }

      console.log('[API] Buscando cliente y producto en la base de datos');
      [cliente, producto] = await Promise.all([
        prisma.cliente.findUnique({ where: { id: clienteId } }),
        prisma.producto.findUnique({ where: { id: productoId } }),
      ]);

      console.log('[API] Entidades cliente y producto encontradas:', {
        cliente: cliente ? 'OK' : 'No encontrado',
        producto: producto ? 'OK' : 'No encontrado',
      });

      if (!cliente || !producto) {
        console.error('[API] Error: Cliente o producto no encontrado');
        return NextResponse.json({ error: 'Cliente o producto no encontrado' }, { status: 404 });
      }

    } catch (error) {
      console.error('[API] Exception en validaciones iniciales o búsqueda de cliente/producto:', error);
      return NextResponse.json({
        error: 'Error en validación de datos o al buscar cliente/producto',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 400 });
    }

    // Validate business rules (using the first turnoId for now, adjust if needed for multiple turnos)
    try {
      const validacionReglas = await validarReglasNegocio(clienteId, turnoIds[0], medioPago);
      if (validacionReglas) {
        console.error('[API] Error en validación de reglas de negocio');
        return validacionReglas;
      }
    } catch (error) {
      console.error('[API] Exception en validarReglasNegocio:', error);
      return NextResponse.json({
        error: 'Error en reglas de negocio',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 400 });
    }

    // Get security devices (assuming they are the same for all turnos in the same product)
    console.log('[API] Obteniendo dispositivos de seguridad');
    let resultadoDispositivos;
    try {
      resultadoDispositivos = await obtenerDispositivosSeguridad(producto, cantidadPersonas);

      if ('error' in resultadoDispositivos) {
        console.error('[API] Error al obtener dispositivos de seguridad:', resultadoDispositivos.error);
        return NextResponse.json({
          error: resultadoDispositivos.error
        }, { status: resultadoDispositivos.status });
      }
    } catch (error) {
      console.error('[API] Exception en obtenerDispositivosSeguridad:', error);
      return NextResponse.json({
        error: 'Error al obtener dispositivos de seguridad',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }

    const dispositivos = resultadoDispositivos.dispositivos;
    const reservasCreadas: any = [];

    // Create reservations and update turnos in a transaction
    console.log('[API] Iniciando transacción para crear reservas');
    try {
      await prisma.$transaction(async (tx) => {
        for (const turnoId of turnoIds) {
          // Fetch the turno inside the loop to validate its existence and capacity
          const turno = await tx.turno.findUnique({ where: { id: turnoId } });

          if (!turno) {
            console.error(`[API] Error: Turno con ID ${turnoId} no encontrado.`);
            throw new Error(`Turno con ID ${turnoId} no encontrado.`);
          }

          // Validate entities for each turno
          const validacionEntidadesTurno = validarEntidades(cliente, producto, turno, cantidadPersonas);
          if (validacionEntidadesTurno) {
            console.error(`[API] Error en validación de entidades para el turno ${turnoId}`);
            throw new Error(validacionEntidadesTurno.error);
          }

          // Create new reservation
          const nuevaReserva = await tx.reserva.create({
            data: {
              clienteId,
              turnoId,
              productoId,
              cantidadPersonas: producto?.capacidadMax === null ? 1 : cantidadPersonas,
              estado: EstadoReserva.PENDIENTE_PAGO,
              medioPago,
              tipoMoneda,
              incluyeSeguro,
            }
          });

          console.log('[API] Reserva creada:', nuevaReserva.id, 'para el turno:', turnoId);
          reservasCreadas.push(nuevaReserva);

          // Update turn status
          await tx.turno.update({
            where: { id: turnoId },
            data: { estado: EstadoTurno.RESERVADO }
          });

          console.log('[API] Turno', turnoId, 'actualizado a RESERVADO');

          // Create security device relationships
          if (dispositivos && dispositivos.length > 0) {
            console.log('[API] Asociando dispositivos de seguridad para la reserva:', nuevaReserva.id);
            for (const dispositivo of dispositivos) {
              await tx.reservaDispositivoSeguridad.create({
                data: {
                  reservaId: nuevaReserva.id,
                  dispositivoId: dispositivo.id,
                  cantidad: 1
                }
              });
            }
          }
        }
      });
    } catch (error) {
      console.error('[API] Error en la transacción de la reserva:', error);
      return NextResponse.json({
        error: 'Error al crear las reservas en la base de datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }, { status: 500 });
    }

    console.log('[API] Reservas completadas exitosamente');
    return NextResponse.json({
      message: 'Reservas creadas exitosamente',
      reservas: reservasCreadas
    }, { status: 201 });

  } catch (error) {
    console.error('[API] Error general al crear la reserva:', error);
    return NextResponse.json({
      error: 'Error al procesar la solicitud.',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}