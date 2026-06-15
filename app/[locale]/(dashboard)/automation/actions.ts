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
  autoCommentReply: boolean
  commentUseAi: boolean
  commentReplyTemplate: string
  commentAiPersonality: string
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
      dmAiPersonality: input.dmAiPersonality,
      autoCommentReply: input.autoCommentReply,
      commentMode: input.commentUseAi ? "AI" : "TEMPLATE",
      commentTemplate: input.commentReplyTemplate,
      commentAiPersonality: input.commentAiPersonality
    }

    await prisma.automationSettings.upsert({
      where: { accountId: input.connectedAccountId },
      create: { userId, ...data },
      update: data
    })

    if (!input.autoDmReply) {
      await prisma.automationEvent.deleteMany({
        where: { accountId: input.connectedAccountId, userId: userId, eventType: 'DM_REPLY' }
      })
    }
    if (!input.autoCommentReply) {
      await prisma.automationEvent.deleteMany({
        where: { accountId: input.connectedAccountId, userId: userId, eventType: 'COMMENT_REPLY' }
      })
    }

    revalidatePath('/automation')
    return { success: true }
  } catch (e: any) {
    if (e.isAuthError) return { error: 'Unauthorized' }
    console.error('[saveAutomationSettings]', e)
    return { error: 'Failed to save automation settings' }
  }
}

export async function getAutomationSettings(accountId: string): Promise<ActionResult<AutomationSettings | null>> {
  try {
    const userId = await requireAuth()
    const settings = await prisma.automationSettings.findUnique({
      where: { accountId }
    })
    return { success: true, data: settings }
  } catch (e: any) {
    if (e.isAuthError) return { error: 'Unauthorized' }
    console.error('[getAutomationSettings]', e)
    return { error: 'Failed to get automation settings' }
  }
}

export async function getAutomationLog(accountId: string, page: number = 1, limit: number = 20, includeDm: boolean = true, includeComment: boolean = true): Promise<ActionResult<{ events: any[], total: number, pages: number }>> {
  try {
    const userId = await requireAuth()
    const skip = (page - 1) * limit

    if (!includeDm && !includeComment) {
        return { success: true, data: { events: [], total: 0, pages: 1 } }
    }

    const eventTypes: string[] = []
    if (includeDm) eventTypes.push('DM_REPLY')
    if (includeComment) eventTypes.push('COMMENT_REPLY')

    const eventFilter: any = { accountId }
    if (eventTypes.length > 0) {
        eventFilter.eventType = { in: eventTypes }
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

