-- CreateEnum
CREATE TYPE "Satisfaction" AS ENUM ('OUI', 'PARTIELLEMENT', 'NON');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trainerName" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participantNom" TEXT,
    "participantPrenoms" TEXT,
    "participantFonction" TEXT,
    "participantEntreprise" TEXT,
    "envAccueil" INTEGER,
    "envLieu" INTEGER,
    "envMateriel" INTEGER,
    "envAmeliorations" TEXT,
    "contAttentes" INTEGER,
    "contUtiliteTravail" INTEGER,
    "contExercices" INTEGER,
    "contMethodologie" INTEGER,
    "contSupports" INTEGER,
    "contRythme" INTEGER,
    "contGlobal" INTEGER,
    "formMaitrise" INTEGER,
    "formCommunication" INTEGER,
    "formClarte" INTEGER,
    "formMethodo" INTEGER,
    "formGlobal" INTEGER,
    "reponduAttentes" "Satisfaction",
    "formationsComplementaires" TEXT,
    "temoignage" TEXT,
    "consentementTemoignage" BOOLEAN,
    "userAgent" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Form_slug_key" ON "Form"("slug");

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
