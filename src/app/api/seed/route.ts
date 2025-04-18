import { NextResponse } from 'next/server';

import { crearDatosPruebaCU1 } from './utils/cu1';

export async function POST(): Promise<NextResponse> {
  try {

    const responseCU1 = await crearDatosPruebaCU1();
    const resultCU1 = await responseCU1.json();



    return NextResponse.json({
      message: 'Datos de prueba creados exitosamente.',
      results: {
        cu1: resultCU1.data,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error al crear datos de prueba:', error);
    return NextResponse.json({ error: 'Error al crear datos de prueba.' }, { status: 500 });
  }
}
