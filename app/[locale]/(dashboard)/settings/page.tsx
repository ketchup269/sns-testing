import { requirePageAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const session = await requirePageAuth();
    const userId = session.user.id

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { aiUsageOption: true, name: true, email: true }
    })

    if (!user) redirect('/signin')

    return <SettingsClient user={user as any} />
}
