"use client"

import type React from "react"

import { useState } from "react"

import { CreditCard, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../dialog"
import { Label } from "../label"
import { RadioGroup, RadioGroupItem } from "../radio-group"
import { Input } from "../input"
import { Checkbox } from "../checkbox"
import { Button } from "../button"

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

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (paymentDetails: any) => void
  reservas: Reserva[]
}

export function PaymentModal({ isOpen, onClose, onConfirm, reservas }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    medioPago: "EFECTIVO" as MedioPago,
    aplicarDescuento: false,
    porcentajeDescuento: 10,
    numeroReferencia: "",
  })

  // Calcular el total a pagar
  const totalSinDescuento = reservas.reduce((sum, reserva) => sum + reserva.producto.precio, 0)
  const descuento = formData.aplicarDescuento ? (totalSinDescuento * formData.porcentajeDescuento) / 100 : 0
  const totalConDescuento = totalSinDescuento - descuento

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = parseISO(dateTimeStr)
      return format(date, "dd/MM/yyyy HH:mm", { locale: es })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onConfirm({
        reservaIds: reservas.map((r) => r.id),
        medioPago: formData.medioPago,
        aplicoDescuento: formData.aplicarDescuento,
        porcentajeDescuento: formData.aplicarDescuento ? formData.porcentajeDescuento : 0,
        numeroReferencia: formData.numeroReferencia,
        montoTotal: totalConDescuento,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <CreditCard className="h-5 w-5 text-blue-700" />
            Procesar Pago
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {reservas.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-md mb-2">
                <h3 className="font-medium text-blue-800 mb-2">
                  Detalles de {reservas.length > 1 ? "las Reservas" : "la Reserva"}
                </h3>
                {reservas.map((reserva, index) => (
                  <div key={reserva.id} className={`text-sm ${index > 0 ? "mt-2 pt-2 border-t border-blue-200" : ""}`}>
                    <p className="text-blue-700 font-medium">{reserva.producto.nombre}</p>
                    <p className="text-blue-600">Cliente: {reserva.cliente.nombre}</p>
                    <p className="text-blue-600">Fecha: {formatDateTime(reserva.turno.fechaHora)}</p>
                    <p className="text-blue-600">Precio: ${reserva.producto.precio.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-blue-800">Medio de Pago</Label>
              <RadioGroup
                value={formData.medioPago}
                onValueChange={(value) => setFormData({ ...formData, medioPago: value as MedioPago })}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EFECTIVO" id="efectivo-pago" />
                  <Label htmlFor="efectivo-pago" className="cursor-pointer">
                    Efectivo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="TRANSFERENCIA" id="transferencia-pago" />
                  <Label htmlFor="transferencia-pago" className="cursor-pointer">
                    Transferencia
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.medioPago === "TRANSFERENCIA" && (
              <div className="grid gap-2">
                <Label htmlFor="numeroReferencia" className="text-blue-800">
                  Número de Referencia
                </Label>
                <Input
                  id="numeroReferencia"
                  value={formData.numeroReferencia}
                  onChange={(e) => setFormData({ ...formData, numeroReferencia: e.target.value })}
                  className="border-blue-200"
                  placeholder="Ingrese el número de referencia"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="aplicar-descuento"
                checked={formData.aplicarDescuento}
                onCheckedChange={(checked) => setFormData({ ...formData, aplicarDescuento: checked === true })}
              />
              <Label htmlFor="aplicar-descuento" className="cursor-pointer text-blue-800">
                Aplicar Descuento
              </Label>
            </div>

            {formData.aplicarDescuento && (
              <div className="grid gap-2">
                <Label htmlFor="porcentajeDescuento" className="text-blue-800">
                  Porcentaje de Descuento
                </Label>
                <Input
                  id="porcentajeDescuento"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.porcentajeDescuento}
                  onChange={(e) =>
                    setFormData({ ...formData, porcentajeDescuento: Number.parseInt(e.target.value) || 0 })
                  }
                  className="border-blue-200"
                />
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-md mt-2">
              <div className="flex justify-between items-center">
                <span className="text-blue-800">Subtotal:</span>
                <span className="font-medium text-blue-900">${totalSinDescuento.toFixed(2)}</span>
              </div>
              {formData.aplicarDescuento && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-blue-800">Descuento ({formData.porcentajeDescuento}%):</span>
                  <span className="font-medium text-green-600">-${descuento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                <span className="text-blue-800 font-medium">Total a Pagar:</span>
                <span className="font-bold text-blue-900 text-lg">${totalConDescuento.toFixed(2)}</span>
              </div>
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
                "Confirmar Pago"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
