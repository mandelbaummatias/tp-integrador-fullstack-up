import { reservarTurno } from '@/actions/reserva/reservarTurno';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function POST() {
  try {
    // Buscar al cliente Matias
    const cliente = await prisma.cliente.findUnique({
      where: { documento: "314656791" }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el turno especificado existe
    const turnoId = "cm96466ji000ev0qw8s49gf66";
    const turno = await prisma.turno.findUnique({
      where: { id: turnoId }
    });

    if (!turno) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el producto especificado existe (JetSky)
    const productoId = "cm964648z0003v0qw4xfygd4k";
    const producto = await prisma.producto.findUnique({
      where: { id: productoId }
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Realizar la reserva para Matias
    const resultado = await reservarTurno({
      clienteId: cliente.id,
      turnosIds: [turnoId],
      productosIds: [productoId],
      cantidadPersonas: 2  // Asumiendo que son 2 personas para el JetSky
    });

    return NextResponse.json({
      mensaje: "Reserva creada exitosamente para Matias",
      cliente,
      resultado
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear la reserva para Matias:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}