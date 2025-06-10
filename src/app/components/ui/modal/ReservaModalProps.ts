import { Turno } from "@/app/interface/Turno"

export interface ReservaModalProps {
  isOpen: boolean
  onClose: () => void
  turnoIds: string[]
  fechaHora: string
  clienteId?: string
  productoId?: string,
  productType?: string,
  turnos?: Turno[]
  onReservaSuccess?: (reservedTurnoIds: string[]) => void
}