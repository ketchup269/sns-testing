import { requirePageAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AutomationClient from './AutomationClient'

export const dynamic = 'force-dynamic'

export default async function AutomationPage() {
    const session = await requirePageAuth();
    const userId = session.user.id

    return <AutomationClient initialSettings={null} />
}
