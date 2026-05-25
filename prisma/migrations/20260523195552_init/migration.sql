-- CreateEnum
CREATE TYPE "NivelBloom" AS ENUM ('RECORDAR', 'COMPRENDER', 'APLICAR', 'ANALIZAR', 'EVALUAR', 'CREAR');

-- CreateTable
CREATE TABLE "NivelEducativo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "NivelEducativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asignatura" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Asignatura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EjeCurricular" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "asignaturaId" INTEGER NOT NULL,

    CONSTRAINT "EjeCurricular_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjetivoAprendizaje" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivelBloom" "NivelBloom" NOT NULL,
    "indicadores" TEXT NOT NULL,
    "nivelEducativoId" INTEGER NOT NULL,
    "asignaturaId" INTEGER NOT NULL,
    "ejeCurricularId" INTEGER NOT NULL,

    CONSTRAINT "ObjetivoAprendizaje_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NivelEducativo_nombre_key" ON "NivelEducativo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Asignatura_nombre_key" ON "Asignatura"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "EjeCurricular_nombre_asignaturaId_key" ON "EjeCurricular"("nombre", "asignaturaId");

-- CreateIndex
CREATE UNIQUE INDEX "ObjetivoAprendizaje_codigo_nivelEducativoId_asignaturaId_ej_key" ON "ObjetivoAprendizaje"("codigo", "nivelEducativoId", "asignaturaId", "ejeCurricularId");

-- AddForeignKey
ALTER TABLE "EjeCurricular" ADD CONSTRAINT "EjeCurricular_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjetivoAprendizaje" ADD CONSTRAINT "ObjetivoAprendizaje_nivelEducativoId_fkey" FOREIGN KEY ("nivelEducativoId") REFERENCES "NivelEducativo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjetivoAprendizaje" ADD CONSTRAINT "ObjetivoAprendizaje_asignaturaId_fkey" FOREIGN KEY ("asignaturaId") REFERENCES "Asignatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjetivoAprendizaje" ADD CONSTRAINT "ObjetivoAprendizaje_ejeCurricularId_fkey" FOREIGN KEY ("ejeCurricularId") REFERENCES "EjeCurricular"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
