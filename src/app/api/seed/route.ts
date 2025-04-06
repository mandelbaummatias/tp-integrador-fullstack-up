import prisma from '@/lib/prisma';



import { TipoProducto, TipoTabla, NombreDispositivo, NombreMoneda, EstadoTurno } from '@prisma/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {


  await prisma.cliente.deleteMany();
  await prisma.productoDispositivoSeguridad.deleteMany();
  await prisma.dispositivoSeguridad.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.tipoMoneda.deleteMany();
  await prisma.turno.deleteMany();

  //Creamos al unico cliente
  await prisma.cliente.create({
    data: {
      nombre: "Matias",
      documento: "314656791"
    }
  });

  // Crear dispositivos de seguridad
  const casco = await prisma.dispositivoSeguridad.create({
    data: {
      nombre: NombreDispositivo.CASCO
    }
  });

  const chalecoSalvavidas = await prisma.dispositivoSeguridad.create({
    data: {
      nombre: NombreDispositivo.CHALECO_SALVAVIDAS
    }
  });

  console.log('Dispositivos de seguridad creados:', { casco, chalecoSalvavidas });

  // Crear productos
  // JetSky
  const jetsky = await prisma.producto.create({
    data: {
      nombre: 'JetSky Yamaha 2024',
      precio: 80.0,
      tipo: TipoProducto.JETSKY,
      capacidadMax: 2
    }
  });

  // Asociar JetSky con casco y chaleco
  await prisma.productoDispositivoSeguridad.createMany({
    data: [
      {
        productoId: jetsky.id,
        dispositivoId: casco.id
      },
      {
        productoId: jetsky.id,
        dispositivoId: chalecoSalvavidas.id
      }
    ]
  });

  // Cuatriciclo
  const cuatriciclo = await prisma.producto.create({
    data: {
      nombre: 'Cuatriciclo Honda 250cc',
      precio: 60.0,
      tipo: TipoProducto.CUATRICICLO,
      capacidadMax: 2
    }
  });

  // Asociar Cuatriciclo con casco
  await prisma.productoDispositivoSeguridad.create({
    data: {
      productoId: cuatriciclo.id,
      dispositivoId: casco.id
    }
  });

  // Equipo de buceo
  const equipoBuceo = await prisma.producto.create({
    data: {
      nombre: 'Equipo Buceo Profesional',
      precio: 45.0,
      tipo: TipoProducto.EQUIPO_BUCEO
    }
  });

  // Tablas de surf
  const tablaSurfAdulto = await prisma.producto.create({
    data: {
      nombre: 'Tabla Surf Adulto Pro',
      precio: 30.0,
      tipo: TipoProducto.TABLA_SURF,
      tipoTabla: TipoTabla.ADULTO
    }
  });

  const tablaSurfNino = await prisma.producto.create({
    data: {
      nombre: 'Tabla Surf Niño Inicial',
      precio: 20.0,
      tipo: TipoProducto.TABLA_SURF,
      tipoTabla: TipoTabla.NINO
    }
  });

  console.log('Productos creados:', { jetsky, cuatriciclo, equipoBuceo, tablaSurfAdulto, tablaSurfNino });

  // Crear tipos de moneda
  const monedaLocal = await prisma.tipoMoneda.create({
    data: {
      nombre: NombreMoneda.MONEDA_LOCAL,
      tasaCambio: 1.0
    }
  });

  const monedaExtranjera = await prisma.tipoMoneda.create({
    data: {
      nombre: NombreMoneda.MONEDA_EXTRANJERA,
      tasaCambio: 0.25 // Por ejemplo, 1 unidad extranjera = 4 unidades locales
    }
  });

  console.log('Tipos de moneda creados:', { monedaLocal, monedaExtranjera });

  // Crear turnos disponibles para los próximos 2 días
  const fechaActual = new Date();
  const turnos = [];

  for (let dia = 0; dia < 2; dia++) {
    const fecha = new Date(fechaActual);
    fecha.setDate(fechaActual.getDate() + dia);

    // Horarios de 9:00 a 17:00 (turnos cada 30 minutos)
    for (let hora = 9; hora < 17; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const fechaHora = new Date(fecha);
        fechaHora.setHours(hora, minuto, 0, 0);

        turnos.push({
          fechaHora,
          estado: EstadoTurno.DISPONIBLE
        });
      }
    }
  }

  await prisma.turno.createMany({
    data: turnos
  });

  console.log(`${turnos.length} turnos creados correctamente`);

  return NextResponse.json({ message: 'Seed item executed' });

}
