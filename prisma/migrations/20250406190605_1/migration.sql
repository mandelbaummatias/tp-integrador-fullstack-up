/*
  Warnings:

  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Item";

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "tipo" TEXT NOT NULL,
    "capacidadMax" INTEGER,
    "tipoTabla" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivos_seguridad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispositivos_seguridad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_dispositivos" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "dispositivoId" TEXT NOT NULL,

    CONSTRAINT "producto_dispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER NOT NULL DEFAULT 30,
    "estado" TEXT NOT NULL,
    "clienteId" TEXT,
    "alquilerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alquileres" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL,
    "descuentoAplicado" BOOLEAN NOT NULL DEFAULT false,
    "seguroAplicado" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alquileres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alquiler_productos" (
    "id" TEXT NOT NULL,
    "alquilerId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "alquiler_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alquiler_dispositivos" (
    "id" TEXT NOT NULL,
    "alquilerId" TEXT NOT NULL,
    "dispositivoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "alquiler_dispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "alquilerId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "tipoMonedaId" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_moneda" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tasaCambio" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_moneda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_documento_key" ON "Cliente"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "producto_dispositivos_productoId_dispositivoId_key" ON "producto_dispositivos"("productoId", "dispositivoId");

-- CreateIndex
CREATE UNIQUE INDEX "alquiler_productos_alquilerId_productoId_key" ON "alquiler_productos"("alquilerId", "productoId");

-- CreateIndex
CREATE UNIQUE INDEX "alquiler_dispositivos_alquilerId_dispositivoId_key" ON "alquiler_dispositivos"("alquilerId", "dispositivoId");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_alquilerId_key" ON "pagos"("alquilerId");

-- AddForeignKey
ALTER TABLE "producto_dispositivos" ADD CONSTRAINT "producto_dispositivos_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_dispositivos" ADD CONSTRAINT "producto_dispositivos_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "dispositivos_seguridad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_alquilerId_fkey" FOREIGN KEY ("alquilerId") REFERENCES "alquileres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquileres" ADD CONSTRAINT "alquileres_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler_productos" ADD CONSTRAINT "alquiler_productos_alquilerId_fkey" FOREIGN KEY ("alquilerId") REFERENCES "alquileres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler_productos" ADD CONSTRAINT "alquiler_productos_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler_dispositivos" ADD CONSTRAINT "alquiler_dispositivos_alquilerId_fkey" FOREIGN KEY ("alquilerId") REFERENCES "alquileres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler_dispositivos" ADD CONSTRAINT "alquiler_dispositivos_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "dispositivos_seguridad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_alquilerId_fkey" FOREIGN KEY ("alquilerId") REFERENCES "alquileres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_tipoMonedaId_fkey" FOREIGN KEY ("tipoMonedaId") REFERENCES "tipos_moneda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
