import { requirePageAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AutomationClient from './AutomationClient'

export const dynamic = 'force-dynamic'

export default async function AutomationPage() {
    const session = await requirePageAuth();
    const userId = session.user.id

    const [settings, connectedAccount] = await Promise.all([
        prisma.automationSettings.findUnique({ where: { userId } }),
        prisma.connectedAccount.findFirst({
            where: { userId },
            select: { id: true, username: true }
        })
    ])

    return <AutomationClient settings={settings as any} connectedAccount={connectedAccount as any} />
}
