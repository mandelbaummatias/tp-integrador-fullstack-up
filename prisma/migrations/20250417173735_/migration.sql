/*
  Warnings:

  - You are about to drop the column `pagado` on the `reserva` table. All the data in the column will be lost.
  - You are about to drop the column `monto` on the `saldo_cliente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reserva" DROP COLUMN "pagado";

-- AlterTable
ALTER TABLE "saldo_cliente" DROP COLUMN "monto",
ADD COLUMN     "montoExtranjero" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "montoLocal" DOUBLE PRECISION NOT NULL DEFAULT 0;
