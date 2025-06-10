
"use client"

import { CreateReservaParams } from "./interface/CreateReservaParams";
import { ReservaResult } from "./interface/ReservaResult";



export type MedioPago = "EFECTIVO" | "TRANSFERENCIA";
export type TipoMoneda = "MONEDA_LOCAL" | "MONEDA_EXTRANJERA";


export async function createReserva(params: CreateReservaParams): Promise<ReservaResult> {
  console.log("Iniciando createReserva con parámetros:", params);

  try {

    if (!params.clienteId || !params.productoId || !params.turnoIds) {
      console.error("Faltan parámetros requeridos:", {
        clienteId: params.clienteId ? "OK" : "Falta",
        productoId: params.productoId ? "OK" : "Falta",
        turnoIds: params.turnoIds ? "OK" : "Falta"
      });
      return {
        ok: false,
        message: "Faltan datos obligatorios para la reserva"
      };
    }


    const response = await fetch('/api/reservar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });


    const data = await response.json();
    console.log("Respuesta de API:", { status: response.status, data });


    if (response.ok) {
      return {
        ok: true,
        data: data,
        message: data.message || "Reserva creada exitosamente"
      };
    }


    let errorMessage = data.error || "Error al procesar la reserva";


    if (data.details) {
      errorMessage += `: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}`;
    }

    console.error("Error en respuesta API:", errorMessage);
    return {
      ok: false,
      message: errorMessage
    };
  } catch (error) {

    console.error("Exception en createReserva:", error);
    const errorMessage = error instanceof Error ? error.message : "Error de conexión al servidor";

    return {
      ok: false,
      message: `Error de conexión: ${errorMessage}`
    };
  }
}