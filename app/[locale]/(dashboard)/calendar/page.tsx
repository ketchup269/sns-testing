import { requirePageAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import CalendarClient from './CalendarClient'

export const dynamic = 'force-dynamic'

export default async function CalendarPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await requirePageAuth();
    const userId = session.user.id

    const params = await searchParams;
    const weekParam = typeof params?.week === 'string' ? parseInt(params.week, 10) : 0;
    const weekOffset = isNaN(weekParam) ? 0 : weekParam;

    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    // Fetch schedules for the specific week
    const schedules = await prisma.schedule.findMany({
        where: {
            post: { userId: userId },
            scheduledFor: { gte: monday, lte: sunday }
        },
        include: {
            post: {
                include: {
                    connectedAccount: {
                        select: { username: true }
                    }
                }
            }
        },
        orderBy: { scheduledFor: 'asc' }
    })

    // Serialize dates to strings for client component
    const serializedSchedules = schedules.map(s => ({
        id: s.id,
        scheduledFor: s.scheduledFor.toISOString(),
        status: s.status,
        post: {
            id: s.post.id,
            caption: s.post.caption,
            imageUrl: s.post.imageUrl,
            connectedAccount: {
                username: s.post.connectedAccount?.username ?? null
            }
        }
    }))

    return <CalendarClient schedules={serializedSchedules} weekOffset={weekOffset} />
}
