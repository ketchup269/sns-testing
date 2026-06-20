-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "AutomationEvent_userId_idx" ON "AutomationEvent"("userId");

-- CreateIndex
CREATE INDEX "AutomationEvent_accountId_idx" ON "AutomationEvent"("accountId");

-- CreateIndex
CREATE INDEX "AutomationEvent_status_idx" ON "AutomationEvent"("status");

-- CreateIndex
CREATE INDEX "AutomationSettings_userId_idx" ON "AutomationSettings"("userId");

-- CreateIndex
CREATE INDEX "ConnectedAccount_userId_idx" ON "ConnectedAccount"("userId");

-- CreateIndex
CREATE INDEX "PatternCache_userId_idx" ON "PatternCache"("userId");

-- CreateIndex
CREATE INDEX "PatternCache_projectId_idx" ON "PatternCache"("projectId");

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Post_connectedAccountId_idx" ON "Post"("connectedAccountId");

-- CreateIndex
CREATE INDEX "Post_projectId_idx" ON "Post"("projectId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_accountId_idx" ON "Project"("accountId");

-- CreateIndex
CREATE INDEX "ProjectImage_projectId_idx" ON "ProjectImage"("projectId");

-- CreateIndex
CREATE INDEX "ProjectImage_userId_idx" ON "ProjectImage"("userId");

-- CreateIndex
CREATE INDEX "Schedule_postId_idx" ON "Schedule"("postId");

-- CreateIndex
CREATE INDEX "Schedule_status_idx" ON "Schedule"("status");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
