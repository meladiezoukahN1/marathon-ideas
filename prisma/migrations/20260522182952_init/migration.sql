-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPERADMIN', 'ADMIN', 'JURY') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_role_isActive_idx`(`role`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `challenges` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `nameAr` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `challenges_slug_key`(`slug`),
    UNIQUE INDEX `challenges_order_key`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teams` (
    `id` VARCHAR(191) NOT NULL,
    `nameAr` VARCHAR(191) NOT NULL,
    `ideaAr` VARCHAR(191) NOT NULL,
    `challengeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `teams_challengeId_idx`(`challengeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matches` (
    `id` VARCHAR(191) NOT NULL,
    `challengeId` VARCHAR(191) NOT NULL,
    `team1Id` VARCHAR(191) NOT NULL,
    `team2Id` VARCHAR(191) NOT NULL,
    `winnerId` VARCHAR(191) NULL,
    `phase` ENUM('WAITING', 'BRACKET_PREVIEW', 'PRESENTING_TEAM1', 'PRESENTING_TEAM2', 'VOTING', 'CLOSED', 'WINNER_REVEAL', 'BRACKET_UPDATE', 'RESULT') NOT NULL DEFAULT 'WAITING',
    `resultStatus` ENUM('NOT_CALCULATED', 'CALCULATED', 'TIE_PENDING', 'TIE_RESOLVED') NOT NULL DEFAULT 'NOT_CALCULATED',
    `team1Final` DOUBLE NULL,
    `team2Final` DOUBLE NULL,
    `timerSecs` INTEGER NOT NULL DEFAULT 600,
    `timerActive` BOOLEAN NOT NULL DEFAULT false,
    `voteOpenAt` DATETIME(3) NULL,
    `voteCloseAt` DATETIME(3) NULL,
    `resultShownAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `matches_challengeId_key`(`challengeId`),
    INDEX `matches_phase_idx`(`phase`),
    INDEX `matches_resultStatus_idx`(`resultStatus`),
    INDEX `matches_winnerId_idx`(`winnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jury_votes` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `jury_votes_matchId_teamId_idx`(`matchId`, `teamId`),
    INDEX `jury_votes_userId_idx`(`userId`),
    UNIQUE INDEX `jury_votes_matchId_userId_key`(`matchId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `public_votes` (
    `id` VARCHAR(191) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `teamId` VARCHAR(191) NOT NULL,
    `hashedIp` VARCHAR(191) NOT NULL,
    `fingerprintHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `public_votes_matchId_idx`(`matchId`),
    INDEX `public_votes_matchId_hashedIp_idx`(`matchId`, `hashedIp`),
    INDEX `public_votes_matchId_fingerprintHash_idx`(`matchId`, `fingerprintHash`),
    INDEX `public_votes_matchId_teamId_idx`(`matchId`, `teamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_control` (
    `id` VARCHAR(191) NOT NULL,
    `displayMode` ENUM('EVENT_WAITING', 'BRACKET_PREVIEW', 'PRESENTING_TEAM', 'VOTING', 'VOTING_CLOSED', 'WINNER_REVEAL', 'BRACKET_UPDATE', 'FINAL_BRACKET', 'EVENT_FINISHED') NOT NULL DEFAULT 'EVENT_WAITING',
    `currentMatchId` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `action` ENUM('USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'TEAM_UPDATED', 'PHASE_CHANGED', 'TIMER_CHANGED', 'VOTING_OPENED', 'VOTING_CLOSED', 'RESULT_CALCULATED', 'RESULT_SHOWN', 'TIE_RESOLVED', 'DISPLAY_MODE_CHANGED') NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actorId_idx`(`actorId`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `teams` ADD CONSTRAINT `teams_challengeId_fkey` FOREIGN KEY (`challengeId`) REFERENCES `challenges`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_challengeId_fkey` FOREIGN KEY (`challengeId`) REFERENCES `challenges`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_team1Id_fkey` FOREIGN KEY (`team1Id`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_team2Id_fkey` FOREIGN KEY (`team2Id`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matches` ADD CONSTRAINT `matches_winnerId_fkey` FOREIGN KEY (`winnerId`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jury_votes` ADD CONSTRAINT `jury_votes_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jury_votes` ADD CONSTRAINT `jury_votes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jury_votes` ADD CONSTRAINT `jury_votes_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `public_votes` ADD CONSTRAINT `public_votes_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `public_votes` ADD CONSTRAINT `public_votes_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
