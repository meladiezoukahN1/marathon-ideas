-- Add votingSessionId to Challenge
ALTER TABLE `Challenge` ADD COLUMN `votingSessionId` VARCHAR(191) NULL;

-- Add votingSessionId to PublicVote with default
ALTER TABLE `PublicVote` ADD COLUMN `votingSessionId` VARCHAR(191) NOT NULL DEFAULT 'legacy';

-- Drop old unique constraint and add new one with votingSessionId
DROP INDEX `PublicVote_challengeId_voterToken_key` ON `PublicVote`;
CREATE UNIQUE INDEX `PublicVote_challengeId_votingSessionId_voterToken_key` ON `PublicVote`(`challengeId`, `votingSessionId`, `voterToken`);

-- Add votingSessionId to JuryVote with default
ALTER TABLE `JuryVote` ADD COLUMN `votingSessionId` VARCHAR(191) NOT NULL DEFAULT 'legacy';

-- Drop old unique constraint and add new one with votingSessionId
DROP INDEX `JuryVote_challengeId_jurorId_key` ON `JuryVote`;
CREATE UNIQUE INDEX `JuryVote_challengeId_votingSessionId_jurorId_key` ON `JuryVote`(`challengeId`, `votingSessionId`, `jurorId`);
