ALTER TABLE "problemsets" ADD COLUMN "contest_id" INTEGER;
ALTER TABLE "problemsets" ADD CONSTRAINT "problemsets_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
