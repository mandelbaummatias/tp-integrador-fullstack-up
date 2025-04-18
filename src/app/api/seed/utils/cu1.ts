import { NextResponse } from 'next/server';
import { PrismaClient, NombreDispositivo, TipoProducto, TipoTabla } from '@prisma/client';
import { createProductoWithValidation } from './validations/helper';

const prisma = new PrismaClient();

export async function crearDatosPruebaCU1() {

  try {
    await prisma.tipoMonedaConfig.createMany({
      data: [
        { nombre: 'MONEDA_LOCAL', tasaCambio: 1.0 },
        { nombre: 'MONEDA_EXTRANJERA', tasaCambio: 2.0 },

      ],
    });


  } catch (error) {
    console.error('Error cargando TipoMonedaConfig:', error);
  }


  try {

    const clienteCreado = await prisma.cliente.create({
      data: {
        id: 'A',
        nombre: 'Matias',
        documento: '11112222'
      }
    });


    const productoJetSkyCreado = await createProductoWithValidation({
      id: 'A',
      nombre: 'JetSky Yamaha 2024',
      precio: 80.0,
      tipo: TipoProducto.JETSKY,
      capacidadMax: 2,
    });

    const dispositivoSeguridadJetSky1Creado = await prisma.dispositivoSeguridad.create({
      data: {
        nombre: NombreDispositivo.CHALECO_SALVAVIDAS
      }
    });


    const productoCuatriCreado = await createProductoWithValidation({
      id: 'B',
      nombre: 'Cuatri Otro 2025',
      precio: 100.0,
      tipo: TipoProducto.CUATRICICLO,
      capacidadMax: 1,
    });

    const productoTablaCreada = await createProductoWithValidation({
      id: 'C',
      nombre: 'Tabla Surf Adulto 2024',
      precio: 120.0,
      tipo: TipoProducto.TABLA_SURF,
      tipoTabla: TipoTabla.ADULTO,
    });

    const productoBuceoCreado = await createProductoWithValidation({
      id: 'D',
      nombre: 'Equipo Buceo 2000',
      precio: 180.0,
      tipo: TipoProducto.EQUIPO_BUCEO,
    });


    const dispositivo2 = await prisma.dispositivoSeguridad.create({
      data: {
        nombre: NombreDispositivo.CHALECO_SALVAVIDAS
      }
    });

    const dispositivo3 = await prisma.dispositivoSeguridad.create({
      data: {
        nombre: NombreDispositivo.CASCO
      }
    });



    return NextResponse.json({
      message: 'Datos de prueba CU1 creados exitosamente.',
      data: {
        cliente: clienteCreado,
        productos: [
          {
            producto: productoJetSkyCreado,
            dispositivosSeguridad: [dispositivoSeguridadJetSky1Creado]
          },
          {
            producto: productoCuatriCreado,
            dispositivosSeguridad: [dispositivo2, dispositivo3],
          },
          {
            producto: productoTablaCreada
          },
          {
            producto: productoBuceoCreado,
          },
        ],

      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error al crear datos de prueba CU1:', error);
    return NextResponse.json({ error: 'Failed to seed database for CU1.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}