/*
  Warnings:

  - You are about to drop the `Cliente` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dispositivos_seguridad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `productos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reserva_dispositivos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reserva_productos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reservas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tipos_moneda` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `turnos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "reserva_dispositivos" DROP CONSTRAINT "reserva_dispositivos_dispositivoId_fkey";

-- DropForeignKey
ALTER TABLE "reserva_dispositivos" DROP CONSTRAINT "reserva_dispositivos_reservaId_fkey";

-- DropForeignKey
ALTER TABLE "reserva_productos" DROP CONSTRAINT "reserva_productos_productoId_fkey";

-- DropForeignKey
ALTER TABLE "reserva_productos" DROP CONSTRAINT "reserva_productos_reservaId_fkey";

-- DropForeignKey
ALTER TABLE "reservas" DROP CONSTRAINT "reservas_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "reservas" DROP CONSTRAINT "reservas_turnoId_fkey";

-- DropTable
DROP TABLE "Cliente";

-- DropTable
DROP TABLE "dispositivos_seguridad";

-- DropTable
DROP TABLE "productos";

-- DropTable
DROP TABLE "reserva_dispositivos";

-- DropTable
DROP TABLE "reserva_productos";

-- DropTable
DROP TABLE "reservas";

-- DropTable
DROP TABLE "tipos_moneda";

-- DropTable
DROP TABLE "turnos";

-- CreateTable
CREATE TABLE "cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "tipo" "TipoProducto" NOT NULL,
    "capacidadMax" INTEGER,
    "tipoTabla" "TipoTabla",

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivo_seguridad" (
    "id" TEXT NOT NULL,
    "nombre" "NombreDispositivo" NOT NULL,

    CONSTRAINT "dispositivo_seguridad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turno" (
    "id" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER NOT NULL DEFAULT 30,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'DISPONIBLE',

    CONSTRAINT "turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "cantidadPersonas" INTEGER NOT NULL DEFAULT 1,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoReserva" NOT NULL,
    "descuentoAplicado" BOOLEAN NOT NULL DEFAULT false,
    "turnoId" TEXT NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva_producto" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "reserva_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva_dispositivo" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "dispositivoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "reserva_dispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_moneda" (
    "id" TEXT NOT NULL,
    "nombre" "NombreMoneda" NOT NULL,
    "tasaCambio" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "tipo_moneda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cliente_documento_key" ON "cliente"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_turnoId_key" ON "reserva"("turnoId");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_producto_reservaId_productoId_key" ON "reserva_producto"("reservaId", "productoId");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_dispositivo_reservaId_dispositivoId_key" ON "reserva_dispositivo"("reservaId", "dispositivoId");

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_producto" ADD CONSTRAINT "reserva_producto_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_producto" ADD CONSTRAINT "reserva_producto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_dispositivo" ADD CONSTRAINT "reserva_dispositivo_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_dispositivo" ADD CONSTRAINT "reserva_dispositivo_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "dispositivo_seguridad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
