import { requirePageAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import CreateContentClient from './CreateContentClient'

export const dynamic = 'force-dynamic'

export default async function CreateContentPage() {
    const session = await requirePageAuth();
    const userId = session.user.id

    const [user, accounts, projects] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { aiUsageOption: true }
        }),
        prisma.connectedAccount.findMany({
            where: { userId: userId },
            select: {
                id: true,
                username: true,
                pageId: true,
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.project.findMany({
            where: { userId: userId },
            orderBy: { updatedAt: 'desc' }
        })
    ])

    return <CreateContentClient accounts={accounts} aiUsageOption={user?.aiUsageOption} projects={projects as any} />
}
