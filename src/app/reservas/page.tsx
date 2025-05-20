"use client"

import { useEffect, useState } from "react"
import { useToast } from "../hooks/use-toast"
import { getReservas } from "@/action/reserva/reservas"
import { format, isValid } from "date-fns"
import { AlertTriangle, Calendar, Clock, CreditCard, Loader2, Package, User } from "lucide-react"
import { Alert, AlertDescription } from "../components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Checkbox } from "../components/ui/checkbox"
import { Badge } from "../components/ui/badge"
import { ConfirmationModal } from "../components/ui/modal/confirmation-modal"
import { PaymentModal } from "../components/ui/modal/payment-modal"
import { es } from "date-fns/locale/es"

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

export default function ReservasPage() {
  const { toast } = useToast()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [filteredReservas, setFilteredReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservas, setSelectedReservas] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("todas")
  const [processingIds, setProcessingIds] = useState<string[]>([])

  // Estados para modales
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedForAction, setSelectedForAction] = useState<string | null>(null)
  const [isMultipleAction, setIsMultipleAction] = useState(false)

  useEffect(() => {
    async function loadReservas() {
      try {
        setLoading(true)
        const result = await getReservas()
        if (result?.ok && result.reservas) {
          setReservas(result.reservas)
          setFilteredReservas(result.reservas)
        } else {
          setError(result?.message || "Error al cargar las reservas")
        }
      } catch (err) {
        setError("Error al cargar las reservas")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadReservas()
  }, [])

  useEffect(() => {
    if (activeTab === "todas") {
      setFilteredReservas(reservas)
    } else {
      setFilteredReservas(
        reservas.filter((reserva) =>
          activeTab === "pendientes"
            ? reserva.estado === "PENDIENTE_PAGO"
            : activeTab === "pagadas"
              ? reserva.estado === "PAGADA"
              : reserva.estado === "CANCELADA",
        ),
      )
    }
    // Limpiar selecciones al cambiar de tab
    setSelectedReservas([])
  }, [activeTab, reservas])

  const formatDateTime = (input: string | Date) => {
    const date = typeof input === "string" ? new Date(input) : input

    if (!isValid(date)) {
      return { date: "Fecha inválida", time: "" }
    }

    return {
      date: format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
      time: format(date, "h:mm a", { locale: es }),
    }
  }

  const getEstadoBadge = (estado: EstadoReserva) => {
    switch (estado) {
      case "PENDIENTE_PAGO":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pendiente de Pago
          </Badge>
        )
      case "PAGADA":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Pagada
          </Badge>
        )
      case "CANCELADA":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelada
          </Badge>
        )
    }
  }

  const getProductIcon = (tipo: TipoProducto) => {
    switch (tipo) {
      case "JETSKY":
        return (
          <div className="p-2 bg-blue-100 rounded-full">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
        )
      case "CUATRICICLO":
        return (
          <div className="p-2 bg-orange-100 rounded-full">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
        )
      case "EQUIPO_BUCEO":
        return (
          <div className="p-2 bg-cyan-100 rounded-full">
            <Package className="h-5 w-5 text-cyan-600" />
          </div>
        )
      case "TABLA_SURF":
        return (
          <div className="p-2 bg-teal-100 rounded-full">
            <Package className="h-5 w-5 text-teal-600" />
          </div>
        )
    }
  }

  const handleCheckboxChange = (reservaId: string, checked: boolean) => {
    if (checked) {
      setSelectedReservas([...selectedReservas, reservaId])
    } else {
      setSelectedReservas(selectedReservas.filter((id) => id !== reservaId))
    }
  }

  const handleCancelReserva = (reservaId: string) => {
    setSelectedForAction(reservaId)
    setIsMultipleAction(false)
    setCancelModalOpen(true)
  }

  const handlePayReserva = (reservaId: string) => {
    setSelectedForAction(reservaId)
    setIsMultipleAction(false)
    setPaymentModalOpen(true)
  }

  const handleCancelSelected = () => {
    if (selectedReservas.length === 0) return
    setIsMultipleAction(true)
    setCancelModalOpen(true)
  }

  const handlePaySelected = () => {
    if (selectedReservas.length === 0) return
    setIsMultipleAction(true)
    setPaymentModalOpen(true)
  }

  const confirmCancel = async () => {
    try {
      const idsToCancel = isMultipleAction ? selectedReservas : [selectedForAction!]
      setProcessingIds(idsToCancel)

      // Procesar cada reserva secuencialmente
      for (const reservaId of idsToCancel) {
        const response = await fetch(`/api/cancelarReserva/${reservaId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al cancelar la reserva');
        }
      }

      // Actualizar el estado local después de procesar todas las reservas
      const updatedReservas = reservas.map((reserva) =>
        idsToCancel.includes(reserva.id) ? { ...reserva, estado: "CANCELADA" as EstadoReserva } : reserva
      );

      setReservas(updatedReservas);
      setSelectedReservas([]);

      toast({
        title: "Reservas canceladas",
        description: `Se han cancelado ${idsToCancel.length} reserva(s) exitosamente`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron cancelar las reservas",
        variant: "destructive",
      });
    } finally {
      setProcessingIds([]);
      setCancelModalOpen(false);
    }
  }

  const confirmPayment = async (paymentDetails: any) => {
    try {
      const idsToPay = isMultipleAction ? selectedReservas : [selectedForAction!]
      setProcessingIds(idsToPay)

      // Procesar cada reserva secuencialmente
      for (const reservaId of idsToPay) {
        const response = await fetch(`/api/pagarReserva/${reservaId}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            medioPago: paymentDetails.medioPago,
            tipoMoneda: paymentDetails.tipoMoneda,
            comprobante: paymentDetails.comprobante || null
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al procesar el pago');
        }
      }

      // Actualizar el estado local después de procesar todos los pagos
      const updatedReservas = reservas.map((reserva) =>
        idsToPay.includes(reserva.id) ? {
          ...reserva,
          estado: "PAGADA" as EstadoReserva,
          medioPago: paymentDetails.medioPago,
          tipoMoneda: paymentDetails.tipoMoneda
        } : reserva
      );

      setReservas(updatedReservas);
      setSelectedReservas([]);

      toast({
        title: "Pago procesado",
        description: `Se ha procesado el pago de ${idsToPay.length} reserva(s) exitosamente`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo procesar el pago",
        variant: "destructive",
      });
    } finally {
      setProcessingIds([]);
      setPaymentModalOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-sky-100 to-blue-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          <p className="mt-4 text-lg text-blue-800">Cargando reservas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-sky-100 to-blue-50 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Gestión de Reservas</h1>
          <p className="text-blue-700">Administra tus reservas de productos</p>
        </header>

        <Tabs defaultValue="todas" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
            <TabsTrigger value="pagadas">Pagadas</TabsTrigger>
            <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
          </TabsList>
        </Tabs>

        {selectedReservas.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="font-medium text-blue-800">
                  {selectedReservas.length} {selectedReservas.length === 1 ? "reserva" : "reservas"} seleccionadas
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handlePaySelected}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={selectedReservas.some((id) => {
                    const reserva = reservas.find((r) => r.id === id)
                    return reserva?.estado !== "PENDIENTE_PAGO"
                  })}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagar Seleccionadas
                </Button>
                <Button
                  onClick={handleCancelSelected}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  disabled={selectedReservas.some((id) => {
                    const reserva = reservas.find((r) => r.id === id)
                    return reserva?.estado === "CANCELADA"
                  })}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Cancelar Seleccionadas
                </Button>
              </div>
            </div>
          </div>
        )}

        {filteredReservas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredReservas.map((reserva) => {
              const { date, time } = formatDateTime(reserva.turno.fechaHora)
              const isPendiente = reserva.estado === "PENDIENTE_PAGO"
              const isCancelada = reserva.estado === "CANCELADA"
              const isProcessing = processingIds.includes(reserva.id)

              return (
                <Card
                  key={reserva.id}
                  className={`border ${selectedReservas.includes(reserva.id)
                    ? "border-blue-500 bg-blue-50"
                    : isCancelada
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-200"
                    } hover:shadow-md transition-all duration-200`}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`check-${reserva.id}`}
                          checked={selectedReservas.includes(reserva.id)}
                          onCheckedChange={(checked) => handleCheckboxChange(reserva.id, checked === true)}
                          disabled={isCancelada || isProcessing}
                          className={isCancelada || isProcessing ? "opacity-50" : ""}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getProductIcon(reserva.producto.tipo)}
                            <h3 className="font-medium text-lg text-blue-900">{reserva.producto.nombre}</h3>
                            {getEstadoBadge(reserva.estado)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-800">{reserva.cliente.nombre}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-800 capitalize">{date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-800">{time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-800">
                                ${reserva.producto.precio.toFixed(2)} (
                                {reserva.tipoMoneda === "MONEDA_LOCAL" ? "Local" : "Extranjera"})
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {reserva.cantidadPersonas} {reserva.cantidadPersonas === 1 ? "Persona" : "Personas"}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {reserva.medioPago === "EFECTIVO" ? "Efectivo" : "Transferencia"}
                            </Badge>
                            {reserva.incluyeSeguro && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Con Seguro
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 ml-8 md:ml-0">
                        {isPendiente && (
                          <Button
                            onClick={() => handlePayReserva(reserva.id)}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              "Pagar"
                            )}
                          </Button>
                        )}
                        {!isCancelada && (
                          <Button
                            onClick={() => handleCancelReserva(reserva.id)}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              "Cancelar"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-8 rounded-lg text-center">
            <p className="text-lg">
              No hay reservas {activeTab !== "todas" ? `en estado "${activeTab}"` : ""} en este momento.
            </p>
            <p className="mt-2">Puedes crear nuevas reservas desde la página de turnos disponibles.</p>
          </div>
        )}
      </div>

      {/* Modal de Confirmación para Cancelar */}
      <ConfirmationModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={confirmCancel}
        title="Cancelar Reserva"
        description={`¿Estás seguro de que deseas cancelar ${isMultipleAction ? `las ${selectedReservas.length} reservas seleccionadas` : "esta reserva"}? Esta acción no se puede deshacer.`}
        confirmText="Sí, Cancelar"
        cancelText="No, Volver"
      />

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onConfirm={confirmPayment}
        reservas={
          isMultipleAction
            ? selectedReservas.map((id) => reservas.find((r) => r.id === id)!).filter(Boolean)
            : selectedForAction
              ? [reservas.find((r) => r.id === selectedForAction)!].filter(Boolean)
              : []
        }
      />
    </div>
  )
}