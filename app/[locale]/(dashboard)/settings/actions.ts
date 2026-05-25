'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth.utils'
import { ActionResult } from '@/lib/types'

export async function updateAiUsageOption(option: string): Promise<ActionResult> {
    try {
        const userId = await requireAuth()

        await prisma.user.update({
            where: { id: userId },
            data: { aiUsageOption: option }
        })
        revalidatePath('/settings')
        return { success: true }
    } catch (e: any) {
        if (e.isAuthError) return { error: 'Not authenticated' }
        console.error('[updateAiUsageOption]', e)
        return { error: 'Failed to update AI setting' }
    }
}
