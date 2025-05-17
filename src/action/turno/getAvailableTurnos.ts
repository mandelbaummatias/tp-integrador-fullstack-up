'use server';

import prisma from '@/lib/prisma';

export const getAvailableTurns = async () => {
  try {
    const availableTurns = await prisma.turno.findMany({
      where: {
        estado: 'DISPONIBLE',
        reserva: {
          is: null,
        },
      },
    });
    return {
      ok: true,
      turns: availableTurns,
    };
  } catch (error) {
    console.error('Error al obtener los turnos disponibles (server action):', error);
    return {
      ok: false,
      message: 'Error al cargar los turnos disponibles.',
    };
  }
};
