import { MedioPago, TipoMoneda } from "@prisma/client";

export interface CreateReservaParams {
  clienteId: string;
  productoId: string;
  turnoIds: string[]; // Cambiado a array de strings
  cantidadPersonas: number;
  medioPago: MedioPago;
  tipoMoneda: TipoMoneda;
  incluyeSeguro: boolean;
}