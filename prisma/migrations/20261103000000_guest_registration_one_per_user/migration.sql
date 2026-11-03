-- Enforce one guest registration per signed-in user per event.
-- Nullable userId is preserved for pre-existing/public rows: MySQL allows
-- multiple NULL values inside a unique index, so legacy rows are unaffected.
CREATE UNIQUE INDEX `GuestRegistration_eventConfigId_userId_key`
    ON `GuestRegistration`(`eventConfigId`, `userId`);
