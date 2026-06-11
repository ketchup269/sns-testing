'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth.utils'
import { ActionResult } from '@/lib/types'
import { AutomationSettings, AutomationEvent } from '@/lib/prisma-client'

export interface AutomationSettingsInput {
  connectedAccountId: string
  autoDmReply: boolean
  dmReplyTemplate: string
  dmReplyDelayMin: number
  dmReplyDelayMax: number
  dmUseAi: boolean
  dmAiPersonality: string
}

export async function saveAutomationSettings(input: AutomationSettingsInput): Promise<ActionResult> {
  try {
    const userId = await requireAuth()

    const account = await prisma.connectedAccount.findFirst({
      where: { id: input.connectedAccountId, userId }
    })

    if (!account) {
      return { error: 'Account not found' }
    }

    const data = {
      accountId: input.connectedAccountId,
      autoDmReply: input.autoDmReply,
      dmTemplate: input.dmReplyTemplate,
      dmDelayMin: input.dmReplyDelayMin,
      dmDelayMax: input.dmReplyDelayMax,
      dmMode: input.dmUseAi ? "AI" : "TEMPLATE",
      dmAiPersonality: input.dmAiPersonality
    }

    await prisma.automationSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data
    })

    revalidatePath('/automation')
    return { success: true }
  } catch (e: any) {
    if (e.isAuthError) return { error: 'Unauthorized' }
    console.error('[saveAutomationSettings]', e)
    return { error: 'Failed to save automation settings' }
  }
}

export async function getAutomationSettings(): Promise<ActionResult<AutomationSettings | null>> {
  try {
    const userId = await requireAuth()
    const settings = await prisma.automationSettings.findUnique({
      where: { userId }
    })
    return { success: true, data: settings }
  } catch (e: any) {
    if (e.isAuthError) return { error: 'Unauthorized' }
    console.error('[getAutomationSettings]', e)
    return { error: 'Failed to get automation settings' }
  }
}

export async function getAutomationLog(page: number = 1, limit: number = 20): Promise<ActionResult<{ events: any[], total: number, pages: number }>> {
  try {
    const userId = await requireAuth()
    const skip = (page - 1) * limit

    // Find the current user's connected account to get their instagramBusinessId
    const userAccount = await prisma.connectedAccount.findFirst({
      where: { userId },
      select: { instagramBusinessId: true }
    })

    // If the user has an account, find ALL accounts sharing the same IG business ID
    // This ensures all users connected to the same IG profile see the same activity log
    let eventFilter: any = { userId }
    if (userAccount?.instagramBusinessId) {
      const sharedAccounts = await prisma.connectedAccount.findMany({
        where: { instagramBusinessId: userAccount.instagramBusinessId },
        select: { id: true }
      })
      const accountIds = sharedAccounts.map(a => a.id)
      eventFilter = { accountId: { in: accountIds } }
    }

    const [events, total] = await Promise.all([
      prisma.automationEvent.findMany({
        where: eventFilter,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { connectedAccount: { select: { username: true } } }
      }),
      prisma.automationEvent.count({ where: eventFilter })
    ])

    const mappedEvents = events.map(event => {
      let incomingText = null
      let outgoingText = null
      try {
        const parsed = JSON.parse(event.payload || '{}')
        incomingText = parsed.incomingText
        outgoingText = parsed.outgoingText
      } catch (e) {}
      return {
        ...event,
        incomingText,
        outgoingText
      }
    })

    return {
      success: true,
      data: { events: mappedEvents, total, pages: Math.ceil(total / limit) }
    }
  } catch (e: any) {
    if (e.isAuthError) return { error: 'Unauthorized' }
    console.error('[getAutomationLog]', e)
    return { error: 'Failed to fetch automation log' }
  }
}

