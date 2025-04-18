/*
  Warnings:

  - The `tipoTabla` column on the `productos` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `estado` on the `alquileres` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `nombre` on the `dispositivos_seguridad` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `estado` on the `pagos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tipo` on the `productos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `nombre` on the `tipos_moneda` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `estado` on the `turnos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('JETSKY', 'CUATRICICLO', 'EQUIPO_BUCEO', 'TABLA_SURF');

-- CreateEnum
CREATE TYPE "TipoTabla" AS ENUM ('NINO', 'ADULTO');

-- CreateEnum
CREATE TYPE "NombreDispositivo" AS ENUM ('CASCO', 'CHALECO_SALVAVIDAS');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('RESERVADO', 'CANCELADO', 'DISPONIBLE');

-- CreateEnum
CREATE TYPE "EstadoAlquiler" AS ENUM ('EN_PROCESO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO');

-- CreateEnum
CREATE TYPE "NombreMoneda" AS ENUM ('MONEDA_LOCAL', 'MONEDA_EXTRANJERA');

-- AlterTable
ALTER TABLE "alquileres" DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoAlquiler" NOT NULL;

-- AlterTable
ALTER TABLE "dispositivos_seguridad" DROP COLUMN "nombre",
ADD COLUMN     "nombre" "NombreDispositivo" NOT NULL;

-- AlterTable
ALTER TABLE "pagos" DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoPago" NOT NULL;

-- AlterTable
ALTER TABLE "productos" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoProducto" NOT NULL,
DROP COLUMN "tipoTabla",
ADD COLUMN     "tipoTabla" "TipoTabla";

-- AlterTable
ALTER TABLE "tipos_moneda" DROP COLUMN "nombre",
ADD COLUMN     "nombre" "NombreMoneda" NOT NULL;

-- AlterTable
ALTER TABLE "turnos" DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoTurno" NOT NULL;
