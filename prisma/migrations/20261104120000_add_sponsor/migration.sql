-- Sponsors: public sponsorship proposals with admin approval workflow.

-- CreateTable
CREATE TABLE `Sponsor` (
    `id` VARCHAR(191) NOT NULL,
    `organizationName` VARCHAR(200) NOT NULL,
    `organizationType` VARCHAR(120) NULL,
    `contactName` VARCHAR(160) NULL,
    `email` VARCHAR(254) NULL,
    `phone` VARCHAR(40) NULL,
    `website` VARCHAR(255) NULL,
    `sponsorshipType` VARCHAR(120) NULL,
    `whatTheySponsor` VARCHAR(120) NULL,
    `sponsorshipLevel` VARCHAR(80) NULL,
    `estimatedAmount` VARCHAR(60) NULL,
    `description` TEXT NULL,
    `proposalUrl` TEXT NULL,
    `logoUrl` VARCHAR(512) NULL,
    `status` VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    `isApproved` BOOLEAN NOT NULL DEFAULT false,
    `isRejected` BOOLEAN NOT NULL DEFAULT false,
    `adminNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sponsor_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
