CREATE TABLE "notifications" (
  "id" SERIAL PRIMARY KEY,
  "message" TEXT NOT NULL CHECK (length(btrim("message")) > 0),
  "sender_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt" DESC);
