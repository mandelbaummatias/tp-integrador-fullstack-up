import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Se requiere el ID del cliente en la URL.' },
    { status: 400 }
  );
}