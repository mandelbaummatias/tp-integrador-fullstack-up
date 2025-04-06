import { NombreMoneda, PrismaClient, TipoProducto } from '@prisma/client';

const prisma = new PrismaClient();

interface ReservaParams {
  clienteId: string;
  turnosIds: string[];
  productosIds: string[];
  cantidadPersonas?: number;
}

export async function reservarTurno({
  clienteId,
  turnosIds,
  productosIds,
  cantidadPersonas = 1
}: ReservaParams) {
  if (!clienteId || !turnosIds || !productosIds || turnosIds.length === 0 || productosIds.length === 0) {
    throw new Error('Faltan datos requeridos para la reserva');
  }

  // Validar máximo 3 turnos consecutivos
  if (turnosIds.length > 3) {
    throw new Error('No se pueden reservar más de 3 turnos consecutivos');
  }

  // Validar que los turnos estén disponibles
  const turnos = await prisma.turno.findMany({
    where: {
      id: { in: turnosIds },
      estado: 'DISPONIBLE'
    }
  });

  if (turnos.length !== turnosIds.length) {
    throw new Error('Uno o más turnos seleccionados no están disponibles');
  }

  // Validar que no hayan pasado más de 48 horas desde la fecha actual
  const fechaActual = new Date();
  const limite48Horas = new Date(fechaActual);
  limite48Horas.setHours(limite48Horas.getHours() + 48);

  for (const turno of turnos) {
    if (turno.fechaHora > limite48Horas) {
      throw new Error('No se pueden reservar turnos con más de 48 horas de anticipación');
    }
  }

  // Obtener los productos seleccionados
  const productos = await prisma.producto.findMany({
    where: {
      id: { in: productosIds }
    },
    include: {
      dispositivos: {
        include: {
          dispositivo: true
        }
      }
    }
  });

  // Calcular precio total
  let precioTotal = 0;
  const productosAlquiler: { productoId: string; cantidad: number; }[] = [];
  const dispositivosAlquiler: { dispositivoId: string; cantidad: number; }[] = [];

  // Procesar cada producto y sus dispositivos de seguridad requeridos
  for (const producto of productos) {
    precioTotal += producto.precio;

    productosAlquiler.push({
      productoId: producto.id,
      cantidad: 1
    });

    // Verificar si el producto es JetSky o Cuatriciclo para agregar dispositivos de seguridad
    if (producto.tipo === TipoProducto.JETSKY || producto.tipo === TipoProducto.CUATRICICLO) {
      for (const productoDispositivo of producto.dispositivos) {
        // Agregar dispositivos según la cantidad de personas
        dispositivosAlquiler.push({
          dispositivoId: productoDispositivo.dispositivoId,
          cantidad: cantidadPersonas
        });
      }
    }
  }

  // Aplicar descuento del 10% si hay más de un producto
  const descuentoAplicado = productos.length > 1;
  if (descuentoAplicado) {
    precioTotal = precioTotal * 0.9;
  }

  // Crear el alquiler con una transacción
  return await prisma.$transaction(async (tx) => {
    // Crear el alquiler
    const alquiler = await tx.alquiler.create({
      data: {
        clienteId,
        total: precioTotal,
        estado: 'EN_PROCESO',
        descuentoAplicado,
        seguroAplicado: false,
        productos: {
          create: productosAlquiler
        },
        dispositivos: {
          create: dispositivosAlquiler
        }
      }
    });

    // Actualizar los turnos como reservados
    await tx.turno.updateMany({
      where: {
        id: { in: turnosIds }
      },
      data: {
        estado: 'RESERVADO',
        clienteId,
        alquilerId: alquiler.id
      }
    });

    // Crear pago pendiente
    const tipoMonedaLocal = await tx.tipoMoneda.findFirst({
      where: { nombre: NombreMoneda.MONEDA_LOCAL }
    });

    if (!tipoMonedaLocal) {
      throw new Error('No se encontró el tipo de moneda local');
    }

    await tx.pago.create({
      data: {
        alquilerId: alquiler.id,
        monto: precioTotal,
        tipoMonedaId: tipoMonedaLocal.id,
        estado: 'PENDIENTE'
      }
    });

    return {
      alquiler,
      turnosIds,
      productos
    };
  });
}