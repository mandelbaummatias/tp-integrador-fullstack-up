// ReservaModal.tsx with improved turno information display
"use client"

import type React from "react"

import { format, parseISO, addMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { createReserva, MedioPago, TipoMoneda } from "@/action/reserva/reserva"
import { useToast } from "../use-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../dialog"
import { Label } from "../label"
import { Input } from "../input"
import { RadioGroup, RadioGroupItem } from "../radio-group"
import { Checkbox } from "../checkbox"
import { Button } from "../button"
import { useEffect, useState } from "react"
import { ReservaModalProps } from "./ReservaModalProps"

export function ReservaModal({
  isOpen,
  onClose,
  turnoIds,
  fechaHora,
  turnos = [],
  onReservaSuccess,
  clienteId = "",
  productoId = ""
}: ReservaModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    cantidadPersonas: 1,
    medioPago: "EFECTIVO" as MedioPago,
    tipoMoneda: "MONEDA_LOCAL" as TipoMoneda,
    incluyeSeguro: false,
  })

  useEffect(() => {
    if (isOpen) {
      setError(null)
    }
  }, [isOpen])


  console.log('PRODUCT ID', productoId);


  // Get the selected turnos data based on IDs and sort by date/time
  const selectedTurnos = turnos.filter(turno => turnoIds.includes(turno.id))
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())

  // Calculate total duration in minutes (30 minutes per turno)
  const totalDurationMinutes = turnoIds.length * 30

  // Format total duration as hours and minutes
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutos`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0
        ? `${hours} hora${hours > 1 ? 's' : ''} y ${remainingMinutes} minutos`
        : `${hours} hora${hours > 1 ? 's' : ''}`
    }
  }

  // Format date and time for display
  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = parseISO(dateTimeStr)
      return {
        date: format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
        shortDate: format(date, "EEEE d 'de' MMMM", { locale: es }),
        time: format(date, "h:mm a", { locale: es }),
        endTime: format(addMinutes(date, 30), "h:mm a", { locale: es }),
      }
    } catch (error) {
      return { date: "Fecha inválida", shortDate: "Fecha inválida", time: "", endTime: "" }
    }
  }

  // Group turnos by date
  const groupTurnosByDate = () => {
    const grouped: Record<string, typeof selectedTurnos> = {}

    selectedTurnos.forEach(turno => {
      const { date } = formatDateTime(turno.fechaHora)
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(turno)
    })

    return grouped
  }

  // Render different information based on number of selected turnos
  const renderTurnoDetails = () => {
    if (selectedTurnos.length === 0) {
      return <p className="text-yellow-600">No hay turnos seleccionados</p>
    } else if (selectedTurnos.length === 1) {
      // Single turno case
      const { date, time, endTime } = formatDateTime(selectedTurnos[0].fechaHora)
      return (
        <>
          <p className="text-blue-700 text-sm capitalize">{date}</p>
          <p className="text-blue-700 text-sm">Hora: {time} - {endTime}</p>
          <p className="text-blue-700 text-sm">Duración: 30 minutos</p>
        </>
      )
    } else {
      // Multiple turnos case - group by date
      const turnosByDate = groupTurnosByDate()
      const dateCount = Object.keys(turnosByDate).length

      return (
        <>
          <p className="text-blue-700 text-sm font-medium">
            Turnos seleccionados: {turnoIds.length} ({formatDuration(totalDurationMinutes)} en total)
          </p>

          {Object.entries(turnosByDate).map(([date, dateTurnos], dateIndex) => (
            <div key={date} className={dateIndex > 0 ? "mt-2" : ""}>
              <p className="text-blue-700 text-sm font-medium capitalize">{dateIndex === 0 ? "Fecha: " : "También: "}{formatDateTime(dateTurnos[0].fechaHora).shortDate}</p>

              <div className="ml-2">
                {dateTurnos.map((turno, index) => {
                  const { time, endTime } = formatDateTime(turno.fechaHora)
                  return (
                    <p key={turno.id} className="text-blue-700 text-sm">
                      • {time} - {endTime}
                    </p>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const actualClienteId = clienteId || localStorage.getItem("clienteId") || "A"
      const actualProductoId = productoId || "A"

      if (!actualClienteId) {
        throw new Error("ID de cliente no disponible")
      }

      if (!actualProductoId) {
        throw new Error("ID de producto no disponible")
      }

      console.log("Sending reservation request with:", {
        clienteId: actualClienteId,
        productoId: actualProductoId,
        turnoIds,
        cantidadPersonas: formData.cantidadPersonas,
        medioPago: formData.medioPago,
        tipoMoneda: formData.tipoMoneda,
        incluyeSeguro: formData.incluyeSeguro,
      })

      const result = await createReserva({
        clienteId: actualClienteId,
        productoId: actualProductoId,
        turnoIds,
        cantidadPersonas: formData.cantidadPersonas,
        medioPago: formData.medioPago,
        tipoMoneda: formData.tipoMoneda,
        incluyeSeguro: formData.incluyeSeguro,
      })

      if (result.ok) {
        // toast({
        //   title: "Reserva exitosa",
        //   description: "Tu turno ha sido reservado correctamente",
        //   variant: "default",
        // })

        // Call the success callback to update the parent component
        if (onReservaSuccess) {
          onReservaSuccess(turnoIds)
        }

        onClose()
      } else {
        setError(result.message || "Error desconocido")
        toast({
          title: "Error",
          description: result.message || "Ocurrió un error al procesar tu reserva",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error al procesar tu reserva"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-900">Confirmar Reserva</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="bg-blue-50 p-3 rounded-md mb-2">
              <h3 className="font-medium text-blue-800 mb-1">Detalles del Turno</h3>
              {renderTurnoDetails()}
            </div>

            {error && (
              <div className="bg-red-50 p-3 rounded-md text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="cantidadPersonas" className="text-blue-800">
                Cantidad de Personas
              </Label>
              <Input
                id="cantidadPersonas"
                type="number"
                min="1"
                max="10"
                value={formData.cantidadPersonas}
                onChange={(e) => setFormData({ ...formData, cantidadPersonas: Number.parseInt(e.target.value) || 1 })}
                className="border-blue-200"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-blue-800">Medio de Pago</Label>
              <RadioGroup
                value={formData.medioPago}
                onValueChange={(value) => setFormData({ ...formData, medioPago: value as MedioPago })}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EFECTIVO" id="efectivo" />
                  <Label htmlFor="efectivo" className="cursor-pointer">
                    Efectivo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="TRANSFERENCIA" id="transferencia" />
                  <Label htmlFor="transferencia" className="cursor-pointer">
                    Transferencia
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label className="text-blue-800">Tipo de Moneda</Label>
              <RadioGroup
                value={formData.tipoMoneda}
                onValueChange={(value) => setFormData({ ...formData, tipoMoneda: value as TipoMoneda })}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MONEDA_LOCAL" id="moneda-local" />
                  <Label htmlFor="moneda-local" className="cursor-pointer">
                    Moneda Local
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MONEDA_EXTRANJERA" id="moneda-extranjera" />
                  <Label htmlFor="moneda-extranjera" className="cursor-pointer">
                    Moneda Extranjera
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluye-seguro"
                checked={formData.incluyeSeguro}
                onCheckedChange={(checked) => setFormData({ ...formData, incluyeSeguro: checked === true })}
              />
              <Label htmlFor="incluye-seguro" className="cursor-pointer text-blue-800">
                Incluir Seguro
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar Reserva"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}