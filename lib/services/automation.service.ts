import { prisma } from '@/lib/prisma'
// import { IG_GRAPH_BASE } from '@/lib/constants'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function generateAiDmReply(
  incomingText: string,
  personality: string | null | undefined,
  accountUsername: string | null | undefined
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return 'ありがとうございます！🙏'
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `You are replying to a direct message on Instagram on behalf of @${accountUsername}.
${personality ? `Personality/tone: ${personality}` : ''}
Incoming message: '${incomingText}'
Write a single natural reply. Maximum 2 sentences. Sound human.
Match the language of the incoming message (Japanese or English).
Return ONLY the reply text, nothing else.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return text.trim()
  } catch (error) {
    console.error('[AutomationService] AI generation failed:', error)
    return 'ありがとうございます！🙏'
  }
}

async function generateAiCommentReply(
  incomingText: string,
  personality: string | null | undefined,
  accountUsername: string | null | undefined
): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return 'ありがとうございます！🎉'
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `You are replying to a comment on Instagram on behalf of @${accountUsername}.
${personality ? `Personality/tone: ${personality}` : ''}
Incoming comment: '${incomingText}'
Write a single natural reply. Maximum 2 sentences. Sound human.
Match the language of the incoming comment (Japanese or English).
Return ONLY the reply text, nothing else.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return text.trim()
  } catch (error) {
    console.error('[AutomationService] AI comment generation failed:', error)
    return 'ありがとうございます！🎉'
  }
}



async function handleDmEvent(
  igBusinessId: string,
  senderId: string,
  message: { mid: string; text?: string }
): Promise<void> {
  console.log(`[AutomationService] handleDmEvent called:`, { igBusinessId, senderId, mid: message.mid, text: message.text })

  // Find ALL accounts with this IG business ID (there may be duplicates for different users)
  // Then pick the one that actually has automation settings enabled
  const allAccounts = await prisma.connectedAccount.findMany({
    where: { instagramBusinessId: igBusinessId },
    include: { automationSettings: true }
  })

  if (allAccounts.length === 0) {
    console.warn(`[AutomationService] No ConnectedAccount found for instagramBusinessId: ${igBusinessId}`)
    return
  }

  console.log(`[AutomationService] Found ${allAccounts.length} accounts for igBusinessId ${igBusinessId}`)

  // Find ALL accounts with this IG business ID that have autoDmReply enabled
  const activeAccounts = allAccounts.filter(a => a.automationSettings?.autoDmReply === true)

  if (activeAccounts.length === 0) {
    console.warn(`[AutomationService] No accounts with autoDmReply enabled for igBusinessId ${igBusinessId} — skipping`)
    return
  }

  // Skip echo messages: if senderId matches the account's own IG business ID
  if (senderId === igBusinessId) {
    console.log(`[AutomationService] Skipping echo message from self (senderId === igBusinessId)`)
    return
  }

  // We use the first active account as the "primary" to determine delay and template
  const primaryAccount = activeAccounts[0]
  const settings = primaryAccount.automationSettings!

  const existing = await prisma.automationEvent.findFirst({
    where: {
      accountId: primaryAccount.id,
      payload: {
        contains: `"igMessageId":"${message.mid}"`
      }
    }
  })

  if (existing) {
    console.log(`[AutomationService] Duplicate message ${message.mid} — already queued`)
    return
  }

  const min = settings.dmDelayMin
  const max = settings.dmDelayMax
  const delay = Math.floor(Math.random() * ((max - min) * 60 * 1000) + (min * 60 * 1000))

  let outgoingText: string | null = null

  if (settings.dmMode === 'AI' && message.text) {
    console.log(`[AutomationService] Generating AI reply for: "${message.text}"`)
    outgoingText = await generateAiDmReply(message.text, settings.dmAiPersonality, primaryAccount.username)
    console.log(`[AutomationService] AI generated reply: "${outgoingText}"`)
  } else if (settings.dmTemplate) {
    outgoingText = settings.dmTemplate
    console.log(`[AutomationService] Using template reply: "${outgoingText}"`)
  }

  const payloadData = {
    igMessageId: message.mid,
    incomingText: message.text ?? null,
    outgoingText: outgoingText
  }

  const scheduledFor = new Date(Date.now() + delay)

  // Create an event for EVERY active account so all users see the logs
  for (const acc of activeAccounts) {
    await prisma.automationEvent.create({
      data: {
        userId: acc.userId,
        accountId: acc.id,
        eventType: 'DM_REPLY',
        status: 'PENDING',
        igUserId: senderId,
        payload: JSON.stringify(payloadData),
        scheduledFor: scheduledFor
      }
    })
  }

  console.log(`[AutomationService] ✅ Queued DM_REPLY for sender ${senderId} across ${activeAccounts.length} accounts with delay ${Math.round(delay / 1000)}s`)

  // Auto-process: schedule processDueEvents to run after the delay expires
  // This ensures the reply is sent without needing an external cron trigger
  setTimeout(async () => {
    try {
      console.log(`[AutomationService] Auto-processing due events...`)
      const result = await processDueEvents()
      console.log(`[AutomationService] Auto-process complete:`, result)
    } catch (e) {
      console.error(`[AutomationService] Auto-process failed:`, e)
    }
  }, delay + 3000) // Add 3s buffer to ensure scheduledFor has passed
}

