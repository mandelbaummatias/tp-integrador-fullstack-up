import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE() {
  try {
    await prisma.$transaction([
      prisma.pago.deleteMany(),
      prisma.tipoMonedaConfig.deleteMany(),
      prisma.reservaDispositivoSeguridad.deleteMany(),
      prisma.reserva.deleteMany(),
      prisma.turno.deleteMany(),
      prisma.producto.deleteMany(),
      prisma.saldoCliente.deleteMany(),
      prisma.cliente.deleteMany(),
      prisma.dispositivoSeguridad.deleteMany(),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Data eliminada',
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error eliminado data:", error.message);
      return NextResponse.json({
        success: false,
        message: error.message,
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      message: 'Error eliminado data:',
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
