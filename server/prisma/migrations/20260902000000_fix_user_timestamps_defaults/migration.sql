-- Fix legacy rows that may have NULL timestamps and ensure future inserts always get valid values.
UPDATE "users"
SET "createdAt" = COALESCE("createdAt", NOW()),
    "updatedAt" = COALESCE("updatedAt", NOW())
WHERE "createdAt" IS NULL OR "updatedAt" IS NULL;

UPDATE "problemsets"
SET "createdAt" = COALESCE("createdAt", NOW()),
    "updatedAt" = COALESCE("updatedAt", NOW())
WHERE "createdAt" IS NULL OR "updatedAt" IS NULL;

UPDATE "submissions"
SET "createdAt" = COALESCE("createdAt", NOW()),
    "updatedAt" = COALESCE("updatedAt", NOW())
WHERE "createdAt" IS NULL OR "updatedAt" IS NULL;

ALTER TABLE "users"
    ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "problemsets"
    ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "submissions"
    ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
