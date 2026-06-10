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
  const account = await prisma.connectedAccount.findFirst({
    where: { instagramBusinessId: igBusinessId },
    include: { automationSettings: true }
  })

  if (!account || !account.automationSettings || account.automationSettings.autoDmReply === false) {
    return
  }

  const existing = await prisma.automationEvent.findFirst({
    where: { igMessageId: message.mid }
  })

  if (existing) {
    return
  }

  const min = account.automationSettings.dmReplyDelayMin
  const max = account.automationSettings.dmReplyDelayMax
  const delay = Math.floor(Math.random() * ((max - min) * 60 * 1000) + (min * 60 * 1000))

  let outgoingText: string | null = null
  const settings = account.automationSettings

  if (settings.dmUseAi && message.text) {
    outgoingText = await generateAiDmReply(message.text, settings.dmAiPersonality, account.username)
  } else if (settings.dmReplyTemplate) {
    outgoingText = settings.dmReplyTemplate
  }

  await prisma.automationEvent.create({
    data: {
      userId: account.userId,
      connectedAccountId: account.id,
      type: 'DM_REPLY',
      status: 'PENDING',
      igUserId: senderId,
      igMessageId: message.mid,
      incomingText: message.text ?? null,
      outgoingText: outgoingText,
      scheduledFor: new Date(Date.now() + delay)
    }
  })

  console.log(`[AutomationService] Queued DM_REPLY for sender ${senderId} with delay ${Math.round(delay / 1000)}s`)
}



async function executeDmReply(event: any): Promise<void> {
  if (!event.outgoingText || event.outgoingText.trim() === '') {
    throw new Error('No reply text available')
  }

  const { pageAccessToken, instagramBusinessId } = event.connectedAccount

  const res = await fetch(`https://graph.facebook.com/v19.0/${instagramBusinessId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: event.igUserId },
      message: { text: event.outgoingText },
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
        where: { connectedAccountId: event.connectedAccount.id }
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