async function handleCommentEvent(
  igBusinessId: string,
  senderId: string,
  message: { commentId: string; text: string; mediaId?: string }
): Promise<void> {
  console.log(`[AutomationService] handleCommentEvent called:`, { igBusinessId, senderId, commentId: message.commentId, text: message.text })

  const allAccounts = await prisma.connectedAccount.findMany({
    where: { instagramBusinessId: igBusinessId },
    include: { automationSettings: true }
  })

  if (allAccounts.length === 0) return

  // Find all active accounts
  const activeAccounts = allAccounts.filter(a => a.automationSettings?.autoCommentReply === true)
  if (activeAccounts.length === 0) return

  // Skip echo comments
  if (senderId === igBusinessId) return

  const primaryAccount = activeAccounts[0]
  const settings = primaryAccount.automationSettings!

  const existing = await prisma.automationEvent.findFirst({
    where: {
      accountId: primaryAccount.id,
      payload: {
        contains: `"igCommentId":"${message.commentId}"`
      }
    }
  })

  if (existing) return

  // Reuse DM delay settings
  const min = settings.dmDelayMin
  const max = settings.dmDelayMax
  const delay = Math.floor(Math.random() * ((max - min) * 60 * 1000) + (min * 60 * 1000))

  let outgoingText: string | null = null

  if (settings.commentMode === 'AI' && message.text) {
    outgoingText = await generateAiCommentReply(message.text, settings.commentAiPersonality, primaryAccount.username)
  } else if (settings.commentTemplate) {
    outgoingText = settings.commentTemplate
  }

  const payloadData = {
    igCommentId: message.commentId,
    incomingText: message.text,
    outgoingText: outgoingText
  }

  const scheduledFor = new Date(Date.now() + delay)

  for (const acc of activeAccounts) {
    await prisma.automationEvent.create({
      data: {
        userId: acc.userId,
        accountId: acc.id,
        eventType: 'COMMENT_REPLY',
        status: 'PENDING',
        igUserId: senderId,
        payload: JSON.stringify(payloadData),
        scheduledFor: scheduledFor
      }
    })
  }

  console.log(`[AutomationService] ✅ Queued COMMENT_REPLY for sender ${senderId} across ${activeAccounts.length} accounts with delay ${Math.round(delay / 1000)}s`)

  setTimeout(async () => {
    try {
      await processDueEvents()
    } catch (e) {
      console.error(`[AutomationService] Auto-process failed:`, e)
    }
  }, delay + 3000)
}



