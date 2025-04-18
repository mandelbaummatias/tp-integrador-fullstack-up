/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `dispositivos_seguridad` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `dispositivos_seguridad` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `productos` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `productos` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `tipos_moneda` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tipos_moneda` table. All the data in the column will be lost.
  - You are about to drop the column `alquilerId` on the `turnos` table. All the data in the column will be lost.
  - You are about to drop the column `clienteId` on the `turnos` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `turnos` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `turnos` table. All the data in the column will be lost.
  - You are about to drop the `alquiler_dispositivos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `alquiler_productos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `alquileres` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pagos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `producto_dispositivos` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('PENDIENTE_PAGO', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA');

-- DropForeignKey
ALTER TABLE "alquiler_dispositivos" DROP CONSTRAINT "alquiler_dispositivos_alquilerId_fkey";

-- DropForeignKey
ALTER TABLE "alquiler_dispositivos" DROP CONSTRAINT "alquiler_dispositivos_dispositivoId_fkey";

-- DropForeignKey
ALTER TABLE "alquiler_productos" DROP CONSTRAINT "alquiler_productos_alquilerId_fkey";

-- DropForeignKey
ALTER TABLE "alquiler_productos" DROP CONSTRAINT "alquiler_productos_productoId_fkey";

-- DropForeignKey
ALTER TABLE "alquileres" DROP CONSTRAINT "alquileres_clienteId_fkey";

-- DropForeignKey
ALTER TABLE "pagos" DROP CONSTRAINT "pagos_alquilerId_fkey";

-- DropForeignKey
ALTER TABLE "pagos" DROP CONSTRAINT "pagos_tipoMonedaId_fkey";

-- DropForeignKey
ALTER TABLE "producto_dispositivos" DROP CONSTRAINT "producto_dispositivos_dispositivoId_fkey";

-- DropForeignKey
ALTER TABLE "producto_dispositivos" DROP CONSTRAINT "producto_dispositivos_productoId_fkey";

-- DropForeignKey
ALTER TABLE "turnos" DROP CONSTRAINT "turnos_alquilerId_fkey";

-- DropForeignKey
ALTER TABLE "turnos" DROP CONSTRAINT "turnos_clienteId_fkey";

-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "dispositivos_seguridad" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "productos" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "tipos_moneda" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "turnos" DROP COLUMN "alquilerId",
DROP COLUMN "clienteId",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "estado" SET DEFAULT 'DISPONIBLE';

-- DropTable
DROP TABLE "alquiler_dispositivos";

-- DropTable
DROP TABLE "alquiler_productos";

-- DropTable
DROP TABLE "alquileres";

-- DropTable
DROP TABLE "pagos";

-- DropTable
DROP TABLE "producto_dispositivos";

-- DropEnum
DROP TYPE "EstadoAlquiler";

-- DropEnum
DROP TYPE "EstadoPago";

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "cantidadPersonas" INTEGER NOT NULL DEFAULT 1,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoReserva" NOT NULL,
    "descuentoAplicado" BOOLEAN NOT NULL DEFAULT false,
    "seguroTormenta" BOOLEAN NOT NULL DEFAULT false,
    "turnoId" TEXT NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva_productos" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "reserva_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva_dispositivos" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "dispositivoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "reserva_dispositivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservas_turnoId_key" ON "reservas"("turnoId");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_productos_reservaId_productoId_key" ON "reserva_productos"("reservaId", "productoId");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_dispositivos_reservaId_dispositivoId_key" ON "reserva_dispositivos"("reservaId", "dispositivoId");

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_productos" ADD CONSTRAINT "reserva_productos_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_productos" ADD CONSTRAINT "reserva_productos_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_dispositivos" ADD CONSTRAINT "reserva_dispositivos_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_dispositivos" ADD CONSTRAINT "reserva_dispositivos_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "dispositivos_seguridad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
