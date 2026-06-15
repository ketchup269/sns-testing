-- AlterTable
ALTER TABLE "AutomationSettings" ADD COLUMN     "autoCommentReply" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "commentAiPersonality" TEXT,
ADD COLUMN     "commentMode" TEXT NOT NULL DEFAULT 'TEMPLATE',
ADD COLUMN     "commentTemplate" TEXT;
