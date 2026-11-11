import type { MigrationInterface, QueryRunner } from 'typeorm'

export class Inicial1794268800000 implements MigrationInterface {
  name = 'Inicial1794268800000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "setor" (
        "id" INTEGER PRIMARY KEY,
        "nome" TEXT NOT NULL,
        "descricao" TEXT NOT NULL
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "lanterna" (
        "id" TEXT PRIMARY KEY,
        "codinome" TEXT NOT NULL,
        "identidadeCivil" TEXT,
        "especie" TEXT,
        "planetaNatal" TEXT,
        "setorId" INTEGER,
        "status" TEXT NOT NULL CHECK ("status" IN ('ativo', 'em_missao', 'afastado')),
        "anoIngresso" INTEGER,
        "primeiraAparicao" TEXT,
        "habilidades" TEXT NOT NULL,
        "mentorId" TEXT,
        "citacao" TEXT,
        "biografia" TEXT,
        "fontes" TEXT NOT NULL,
        "codinomeBusca" TEXT NOT NULL,
        CONSTRAINT "FK_lanterna_setor" FOREIGN KEY ("setorId") REFERENCES "setor" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_lanterna_mentor" FOREIGN KEY ("mentorId") REFERENCES "lanterna" ("id") ON DELETE RESTRICT
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "usuario" (
        "id" varchar(36) PRIMARY KEY,
        "nome" TEXT NOT NULL,
        "email" TEXT NOT NULL COLLATE NOCASE UNIQUE,
        "nomeBusca" TEXT NOT NULL,
        "emailBusca" TEXT NOT NULL,
        "senhaHash" TEXT NOT NULL,
        "papel" TEXT NOT NULL CHECK ("papel" IN ('guardiao', 'lanterna')),
        "setorId" INTEGER,
        "lanternaId" varchar(80) UNIQUE,
        "criadoEm" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        CONSTRAINT "CK_usuario_lanterna_setor" CHECK ("papel" <> 'lanterna' OR "setorId" IS NOT NULL),
        CONSTRAINT "FK_usuario_setor" FOREIGN KEY ("setorId") REFERENCES "setor" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_usuario_lanterna" FOREIGN KEY ("lanternaId") REFERENCES "lanterna" ("id") ON DELETE RESTRICT
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "ocorrencia" (
        "id" varchar(36) PRIMARY KEY,
        "titulo" TEXT NOT NULL,
        "tituloBusca" TEXT NOT NULL,
        "descricao" TEXT NOT NULL,
        "planeta" TEXT NOT NULL,
        "setorId" INTEGER NOT NULL,
        "gravidade" TEXT NOT NULL CHECK ("gravidade" IN ('baixa', 'media', 'alta', 'critica')),
        "status" TEXT NOT NULL CHECK ("status" IN ('aberta', 'em_andamento', 'resolvida')),
        "envolvidos" INTEGER NOT NULL CHECK ("envolvidos" >= 1),
        "responsavelId" TEXT,
        "resolucao" TEXT,
        "criadaPorId" varchar(36) NOT NULL,
        "criadaEm" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        "resolvidaEm" TEXT,
        "excluidaEm" TEXT,
        CONSTRAINT "FK_ocorrencia_setor" FOREIGN KEY ("setorId") REFERENCES "setor" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ocorrencia_responsavel" FOREIGN KEY ("responsavelId") REFERENCES "lanterna" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_ocorrencia_criador" FOREIGN KEY ("criadaPorId") REFERENCES "usuario" ("id") ON DELETE RESTRICT
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "evento" (
        "id" varchar(36) PRIMARY KEY,
        "ocorrenciaId" varchar(36) NOT NULL,
        "tipo" TEXT NOT NULL CHECK ("tipo" IN ('criada', 'atribuida', 'status_alterado', 'reaberta', 'resolvida', 'comentario_apagado')),
        "autorId" varchar(36) NOT NULL,
        "dados" TEXT NOT NULL,
        "criadoEm" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        CONSTRAINT "FK_evento_ocorrencia" FOREIGN KEY ("ocorrenciaId") REFERENCES "ocorrencia" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_evento_autor" FOREIGN KEY ("autorId") REFERENCES "usuario" ("id") ON DELETE RESTRICT
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "comentario" (
        "id" varchar(36) PRIMARY KEY,
        "ocorrenciaId" varchar(36) NOT NULL,
        "autorId" varchar(36) NOT NULL,
        "texto" TEXT NOT NULL CHECK (length("texto") BETWEEN 1 AND 1000),
        "criadoEm" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
        "excluidoEm" TEXT,
        CONSTRAINT "FK_comentario_ocorrencia" FOREIGN KEY ("ocorrenciaId") REFERENCES "ocorrencia" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_comentario_autor" FOREIGN KEY ("autorId") REFERENCES "usuario" ("id") ON DELETE RESTRICT
      )
    `)

    await queryRunner.query('CREATE INDEX "IDX_ocorrencia_setor_status" ON "ocorrencia" ("setorId", "status")')
    await queryRunner.query('CREATE INDEX "IDX_ocorrencia_responsavel_status" ON "ocorrencia" ("responsavelId", "status")')
    await queryRunner.query('CREATE INDEX "IDX_ocorrencia_criadaEm" ON "ocorrencia" ("criadaEm")')
    await queryRunner.query('CREATE INDEX "IDX_evento_ocorrencia_criadoEm" ON "evento" ("ocorrenciaId", "criadoEm")')
    await queryRunner.query('CREATE INDEX "IDX_comentario_ocorrencia_criadoEm" ON "comentario" ("ocorrenciaId", "criadoEm")')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "comentario"')
    await queryRunner.query('DROP TABLE "evento"')
    await queryRunner.query('DROP TABLE "ocorrencia"')
    await queryRunner.query('DROP TABLE "usuario"')
    await queryRunner.query('DROP TABLE "lanterna"')
    await queryRunner.query('DROP TABLE "setor"')
  }
}
