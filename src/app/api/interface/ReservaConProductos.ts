import { Reserva, Producto } from "@prisma/client";

export type ReservaConProducto = Reserva & {
  producto: Producto;
};