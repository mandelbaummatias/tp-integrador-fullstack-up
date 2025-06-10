"use server"

import prisma from "@/lib/prisma"
import { obtenerHoraActualLocal } from "@/utils/conversorHora"




type EstadoReserva = "PENDIENTE_PAGO" | "PAGADA" | "CANCELADA"
type MedioPago = "EFECTIVO" | "TRANSFERENCIA"
type TipoMoneda = "MONEDA_LOCAL" | "MONEDA_EXTRANJERA"
type TipoProducto = "JETSKY" | "CUATRICICLO" | "EQUIPO_BUCEO" | "TABLA_SURF"

interface Reserva {
  id: string
  clienteId: string
  cantidadPersonas: number
  estado: EstadoReserva
  medioPago: MedioPago
  tipoMoneda: TipoMoneda
  incluyeSeguro: boolean
  turnoId: string
  productoId: string

  cliente: {
    id: string
    nombre: string
  }
  turno: {
    id: string
    fechaHora: string
  }
  producto: {
    id: string
    nombre: string
    tipo: TipoProducto
    precio: number
  }
}


export async function getReservas() {
  try {
    const horaActual = obtenerHoraActualLocal()
    const today = new Date(horaActual)

    const reservas = await prisma.reserva.findMany({
      where: {
        clienteId: "A",
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
        turno: {
          select: {
            id: true,
            fechaHora: true,
          },
        },
        producto: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            precio: true,
          },
        },
      },
    })

    return {
      ok: true,
      reservas,
    }
  } catch (error) {
    console.error("Error al obtener reservas:", error)
    return {
      ok: false,
      message: "Error al cargar las reservas",
    }
  }
}





































































































































































export async function cancelarReserva(reservaId: string) {
  try {


    return {
      ok: true,
      message: "Reserva cancelada exitosamente",
    }
  } catch (error) {
    console.error("Error al cancelar reserva:", error)
    return {
      ok: false,
      message: "Error al cancelar la reserva",
    }
  }
}


export async function pagarReserva(reservaId: string, detallesPago: any) {
  try {


    return {
      ok: true,
      message: "Pago procesado exitosamente",
    }
  } catch (error) {
    console.error("Error al procesar pago:", error)
    return {
      ok: false,
      message: "Error al procesar el pago",
    }
  }
}
