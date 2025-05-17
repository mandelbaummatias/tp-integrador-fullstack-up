import { Turno } from "@/app/interface/Turno"

export interface ReservaModalProps {
  isOpen: boolean
  onClose: () => void
  turnoIds: string[]
  fechaHora: string
  clienteId?: string
  productoId?: string
  turnos?: Turno[] // Add turnos array to get actual turno information
  onReservaSuccess?: (reservedTurnoIds: string[]) => void // Add callback for successful reservation
}