'use server';

import prisma from '@/lib/prisma';

export const getAvailableProducts = async () => {
  try {
    const products = await prisma.producto.findMany({
      where: {
        reservas: {

        },
      },
    });
    return {
      ok: true,
      products: products,
    };
  } catch (error) {
    console.error('Error al obtener los productos disponibles (server action):', error);
    return {
      ok: false,
      message: 'Error al cargar los productos disponibles.',
    };
  }
};