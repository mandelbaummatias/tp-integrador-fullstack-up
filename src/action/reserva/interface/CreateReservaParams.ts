import { MedioPago, TipoMoneda } from "@prisma/client";

export interface CreateReservaParams {
  clienteId: string;
  productoId: string;
  turnoIds: string[];
  cantidadPersonas: number;
  medioPago: MedioPago;
  tipoMoneda: TipoMoneda;
  incluyeSeguro: boolean;
}