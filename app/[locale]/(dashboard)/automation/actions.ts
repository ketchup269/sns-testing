'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth.utils'
import { ActionResult } from '@/lib/types'
import { AutomationSettings, AutomationEvent } from '@prisma/client'

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

    await prisma.automationSettings.upsert({
      where: { userId },
      create: { userId, ...input },
      update: { ...input }
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

    const [events, total] = await Promise.all([
      prisma.automationEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { connectedAccount: { select: { username: true } } }
      }),
      prisma.automationEvent.count({ where: { userId } })
    ])

    return {
      success: true,
      data: { events, total, pages: Math.ceil(total / limit) }
    }
  } catch (e: any) {
    if (e.isAuthError) return { error: 'Unauthorized' }
    console.error('[getAutomationLog]', e)
    return { error: 'Failed to fetch automation log' }
  }
}
