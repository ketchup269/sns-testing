-- ═══════════════════════════════════════════════════════════════
-- PRODUCTION MIGRATION: Project Settings Overhaul
-- Run this ONCE against your production database to migrate
-- from the old schema to the new one.
-- ═══════════════════════════════════════════════════════════════

-- Add new columns that didn't exist before
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "exampleCaptions" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "campaignSpecificInstructions" TEXT;

-- Done! After running this, run `npx prisma db push` to verify sync.
