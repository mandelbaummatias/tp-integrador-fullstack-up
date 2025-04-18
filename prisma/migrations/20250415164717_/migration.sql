/*
  Warnings:

  - You are about to drop the column `fechaPago` on the `reserva` table. All the data in the column will be lost.
  - You are about to drop the `reserva_producto` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `productoId` to the `reserva` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "reserva_producto" DROP CONSTRAINT "reserva_producto_productoId_fkey";

-- DropForeignKey
ALTER TABLE "reserva_producto" DROP CONSTRAINT "reserva_producto_reservaId_fkey";

-- AlterTable
ALTER TABLE "reserva" DROP COLUMN "fechaPago",
ADD COLUMN     "productoId" TEXT NOT NULL;

-- DropTable
DROP TABLE "reserva_producto";

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
