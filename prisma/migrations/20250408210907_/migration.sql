/*
  Warnings:

  - The primary key for the `Cliente` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Cliente` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `dispositivos_seguridad` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `dispositivos_seguridad` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `productos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `productos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `reserva_dispositivos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `reserva_dispositivos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `reserva_productos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `reserva_productos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `reservas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `reservas` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `tipos_moneda` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `tipos_moneda` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `turnos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `turnos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `reservaId` on the `reserva_dispositivos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `dispositivoId` on the `reserva_dispositivos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `reservaId` on the `reserva_productos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `productoId` on the `reserva_productos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `clienteId` on the `reservas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `turnoId` on the `reservas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

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

-- AlterTable
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "dispositivos_seguridad" DROP CONSTRAINT "dispositivos_seguridad_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "dispositivos_seguridad_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "productos" DROP CONSTRAINT "productos_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "productos_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "reserva_dispositivos" DROP CONSTRAINT "reserva_dispositivos_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "reservaId",
ADD COLUMN     "reservaId" INTEGER NOT NULL,
DROP COLUMN "dispositivoId",
ADD COLUMN     "dispositivoId" INTEGER NOT NULL,
ADD CONSTRAINT "reserva_dispositivos_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "reserva_productos" DROP CONSTRAINT "reserva_productos_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "reservaId",
ADD COLUMN     "reservaId" INTEGER NOT NULL,
DROP COLUMN "productoId",
ADD COLUMN     "productoId" INTEGER NOT NULL,
ADD CONSTRAINT "reserva_productos_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "reservas" DROP CONSTRAINT "reservas_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "clienteId",
ADD COLUMN     "clienteId" INTEGER NOT NULL,
DROP COLUMN "turnoId",
ADD COLUMN     "turnoId" INTEGER NOT NULL,
ADD CONSTRAINT "reservas_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "tipos_moneda" DROP CONSTRAINT "tipos_moneda_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "tipos_moneda_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "turnos" DROP CONSTRAINT "turnos_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "turnos_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_dispositivos_reservaId_dispositivoId_key" ON "reserva_dispositivos"("reservaId", "dispositivoId");

-- CreateIndex
CREATE UNIQUE INDEX "reserva_productos_reservaId_productoId_key" ON "reserva_productos"("reservaId", "productoId");

-- CreateIndex
CREATE UNIQUE INDEX "reservas_turnoId_key" ON "reservas"("turnoId");

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
