import { NextResponse } from 'next/server';

export async function PUT() {
  return NextResponse.json(
    { error: 'Se requiere el ID del turno en la URL.' },
    { status: 400 }
  );
}