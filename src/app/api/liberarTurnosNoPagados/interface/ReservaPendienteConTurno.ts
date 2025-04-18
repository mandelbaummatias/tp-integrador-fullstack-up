import { EstadoReserva, MedioPago, EstadoTurno } from "@prisma/client";

export interface ReservaPendienteConTurno {
  id: string;
  turnoId: string;
  estado: EstadoReserva;
  medioPago: MedioPago;
  turno: {
    fechaHora: Date;
    id: string;
    estado: EstadoTurno;
  };
}
