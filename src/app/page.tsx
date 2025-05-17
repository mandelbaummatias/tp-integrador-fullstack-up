"use client"


import { useEffect, useState, useCallback } from "react"
import type { Product } from "./interface/Product"
import { SailboatIcon as Boat, Bike, Droplets, Waves, Loader2 } from "lucide-react"
import { getAvailableProducts } from "@/action/product/getAllProducts"
import { Button } from "./components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./components/ui/card"
import { Badge } from "./components/ui/badge"
import { getAvailableTurns } from "@/action/turno/getAvailableTurnos"



export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const loadAvailableProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getAvailableProducts()
    const result2 = await getAvailableTurns()
    console.log("Turnos disponibles:", result2)

    if (result?.ok && result.products) {
      setProducts(result.products)
      console.log("Productos disponibles:", result.products)
    } else {
      setError(result?.message || "Failed to load available products.")
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAvailableProducts()
  }, [loadAvailableProducts])

  const getProductIcon = (tipo: string) => {
    switch (tipo) {
      case "JETSKY":
        return <Boat className="h-10 w-10 text-blue-500" />
      case "CUATRICICLO":
        return <Bike className="h-10 w-10 text-orange-500" />
      case "EQUIPO_BUCEO":
        return <Droplets className="h-10 w-10 text-cyan-500" />
      case "TABLA_SURF":
        return <Waves className="h-10 w-10 text-teal-500" />
      default:
        return <Boat className="h-10 w-10 text-blue-500" />
    }
  }

  const getProductTypeName = (tipo: string) => {
    switch (tipo) {
      case "JETSKY":
        return "Moto Acuática"
      case "CUATRICICLO":
        return "Cuatriciclo"
      case "EQUIPO_BUCEO":
        return "Equipo de Buceo"
      case "TABLA_SURF":
        return "Tabla de Surf"
      default:
        return tipo
    }
  }

  const handleReserve = (productId: string) => {
    console.log("Reservando producto:", productId)
    // Aquí implementarías la lógica para reservar el producto
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-100 to-blue-50">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <p className="mt-4 text-lg text-blue-800">Cargando productos disponibles...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-100 to-blue-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Paraíso Acuático</h1>
          <p className="text-xl text-blue-700">Descubre nuestros productos y vive una experiencia inolvidable</p>
        </header>

        <section>
          <h2 className="text-2xl font-semibold text-blue-800 mb-6">Productos Disponibles</h2>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-blue-200"
                >
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl text-blue-800">{product.nombre}</CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {getProductTypeName(product.tipo)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 pb-4 flex flex-col items-center">
                    <div className="mb-4 p-4 bg-blue-50 rounded-full">{getProductIcon(product.tipo)}</div>
                    <p className="text-2xl font-bold text-blue-900">${product.precio.toFixed(2)}</p>
                  </CardContent>
                  <CardFooter className="bg-gradient-to-r from-blue-50 to-sky-50 pt-2">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleReserve(product.id)}
                    >
                      Reservar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-8 rounded-lg text-center">
              <p className="text-lg">No hay productos disponibles en este momento.</p>
              <p className="mt-2">Por favor, intente más tarde o contacte con nuestro personal.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
