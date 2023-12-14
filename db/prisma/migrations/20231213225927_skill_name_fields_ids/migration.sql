-- DropIndex
DROP INDEX "ApplicantSkills_name_key";

-- DropIndex
DROP INDEX "OpportunitySkills_name_key";

-- DropIndex
DROP INDEX "SkillsAnnotation_name_key";

-- AlterTable
ALTER TABLE "ApplicantSkills" ADD CONSTRAINT "ApplicantSkills_pkey" PRIMARY KEY ("name");

-- AlterTable
ALTER TABLE "OpportunitySkills" ADD CONSTRAINT "OpportunitySkills_pkey" PRIMARY KEY ("name");

-- AlterTable
ALTER TABLE "SkillsAnnotation" ADD CONSTRAINT "SkillsAnnotation_pkey" PRIMARY KEY ("name");
