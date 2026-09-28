-- CreateEnum
CREATE TYPE "ColorMode" AS ENUM ('AUTO', 'LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "FontStyle" AS ENUM ('GROTESK', 'SERIF', 'MONO');

-- CreateEnum
CREATE TYPE "Layout" AS ENUM ('CASE_STUDY', 'COMPACT', 'GRID');

-- CreateEnum
CREATE TYPE "SectionOrder" AS ENUM ('PROJECTS_FIRST', 'SKILLS_FIRST');

-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "colorMode" "ColorMode" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "fontStyle" "FontStyle" NOT NULL DEFAULT 'GROTESK',
ADD COLUMN     "layout" "Layout" NOT NULL DEFAULT 'CASE_STUDY',
ADD COLUMN     "pronouns" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "resumeUrl" TEXT,
ADD COLUMN     "sectionOrder" "SectionOrder" NOT NULL DEFAULT 'PROJECTS_FIRST',
ADD COLUMN     "seoDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "seoTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "showContact" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showGlance" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showSkills" BOOLEAN NOT NULL DEFAULT true;

-- Length limits, mirrored from lib/validation.ts, so bad data can't reach the database from any path.
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_pronouns_length" CHECK (char_length("pronouns") <= 30);
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_seoTitle_length" CHECK (char_length("seoTitle") <= 70);
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_seoDescription_length" CHECK (char_length("seoDescription") <= 160);
