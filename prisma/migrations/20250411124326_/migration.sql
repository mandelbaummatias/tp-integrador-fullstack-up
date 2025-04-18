/*
  Warnings:

  - Changed the type of `nombre` on the `tipo_moneda` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'TARJETA');

-- CreateEnum
CREATE TYPE "TipoMoneda" AS ENUM ('MONEDA_LOCAL', 'MONEDA_EXTRANJERA');

-- AlterTable
ALTER TABLE "reserva" ADD COLUMN     "incluyeSeguro" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medioPago" "MedioPago" NOT NULL DEFAULT 'EFECTIVO',
ADD COLUMN     "pagado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipoMoneda" "TipoMoneda" NOT NULL DEFAULT 'MONEDA_LOCAL',
ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE_PAGO';

-- AlterTable
ALTER TABLE "tipo_moneda" DROP COLUMN "nombre",
ADD COLUMN     "nombre" "TipoMoneda" NOT NULL;

-- DropEnum
DROP TYPE "NombreMoneda";
