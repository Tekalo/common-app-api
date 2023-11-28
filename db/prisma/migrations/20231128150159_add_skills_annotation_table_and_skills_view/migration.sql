-- CreateTable
CREATE TABLE "SkillsAnnotation" (
    "name" CITEXT NOT NULL,
    "canonicalSkill" TEXT NOT NULL,
    "suggest" BOOLEAN NOT NULL,
    "rejectAs" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillsAnnotation_name_key" ON "SkillsAnnotation"("name");
