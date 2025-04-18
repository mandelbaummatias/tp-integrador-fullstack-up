import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { obtenerHoraActualLocal } from '@/utils/conversorHora';

export async function POST() {
  try {

    const ahoraLocal = obtenerHoraActualLocal();


    const horaInicioSeed = new Date(ahoraLocal);
    horaInicioSeed.setHours(horaInicioSeed.getHours() + 3);
    horaInicioSeed.setMinutes(0);
    horaInicioSeed.setSeconds(0);
    horaInicioSeed.setMilliseconds(0);

    const turnosCreados = [];
    const cantidadTurnos = 16;
    const abecedario = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < cantidadTurnos; i++) {
      const fechaTurno = new Date(horaInicioSeed);
      fechaTurno.setMinutes(horaInicioSeed.getMinutes() + i * 30);


      const turnoId = abecedario[i];

      const turnoCreado = await prisma.turno.create({
        data: {
          id: turnoId,
          fechaHora: fechaTurno,
          estado: "DISPONIBLE",
        },
      });

      turnosCreados.push(turnoCreado);
    }

    return NextResponse.json({ message: "Turnos creados exitosamente", turnos: turnosCreados }, { status: 201 });
  } catch (error) {
    console.error("Error al crear los turnos:", error);
    return NextResponse.json({ error: "Error al crear los turnos" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}