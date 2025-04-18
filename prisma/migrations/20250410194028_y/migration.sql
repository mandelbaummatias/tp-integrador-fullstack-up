-- CreateTable
CREATE TABLE "saldo_cliente" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "saldo_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saldo_cliente_clienteId_key" ON "saldo_cliente"("clienteId");

-- AddForeignKey
ALTER TABLE "saldo_cliente" ADD CONSTRAINT "saldo_cliente_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
