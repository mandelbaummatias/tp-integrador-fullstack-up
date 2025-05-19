"use server"

import prisma from "@/lib/prisma"
import { obtenerHoraActualLocal } from "@/utils/conversorHora"



// Tipos basados en el esquema de Prisma
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
  // Relaciones expandidas
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
        clienteId: "A", // Hardcodeado como pediste
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



// Función para obtener todas las reservas
// export async function getReservas() {
//   try {
//     // Aquí normalmente consultarías a tu base de datos con Prisma
//     // Por ahora, retornaremos datos de ejemplo

//     const horaActual = obtenerHoraActualLocal()
//     const today = new Date(horaActual)

//     // Crear fechas para los próximos días
//     const tomorrow = new Date(today)
//     tomorrow.setDate(tomorrow.getDate() + 1)

//     const dayAfterTomorrow = new Date(today)
//     dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

//     const nextWeek = new Date(today)
//     nextWeek.setDate(nextWeek.getDate() + 7)

//     // Crear reservas de ejemplo
//     const mockReservas: Reserva[] = [
//       {
//         id: "reserva-1",
//         clienteId: "cliente-1",
//         cantidadPersonas: 2,
//         estado: "PENDIENTE_PAGO",
//         medioPago: "EFECTIVO",
//         tipoMoneda: "MONEDA_LOCAL",
//         incluyeSeguro: true,
//         turnoId: "turno-1",
//         productoId: "producto-1",
//         cliente: {
//           id: "cliente-1",
//           nombre: "Juan Pérez",
//         },
//         turno: {
//           id: "turno-1",
//           fechaHora: tomorrow.toISOString(),
//         },
//         producto: {
//           id: "producto-1",
//           nombre: "Jet Ski Yamaha",
//           tipo: "JETSKY",
//           precio: 5000,
//         },
//       },
//       {
//         id: "reserva-2",
//         clienteId: "cliente-2",
//         cantidadPersonas: 1,
//         estado: "PAGADA",
//         medioPago: "TRANSFERENCIA",
//         tipoMoneda: "MONEDA_LOCAL",
//         incluyeSeguro: false,
//         turnoId: "turno-2",
//         productoId: "producto-2",
//         cliente: {
//           id: "cliente-2",
//           nombre: "María González",
//         },
//         turno: {
//           id: "turno-2",
//           fechaHora: dayAfterTomorrow.toISOString(),
//         },
//         producto: {
//           id: "producto-2",
//           nombre: "Tabla de Surf Profesional",
//           tipo: "TABLA_SURF",
//           precio: 2500,
//         },
//       },
//       {
//         id: "reserva-3",
//         clienteId: "cliente-3",
//         cantidadPersonas: 4,
//         estado: "CANCELADA",
//         medioPago: "EFECTIVO",
//         tipoMoneda: "MONEDA_EXTRANJERA",
//         incluyeSeguro: true,
//         turnoId: "turno-3",
//         productoId: "producto-3",
//         cliente: {
//           id: "cliente-3",
//           nombre: "Carlos Rodríguez",
//         },
//         turno: {
//           id: "turno-3",
//           fechaHora: nextWeek.toISOString(),
//         },
//         producto: {
//           id: "producto-3",
//           nombre: "Cuatriciclo Honda",
//           tipo: "CUATRICICLO",
//           precio: 3500,
//         },
//       },
//       {
//         id: "reserva-4",
//         clienteId: "cliente-1",
//         cantidadPersonas: 2,
//         estado: "PENDIENTE_PAGO",
//         medioPago: "TRANSFERENCIA",
//         tipoMoneda: "MONEDA_LOCAL",
//         incluyeSeguro: false,
//         turnoId: "turno-4",
//         productoId: "producto-4",
//         cliente: {
//           id: "cliente-1",
//           nombre: "Juan Pérez",
//         },
//         turno: {
//           id: "turno-4",
//           fechaHora: tomorrow.toISOString(),
//         },
//         producto: {
//           id: "producto-4",
//           nombre: "Equipo de Buceo Completo",
//           tipo: "EQUIPO_BUCEO",
//           precio: 2000,
//         },
//       },
//       {
//         id: "reserva-5",
//         clienteId: "cliente-4",
//         cantidadPersonas: 1,
//         estado: "PAGADA",
//         medioPago: "EFECTIVO",
//         tipoMoneda: "MONEDA_EXTRANJERA",
//         incluyeSeguro: true,
//         turnoId: "turno-5",
//         productoId: "producto-1",
//         cliente: {
//           id: "cliente-4",
//           nombre: "Ana Martínez",
//         },
//         turno: {
//           id: "turno-5",
//           fechaHora: dayAfterTomorrow.toISOString(),
//         },
//         producto: {
//           id: "producto-1",
//           nombre: "Jet Ski Yamaha",
//           tipo: "JETSKY",
//           precio: 5000,
//         },
//       },
//     ]

//     return {
//       ok: true,
//       reservas: mockReservas,
//     }
//   } catch (error) {
//     console.error("Error al obtener reservas:", error)
//     return {
//       ok: false,
//       message: "Error al cargar las reservas",
//     }
//   }
// }

// Función para cancelar una reserva
export async function cancelarReserva(reservaId: string) {
  try {
    // Aquí implementarías la lógica para cancelar la reserva con Prisma

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

// Función para pagar una reserva
export async function pagarReserva(reservaId: string, detallesPago: any) {
  try {
    // Aquí implementarías la lógica para procesar el pago con Prisma

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
