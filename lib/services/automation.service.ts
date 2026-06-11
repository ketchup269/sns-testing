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

  // Pick the account that has automation settings with autoDmReply enabled
  const account = allAccounts.find(a => a.automationSettings?.autoDmReply === true)
    || allAccounts.find(a => a.automationSettings != null)
    || allAccounts[0]

  console.log(`[AutomationService] Selected account: ${account.id} (username: ${account.username})`)

  if (!account.automationSettings) {
    console.warn(`[AutomationService] No AutomationSettings for any account with igBusinessId ${igBusinessId} — skipping`)
    return
  }

  console.log(`[AutomationService] Settings: autoDmReply=${account.automationSettings.autoDmReply}, mode=${account.automationSettings.dmMode}`)

  if (account.automationSettings.autoDmReply === false) {
    console.warn(`[AutomationService] autoDmReply is disabled for account ${account.id} — skipping`)
    return
  }

  // Skip echo messages: if senderId matches the account's own IG business ID
  if (senderId === igBusinessId) {
    console.log(`[AutomationService] Skipping echo message from self (senderId === igBusinessId)`)
    return
  }

  const existing = await prisma.automationEvent.findFirst({
    where: {
      accountId: account.id,
      payload: {
        contains: `"igMessageId":"${message.mid}"`
      }
    }
  })

  if (existing) {
    console.log(`[AutomationService] Duplicate message ${message.mid} — already queued`)
    return
  }

  const min = account.automationSettings.dmDelayMin
  const max = account.automationSettings.dmDelayMax
  const delay = Math.floor(Math.random() * ((max - min) * 60 * 1000) + (min * 60 * 1000))

  let outgoingText: string | null = null
  const settings = account.automationSettings

  if (settings.dmMode === 'AI' && message.text) {
    console.log(`[AutomationService] Generating AI reply for: "${message.text}"`)
    outgoingText = await generateAiDmReply(message.text, settings.dmAiPersonality, account.username)
    console.log(`[AutomationService] AI generated reply: "${outgoingText}"`)
  } else if (settings.dmTemplate) {
    outgoingText = settings.dmTemplate
    console.log(`[AutomationService] Using template reply: "${outgoingText}"`)
  } else {
    console.warn(`[AutomationService] No reply mode matched — dmMode: ${settings.dmMode}, has text: ${!!message.text}, has template: ${!!settings.dmTemplate}`)
  }

  const payloadData = {
    igMessageId: message.mid,
    incomingText: message.text ?? null,
    outgoingText: outgoingText
  }

  await prisma.automationEvent.create({
    data: {
      userId: account.userId,
      accountId: account.id,
      eventType: 'DM_REPLY',
      status: 'PENDING',
      igUserId: senderId,
      payload: JSON.stringify(payloadData),
      scheduledFor: new Date(Date.now() + delay)
    }
  })

  console.log(`[AutomationService] ✅ Queued DM_REPLY for sender ${senderId} with delay ${Math.round(delay / 1000)}s`)

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


        if (settings.autoDmReply === false) {
          await markSkipped(event.id)
          continue
        }
        await executeDmReply(event)
        dmReplies++

      await prisma.automationEvent.update({
        where: { id: event.id },
        data: { status: 'DONE', processedAt: new Date() }
      })
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
  processDueEvents
}
