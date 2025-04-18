/*
  Warnings:

  - The primary key for the `Cliente` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `dispositivos_seguridad` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `productos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `reserva_dispositivos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `reserva_productos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `reservas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `tipos_moneda` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `turnos` table will be changed. If it partially fails, the table could be left without primary key constraint.

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
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Cliente_id_seq";

-- AlterTable
ALTER TABLE "dispositivos_seguridad" DROP CONSTRAINT "dispositivos_seguridad_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "dispositivos_seguridad_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "dispositivos_seguridad_id_seq";

-- AlterTable
ALTER TABLE "productos" DROP CONSTRAINT "productos_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "productos_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "productos_id_seq";

-- AlterTable
ALTER TABLE "reserva_dispositivos" DROP CONSTRAINT "reserva_dispositivos_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "reservaId" SET DATA TYPE TEXT,
ALTER COLUMN "dispositivoId" SET DATA TYPE TEXT,
ADD CONSTRAINT "reserva_dispositivos_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "reserva_dispositivos_id_seq";

-- AlterTable
ALTER TABLE "reserva_productos" DROP CONSTRAINT "reserva_productos_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "reservaId" SET DATA TYPE TEXT,
ALTER COLUMN "productoId" SET DATA TYPE TEXT,
ADD CONSTRAINT "reserva_productos_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "reserva_productos_id_seq";

-- AlterTable
ALTER TABLE "reservas" DROP CONSTRAINT "reservas_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "clienteId" SET DATA TYPE TEXT,
ALTER COLUMN "turnoId" SET DATA TYPE TEXT,
ADD CONSTRAINT "reservas_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "reservas_id_seq";

-- AlterTable
ALTER TABLE "tipos_moneda" DROP CONSTRAINT "tipos_moneda_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "tipos_moneda_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "tipos_moneda_id_seq";

-- AlterTable
ALTER TABLE "turnos" DROP CONSTRAINT "turnos_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "turnos_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "turnos_id_seq";

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
