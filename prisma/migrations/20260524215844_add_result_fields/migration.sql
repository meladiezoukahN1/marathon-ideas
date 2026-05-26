-- AlterTable
ALTER TABLE `Challenge` ADD COLUMN `team1FinalScore` DOUBLE NULL,
    ADD COLUMN `team1JuryPct` DOUBLE NULL,
    ADD COLUMN `team1PublicPct` DOUBLE NULL,
    ADD COLUMN `team2FinalScore` DOUBLE NULL,
    ADD COLUMN `team2JuryPct` DOUBLE NULL,
    ADD COLUMN `team2PublicPct` DOUBLE NULL;
