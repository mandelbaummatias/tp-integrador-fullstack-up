import { Turno, Reserva, Cliente, Producto } from '@prisma/client';

export type TurnoConReserva = Turno & {
  reserva: (Reserva & {
    cliente: Cliente;
    producto: Producto;
  }) | null;
};