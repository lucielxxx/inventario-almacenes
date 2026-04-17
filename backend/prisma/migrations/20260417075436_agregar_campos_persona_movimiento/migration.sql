/*
  Warnings:

  - You are about to alter the column `motivo` on the `Movimiento` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.

*/
-- AlterTable
ALTER TABLE "Movimiento" ADD COLUMN     "comprobante_numero" VARCHAR(50),
ADD COLUMN     "obra_destino" VARCHAR(150),
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "persona_cargo" VARCHAR(100),
ADD COLUMN     "persona_identidad" VARCHAR(50),
ADD COLUMN     "persona_nombre" VARCHAR(100),
ADD COLUMN     "proveedor_nombre" VARCHAR(100),
ALTER COLUMN "motivo" SET DATA TYPE VARCHAR(200);
