-- Phase 1: guest registration foundation.
-- Creates the configurable event record, guest registrations, and the
-- forward-compatible tables for invitations, check-in, email delivery,
-- activity logging, counters, event staff and configuration audit.

-- CreateTable
CREATE TABLE `GuestEventConfig` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `slug` VARCHAR(120) NOT NULL,
    `eventName` VARCHAR(191) NOT NULL,
    `eventDate` DATETIME(3) NULL,
    `startTime` VARCHAR(5) NOT NULL DEFAULT '09:00',
    `endTime` VARCHAR(5) NOT NULL DEFAULT '17:00',
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Africa/Mogadishu',
    `venue` VARCHAR(191) NULL,
    `location` TEXT NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `registrationOpensAt` DATETIME(3) NULL,
    `registrationClosesAt` DATETIME(3) NULL,
    `capacity` INTEGER NULL,
    `waitingListEnabled` BOOLEAN NOT NULL DEFAULT true,
    `approvalMode` ENUM('MANUAL', 'AUTOMATIC', 'HYBRID') NOT NULL DEFAULT 'MANUAL',
    `automationEnabled` BOOLEAN NOT NULL DEFAULT false,
    `eligibilityRules` JSON NULL,
    `rulesVersion` INTEGER NOT NULL DEFAULT 1,
    `checkInAccess` ENUM('ADMIN_ONLY', 'ADMIN_AND_CHECKIN_STAFF', 'ALL_AUTHORIZED_ORGANIZERS') NOT NULL DEFAULT 'ADMIN_ONLY',
    `registrationPrefix` VARCHAR(40) NULL,
    `guestIdPrefix` VARCHAR(40) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GuestEventConfig_eventId_key`(`eventId`),
    UNIQUE INDEX `GuestEventConfig_slug_key`(`slug`),
    INDEX `GuestEventConfig_isActive_idx`(`isActive`),
    INDEX `GuestEventConfig_eventDate_idx`(`eventDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuestRegistration` (
    `id` VARCHAR(191) NOT NULL,
    `registrationRef` VARCHAR(64) NOT NULL,
    `eventConfigId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `guestId` VARCHAR(40) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED') NOT NULL DEFAULT 'PENDING',
    `fullName` VARCHAR(160) NOT NULL,
    `organization` VARCHAR(200) NOT NULL,
    `position` VARCHAR(160) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `emailNormalized` VARCHAR(254) NOT NULL,
    `phone` VARCHAR(40) NOT NULL,
    `phoneNormalized` VARCHAR(32) NOT NULL,
    `stakeholderCategory` ENUM('GOVERNMENT', 'PRIVATE_SECTOR', 'UNIVERSITY_ACADEMIC', 'NGO_DEVELOPMENT', 'ENTREPRENEUR_STARTUP', 'PARENT_COMMUNITY', 'STUDENT', 'ALUMNI', 'MEDIA', 'VIP_GUEST') NOT NULL,
    `attendanceIntent` ENUM('ATTENDING', 'NOT_ATTENDING', 'NOT_SURE') NOT NULL,
    `companionCount` ENUM('NONE', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE_PLUS') NOT NULL DEFAULT 'NONE',
    `areasOfInterest` JSON NOT NULL,
    `hasAccessibilityNeeds` BOOLEAN NOT NULL DEFAULT false,
    `accessibilityDetails` TEXT NULL,
    `mediaConsent` BOOLEAN NOT NULL,
    `referralSource` ENUM('UNIVERSITY_INSTITUTION', 'SOCIAL_MEDIA', 'EMAIL', 'FRIEND_COLLEAGUE', 'EVENT_ORGANIZER', 'WEBSITE', 'MEDIA', 'OTHER') NOT NULL,
    `additionalComments` TEXT NULL,
    `accuracyConfirmed` BOOLEAN NOT NULL DEFAULT true,
    `privacyConsent` BOOLEAN NOT NULL DEFAULT true,
    `approvalModeAtSubmit` ENUM('MANUAL', 'AUTOMATIC', 'HYBRID') NULL,
    `configVersionAtSubmit` INTEGER NULL,
    `appliedRulesVersion` INTEGER NULL,
    `eligibilityVerdict` VARCHAR(32) NULL,
    `eligibilityDetails` JSON NULL,
    `source` VARCHAR(32) NOT NULL DEFAULT 'web',
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(512) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedBy` VARCHAR(191) NULL,
    `rejectionReason` TEXT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GuestRegistration_registrationRef_key`(`registrationRef`),
    UNIQUE INDEX `GuestRegistration_guestId_key`(`guestId`),
    INDEX `GuestRegistration_eventConfigId_status_submittedAt_idx`(`eventConfigId`, `status`, `submittedAt`),
    INDEX `GuestRegistration_status_submittedAt_idx`(`status`, `submittedAt`),
    INDEX `GuestRegistration_userId_idx`(`userId`),
    INDEX `GuestRegistration_emailNormalized_idx`(`emailNormalized`),
    INDEX `GuestRegistration_phoneNormalized_idx`(`phoneNormalized`),
    UNIQUE INDEX `GuestRegistration_eventConfigId_emailNormalized_key`(`eventConfigId`, `emailNormalized`),
    UNIQUE INDEX `GuestRegistration_eventConfigId_phoneNormalized_key`(`eventConfigId`, `phoneNormalized`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuestInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `invitationNumber` VARCHAR(40) NULL,
    `qrToken` VARCHAR(128) NOT NULL,
    `status` ENUM('PENDING', 'ISSUED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    `eventSnapshot` JSON NULL,
    `issuedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GuestInvitation_registrationId_key`(`registrationId`),
    UNIQUE INDEX `GuestInvitation_invitationNumber_key`(`invitationNumber`),
    UNIQUE INDEX `GuestInvitation_qrToken_key`(`qrToken`),
    INDEX `GuestInvitation_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuestCheckIn` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `checkedInAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `checkedInById` VARCHAR(191) NULL,
    `method` VARCHAR(16) NOT NULL DEFAULT 'QR',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `GuestCheckIn_registrationId_key`(`registrationId`),
    INDEX `GuestCheckIn_checkedInAt_idx`(`checkedInAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuestEmailLog` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NOT NULL,
    `type` ENUM('REGISTRATION_RECEIVED', 'APPROVAL', 'REJECTION', 'AUTOMATED_APPROVAL', 'RESEND') NOT NULL,
    `recipient` VARCHAR(254) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `messageId` VARCHAR(191) NULL,
    `error` TEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GuestEmailLog_registrationId_createdAt_idx`(`registrationId`, `createdAt`),
    INDEX `GuestEmailLog_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuestActivityLog` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` VARCHAR(191) NULL,
    `actorId` VARCHAR(191) NULL,
    `actorLabel` VARCHAR(160) NULL,
    `action` VARCHAR(64) NOT NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GuestActivityLog_registrationId_createdAt_idx`(`registrationId`, `createdAt`),
    INDEX `GuestActivityLog_action_createdAt_idx`(`action`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuestCounter` (
    `id` VARCHAR(191) NOT NULL,
    `eventConfigId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(64) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GuestCounter_eventConfigId_key_key`(`eventConfigId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuestEventStaff` (
    `id` VARCHAR(191) NOT NULL,
    `eventConfigId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `level` ENUM('CHECKIN_STAFF', 'ORGANIZER') NOT NULL,
    `grantedById` VARCHAR(191) NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revokedById` VARCHAR(191) NULL,
    `revokedAt` DATETIME(3) NULL,

    INDEX `GuestEventStaff_eventConfigId_level_revokedAt_idx`(`eventConfigId`, `level`, `revokedAt`),
    INDEX `GuestEventStaff_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GuestConfigAudit` (
    `id` VARCHAR(191) NOT NULL,
    `eventConfigId` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `actorLabel` VARCHAR(160) NULL,
    `action` ENUM('SAVE', 'RESTORE_DEFAULTS', 'MODE_CHANGE', 'AUTOMATION_TOGGLE', 'STAFF_GRANT', 'STAFF_REVOKE', 'REEVALUATE_PENDING') NOT NULL,
    `changedKeys` JSON NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `fromVersion` INTEGER NULL,
    `toVersion` INTEGER NULL,
    `ipAddress` VARCHAR(64) NULL,
    `userAgent` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GuestConfigAudit_eventConfigId_createdAt_idx`(`eventConfigId`, `createdAt`),
    INDEX `GuestConfigAudit_actorId_createdAt_idx`(`actorId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GuestEventConfig` ADD CONSTRAINT `GuestEventConfig_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestRegistration` ADD CONSTRAINT `GuestRegistration_eventConfigId_fkey` FOREIGN KEY (`eventConfigId`) REFERENCES `GuestEventConfig`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestRegistration` ADD CONSTRAINT `GuestRegistration_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestInvitation` ADD CONSTRAINT `GuestInvitation_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `GuestRegistration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestCheckIn` ADD CONSTRAINT `GuestCheckIn_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `GuestRegistration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestEmailLog` ADD CONSTRAINT `GuestEmailLog_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `GuestRegistration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestActivityLog` ADD CONSTRAINT `GuestActivityLog_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `GuestRegistration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestCounter` ADD CONSTRAINT `GuestCounter_eventConfigId_fkey` FOREIGN KEY (`eventConfigId`) REFERENCES `GuestEventConfig`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestEventStaff` ADD CONSTRAINT `GuestEventStaff_eventConfigId_fkey` FOREIGN KEY (`eventConfigId`) REFERENCES `GuestEventConfig`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GuestConfigAudit` ADD CONSTRAINT `GuestConfigAudit_eventConfigId_fkey` FOREIGN KEY (`eventConfigId`) REFERENCES `GuestEventConfig`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
