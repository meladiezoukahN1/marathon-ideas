-- AlterTable
ALTER TABLE `Challenge` ADD COLUMN `votingDurationSeconds` INTEGER NOT NULL DEFAULT 120,
    ADD COLUMN `votingEndsAt` DATETIME(3) NULL,
    ADD COLUMN `votingStartedAt` DATETIME(3) NULL;
