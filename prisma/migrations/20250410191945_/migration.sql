/*
  Warnings:

  - The values [CONFIRMADA,COMPLETADA] on the enum `EstadoReserva` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `descuentoAplicado` on the `reserva` table. All the data in the column will be lost.
  - You are about to drop the column `pagado` on the `reserva` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `reserva` table. All the data in the column will be lost.
  - You are about to drop the column `duracion` on the `turno` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoReserva_new" AS ENUM ('PENDIENTE_PAGO', 'PAGADA', 'CANCELADA');
ALTER TABLE "reserva" ALTER COLUMN "estado" TYPE "EstadoReserva_new" USING ("estado"::text::"EstadoReserva_new");
ALTER TYPE "EstadoReserva" RENAME TO "EstadoReserva_old";
ALTER TYPE "EstadoReserva_new" RENAME TO "EstadoReserva";
DROP TYPE "EstadoReserva_old";
COMMIT;

-- AlterTable
ALTER TABLE "reserva" DROP COLUMN "descuentoAplicado",
DROP COLUMN "pagado",
DROP COLUMN "total";

-- AlterTable
ALTER TABLE "tipo_moneda" ALTER COLUMN "tasaCambio" SET DEFAULT 2.0;

-- AlterTable
ALTER TABLE "turno" DROP COLUMN "duracion";