async function executeDmReply(event: any): Promise<void> {
  let outgoingText = ''
  try {
    const parsed = JSON.parse(event.payload || '{}')
    outgoingText = parsed.outgoingText ?? ''
  } catch (e) {}

  if (!outgoingText || outgoingText.trim() === '') {
    throw new Error('No reply text available')
  }

  const { pageAccessToken, instagramBusinessId } = event.connectedAccount

  const res = await fetch(`https://graph.facebook.com/v19.0/${instagramBusinessId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: event.igUserId },
      message: { text: outgoingText },
      access_token: pageAccessToken
    })
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    throw new Error(`DM failed: ${data.error?.message ?? 'unknown'}`)
  }

  console.log(`[AutomationService] Sent DM reply to ${event.igUserId}`)
}

async function executeCommentReply(event: any): Promise<void> {
  let outgoingText = ''
  let igCommentId = ''
  try {
    const parsed = JSON.parse(event.payload || '{}')
    outgoingText = parsed.outgoingText ?? ''
    igCommentId = parsed.igCommentId ?? ''
  } catch (e) {}

  if (!outgoingText || outgoingText.trim() === '' || !igCommentId) {
    throw new Error('No reply text or comment ID available')
  }

  const { pageAccessToken } = event.connectedAccount

  const res = await fetch(`https://graph.facebook.com/v19.0/${igCommentId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: outgoingText,
      access_token: pageAccessToken
    })
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    throw new Error(`Comment reply failed: ${data.error?.message ?? 'unknown'}`)
  }

  console.log(`[AutomationService] Sent Comment reply for comment ${igCommentId}`)
}

async function markSkipped(id: string): Promise<void> {
  await prisma.automationEvent.update({
    where: { id },
    data: { status: 'SKIPPED', processedAt: new Date() }
  })
}

async function processDueEvents(): Promise<{
  dmReplies: number
  failed: number
}> {
  const events = await prisma.automationEvent.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: new Date() }
    },
    include: { connectedAccount: true },
    take: 20
  })

  let dmReplies = 0
  let failed = 0

  for (const event of events) {
    try {
      // 1. Check if another event for the same exact message/comment was already processed
      const parsed = JSON.parse(event.payload || '{}')
      const msgId = parsed.igMessageId || parsed.igCommentId

      if (msgId) {
         const alreadyDone = await prisma.automationEvent.findFirst({
           where: {
             payload: { contains: msgId },
             status: { in: ['DONE', 'PROCESSING', 'FAILED'] },
             id: { not: event.id }
           }
         })
         
         if (alreadyDone) {
            // A sibling event already handled the API call. Just copy its status.
            await prisma.automationEvent.update({
              where: { id: event.id },
              data: { status: alreadyDone.status, error: alreadyDone.error, processedAt: alreadyDone.processedAt || new Date() }
            })
            continue;
         }
      }

      // 2. Claim the event to process it ourselves
      const result = await prisma.automationEvent.updateMany({
        where: { id: event.id, status: 'PENDING' },
        data: { status: 'PROCESSING' }
      })

      if (result.count === 0) {
        continue
      }

      const settings = await prisma.automationSettings.findUnique({
        where: { accountId: event.connectedAccount.id }
      })

      if (!settings) {
        await markSkipped(event.id)
        continue
      }

      if (event.eventType === 'DM_REPLY') {
        if (settings.autoDmReply === false) {
          await markSkipped(event.id)
          continue
        }
        await executeDmReply(event)
        dmReplies++
      } else if (event.eventType === 'COMMENT_REPLY') {
        if (settings.autoCommentReply === false) {
          await markSkipped(event.id)
          continue
        }
        await executeCommentReply(event)
        dmReplies++ // Re-using dmReplies count for all replies
      } else {
        await markSkipped(event.id)
        continue
      }

      await prisma.automationEvent.update({
        where: { id: event.id },
        data: { status: 'DONE', processedAt: new Date() }
      })

      // We don't strictly need to manually update siblings here, 
      // because they will naturally find our 'DONE' status when they are processed in the loop!

    } catch (error: unknown) {
      failed++
      await prisma.automationEvent.update({
        where: { id: event.id },
        data: { status: 'FAILED', error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }

  return { dmReplies, failed }
}

export const automationService = {
  handleDmEvent,
  handleCommentEvent,
  processDueEvents
}
