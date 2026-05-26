-- AlterTable
ALTER TABLE `Challenge` ADD COLUMN `team1TimerDurationSeconds` INTEGER NOT NULL DEFAULT 600,
    ADD COLUMN `team1TimerPausedAt` DATETIME(3) NULL,
    ADD COLUMN `team1TimerRemainingSeconds` INTEGER NOT NULL DEFAULT 600,
    ADD COLUMN `team1TimerStartedAt` DATETIME(3) NULL,
    ADD COLUMN `team1TimerStatus` VARCHAR(191) NOT NULL DEFAULT 'READY',
    ADD COLUMN `team2TimerDurationSeconds` INTEGER NOT NULL DEFAULT 600,
    ADD COLUMN `team2TimerPausedAt` DATETIME(3) NULL,
    ADD COLUMN `team2TimerRemainingSeconds` INTEGER NOT NULL DEFAULT 600,
    ADD COLUMN `team2TimerStartedAt` DATETIME(3) NULL,
    ADD COLUMN `team2TimerStatus` VARCHAR(191) NOT NULL DEFAULT 'READY';

-- AlterTable
ALTER TABLE `Event` ADD COLUMN `activeChallengeId` VARCHAR(191) NULL;
