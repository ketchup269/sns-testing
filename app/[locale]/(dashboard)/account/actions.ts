'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth.utils'
import { AccountService } from '@/lib/services/account.service'
import { ActionResult } from '@/lib/types'

export async function disconnectAccount(accountId: string): Promise<ActionResult> {
    try {
        const userId = await requireAuth()

        if (!accountId) {
            return { error: 'Account ID is required' }
        }

        // Delegate to Service
        await AccountService.disconnectAccount(userId, accountId)

        revalidatePath('/account')
        revalidatePath('/dashboard')
        
        return { success: true }
    } catch (error: any) {
        if (error.isAuthError) return { error: 'Unauthorized' }
        console.error('[Action: disconnectAccount] Error:', error)
        return { error: error.message || 'An unexpected error occurred' }
    }
}
