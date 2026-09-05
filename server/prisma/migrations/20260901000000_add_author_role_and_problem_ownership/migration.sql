ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'AUTHOR';

ALTER TABLE "problemsets" ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE "problemsets"
  ADD CONSTRAINT problemsets_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES "users"(id) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS problemsets_created_by_idx ON "problemsets"(created_by);
