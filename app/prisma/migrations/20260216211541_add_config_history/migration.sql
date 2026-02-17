-- AlterTable
ALTER TABLE "ChallengeMetric" ADD COLUMN     "configHistory" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "pointsPerUnit" INTEGER;
