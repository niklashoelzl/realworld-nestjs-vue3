-- CreateTable
CREATE TABLE "subscriptions" (
  "subscriberId" INTEGER NOT NULL,
  "authorId" INTEGER NOT NULL,

  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscriberId", "authorId"),
  CONSTRAINT "subscriptions_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "subscriptions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "subscriptions_subscriberId_idx" ON "subscriptions"("subscriberId");

-- CreateIndex
CREATE INDEX "subscriptions_authorId_idx" ON "subscriptions"("authorId");