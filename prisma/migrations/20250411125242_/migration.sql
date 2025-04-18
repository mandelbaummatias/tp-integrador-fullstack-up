/*
  Warnings:

  - The values [TARJETA] on the enum `MedioPago` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MedioPago_new" AS ENUM ('EFECTIVO', 'TRANSFERENCIA');
ALTER TABLE "reserva" ALTER COLUMN "medioPago" DROP DEFAULT;
ALTER TABLE "reserva" ALTER COLUMN "medioPago" TYPE "MedioPago_new" USING ("medioPago"::text::"MedioPago_new");
ALTER TYPE "MedioPago" RENAME TO "MedioPago_old";
ALTER TYPE "MedioPago_new" RENAME TO "MedioPago";
DROP TYPE "MedioPago_old";
ALTER TABLE "reserva" ALTER COLUMN "medioPago" SET DEFAULT 'EFECTIVO';
COMMIT;
