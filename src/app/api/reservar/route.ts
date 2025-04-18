import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EstadoReserva, EstadoTurno } from '@prisma/client';

import { validarMedioPagoInput, validarTipoMonedaInput, validarOpcionesPago, validarDatosBasicos, validarEntidades, validarReglasNegocio, obtenerDispositivosSeguridad } from './utils/validaciones';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const {
      clienteId,
      productoId,
      turnoId,
      cantidadPersonas,
      medioPago,
      tipoMoneda,
      incluyeSeguro
    } = await req.json();



    const validacionMedioPagoInput = validarMedioPagoInput(medioPago);
    if (validacionMedioPagoInput) {
      return validacionMedioPagoInput;
    }


    const validacionTipoMonedaInput = validarTipoMonedaInput(tipoMoneda);
    if (validacionTipoMonedaInput) {
      return validacionTipoMonedaInput;
    }


    const validacionPago = validarOpcionesPago(medioPago, tipoMoneda);
    if (validacionPago) {
      return validacionPago;
    }


    const validacionDatos = await validarDatosBasicos(clienteId, productoId, turnoId);
    if (validacionDatos) {
      return validacionDatos;
    }


    const [cliente, producto, turno] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: clienteId } }),
      prisma.producto.findUnique({ where: { id: productoId } }),
      prisma.turno.findUnique({ where: { id: turnoId } })
    ]);

    const validacionEntidades = validarEntidades(cliente, producto, turno, cantidadPersonas);
    if (validacionEntidades) {
      return validacionEntidades;
    }


    const validacionReglas = await validarReglasNegocio(clienteId, turnoId, medioPago);
    if (validacionReglas) {
      return validacionReglas;
    }



    const resultadoDispositivos = await obtenerDispositivosSeguridad(producto, cantidadPersonas);


    if ('error' in resultadoDispositivos) {
      return NextResponse.json({ error: resultadoDispositivos.error }, { status: resultadoDispositivos.status });
    }

    const dispositivos = resultadoDispositivos.dispositivos;


    const reserva = await prisma.$transaction(async (tx) => {

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


      await tx.turno.update({
        where: { id: turnoId },
        data: { estado: EstadoTurno.RESERVADO }
      });





      if (dispositivos && dispositivos.length > 0) {

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

      return nuevaReserva;
    });


    return NextResponse.json({
      message: 'Reserva creada exitosamente',
      reserva
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear la reserva:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}