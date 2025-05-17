// reserva.ts - Frontend Action
"use client"

import { CreateReservaParams } from "./interface/CreateReservaParams";
import { ReservaResult } from "./interface/ReservaResult";



export type MedioPago = "EFECTIVO" | "TRANSFERENCIA";
export type TipoMoneda = "MONEDA_LOCAL" | "MONEDA_EXTRANJERA";


export async function createReserva(params: CreateReservaParams): Promise<ReservaResult> {
  console.log("Iniciando createReserva con parámetros:", params);

  try {
    // Basic validation before sending request
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

    // Send request to API
    const response = await fetch('/api/reservar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    // Get response data
    const data = await response.json();
    console.log("Respuesta de API:", { status: response.status, data });

    // Handle success
    if (response.ok) {
      return {
        ok: true,
        data: data,
        message: data.message || "Reserva creada exitosamente"
      };
    }

    // Handle error
    let errorMessage = data.error || "Error al procesar la reserva";

    // Add more details if available
    if (data.details) {
      errorMessage += `: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}`;
    }

    console.error("Error en respuesta API:", errorMessage);
    return {
      ok: false,
      message: errorMessage
    };
  } catch (error) {
    // Handle network errors or unexpected exceptions
    console.error("Exception en createReserva:", error);
    const errorMessage = error instanceof Error ? error.message : "Error de conexión al servidor";

    return {
      ok: false,
      message: `Error de conexión: ${errorMessage}`
    };
  }
}