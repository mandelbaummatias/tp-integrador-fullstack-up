import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET endpoint para obtener todos los productos.
 * @returns {Promise<NextResponse>} Una respuesta JSON con la lista de productos o un error.
 */
export async function GET(
): Promise<NextResponse> {
  try {
    const productos = await prisma.producto.findMany();
    return NextResponse.json(productos);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud para obtener los productos.' },
      { status: 500 }
    );
  }
}