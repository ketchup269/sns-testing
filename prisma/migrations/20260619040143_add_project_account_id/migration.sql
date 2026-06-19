-- DropIndex
DROP INDEX "AutomationSettings_userId_key";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "accountId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ConnectedAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
