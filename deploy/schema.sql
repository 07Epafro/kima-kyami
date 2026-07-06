-- KiMa Kyami schema 

CREATE TYPE "Categoria" AS ENUM ('SALTOS', 'SANDALIAS', 'MULES', 'COLECAO_LIMITADA');
CREATE TYPE "EstadoEncomenda" AS ENUM ('PENDENTE', 'PAGAMENTO_ANALISE', 'CONFIRMADA', 'EM_PREPARACAO', 'ENVIADA', 'ENTREGUE', 'CANCELADA', 'DEVOLVIDA');
CREATE TYPE "EstadoPagamento" AS ENUM ('AGUARDA_COMPROVANTE', 'COMPROVANTE_SUBMETIDO', 'VALIDADO_AUTO_OK', 'VALIDADO_AUTO_ALERTA', 'VALIDADO_AUTO_REJEITADO', 'CONFIRMADO_ADMIN', 'REJEITADO_ADMIN');
CREATE TYPE "RoleAdmin" AS ENUM ('SUPER_ADMIN', 'GESTOR');

CREATE TABLE "Produto" (
  "id"           TEXT NOT NULL,
  "nome"         TEXT NOT NULL,
  "slug"         TEXT NOT NULL,
  "descricao"    TEXT NOT NULL,
  "preco"        DOUBLE PRECISION NOT NULL,
  "precoAntes"   DOUBLE PRECISION,
  "categoria"    "Categoria" NOT NULL,
  "colecao"      TEXT,
  "imagens"      TEXT[],
  "tamanhos"     INTEGER[],
  "cores"        JSONB[],
  "stock"        JSONB NOT NULL,
  "destaque"     BOOLEAN NOT NULL DEFAULT false,
  "emBreve"      BOOLEAN NOT NULL DEFAULT false,
  "ativo"        BOOLEAN NOT NULL DEFAULT true,
  "metaTitle"    TEXT,
  "metaDesc"     TEXT,
  "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Produto_slug_key" ON "Produto"("slug");

CREATE TABLE "Cliente" (
  "id"       TEXT NOT NULL,
  "nome"     TEXT NOT NULL,
  "email"    TEXT NOT NULL,
  "telefone" TEXT,
  "morada"   JSONB,
  "notas"    TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

CREATE TABLE "Encomenda" (
  "id"             TEXT NOT NULL,
  "referencia"     TEXT NOT NULL,
  "clienteId"      TEXT NOT NULL,
  "subtotal"       DOUBLE PRECISION NOT NULL,
  "portes"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total"          DOUBLE PRECISION NOT NULL,
  "moradaEnvio"    JSONB NOT NULL,
  "estado"         "EstadoEncomenda" NOT NULL DEFAULT 'PENDENTE',
  "notas"          TEXT,
  "numeroTracking" TEXT,
  "criadaEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadaEm"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Encomenda_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Encomenda_referencia_key" ON "Encomenda"("referencia");

CREATE TABLE "ItemEncomenda" (
  "id"          TEXT NOT NULL,
  "encomendaId" TEXT NOT NULL,
  "produtoId"   TEXT NOT NULL,
  "tamanho"     INTEGER NOT NULL,
  "cor"         TEXT NOT NULL,
  "quantidade"  INTEGER NOT NULL,
  "precoUnit"   DOUBLE PRECISION NOT NULL,
  CONSTRAINT "ItemEncomenda_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Pagamento" (
  "id"               TEXT NOT NULL,
  "encomendaId"      TEXT NOT NULL,
  "valor"            DOUBLE PRECISION NOT NULL,
  "ibanDestinatario" TEXT NOT NULL,
  "referencia"       TEXT NOT NULL,
  "comprovante"      TEXT,
  "estado"           "EstadoPagamento" NOT NULL DEFAULT 'AGUARDA_COMPROVANTE',
  "validacaoScript"  JSONB,
  "validacaoAdmin"   BOOLEAN,
  "notaAdmin"        TEXT,
  "criadoEm"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verificadoEm"     TIMESTAMP(3),
  CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Pagamento_encomendaId_key" ON "Pagamento"("encomendaId");

CREATE TABLE "Admin" (
  "id"       TEXT NOT NULL,
  "nome"     TEXT NOT NULL,
  "email"    TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role"     "RoleAdmin" NOT NULL DEFAULT 'GESTOR',
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

ALTER TABLE "Encomenda"    ADD CONSTRAINT "Encomenda_clienteId_fkey"      FOREIGN KEY ("clienteId")    REFERENCES "Cliente"("id")   ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemEncomenda" ADD CONSTRAINT "ItemEncomenda_encomendaId_fkey" FOREIGN KEY ("encomendaId") REFERENCES "Encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ItemEncomenda" ADD CONSTRAINT "ItemEncomenda_produtoId_fkey"   FOREIGN KEY ("produtoId")   REFERENCES "Produto"("id")   ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pagamento"    ADD CONSTRAINT "Pagamento_encomendaId_fkey"     FOREIGN KEY ("encomendaId") REFERENCES "Encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
