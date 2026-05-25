import { requirePageAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import { ChartDataPoint } from '@/lib/types'
import AnalyticsClient from './AnalyticsClient'

export const dynamic = 'force-dynamic'

/* @testable */
export function get30DayActivityData(posts: { createdAt: Date; schedules: { status: string }[] }[]): ChartDataPoint[] {
    const data: ChartDataPoint[] = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    for (let i = 29; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dayPosts = posts.filter(p => {
            const pd = new Date(p.createdAt)
            pd.setHours(0, 0, 0, 0)
            return pd.getTime() === d.getTime()
        })
        const count = dayPosts.length
        const publishedCount = dayPosts.filter(p => p.schedules.some(s => s.status === 'PUBLISHED')).length
        data.push({ label: (i % 6 === 0) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '', count, publishedCount, height: 0, pubHeight: 0 })
    }

    const maxCount = Math.max(...data.map(d => d.count), 1)
    return data.map(d => ({
        ...d,
        height: Math.max(2, (d.count / maxCount) * 100),
        pubHeight: Math.max(0, (d.publishedCount / maxCount) * 100),
    }))
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage(props: { searchParams: Promise<{ projectId?: string }> }) {
    const searchParams = await props.searchParams
    const projectId = searchParams.projectId
    
    const session = await requirePageAuth();
    const userId = session.user.id

    const baseWhere = { userId: userId, ...(projectId ? { projectId } : {}) }

    const [postsCount, publishedCount, pendingCount, accountsCount, topPosts, bottomPosts, activityPosts, projects] = await Promise.all([
        prisma.post.count({ where: baseWhere }),
        prisma.schedule.count({ where: { post: baseWhere, status: 'PUBLISHED' } }),
        prisma.schedule.count({ where: { post: baseWhere, status: 'PENDING' } }),
        prisma.connectedAccount.count({ where: { userId: userId } }),
        prisma.post.findMany({
            where: { ...baseWhere, schedules: { some: { status: 'PUBLISHED' } } },
            include: { schedules: { orderBy: { createdAt: 'desc' }, take: 1 }, connectedAccount: { select: { username: true } } },
            orderBy: [{ likes: 'desc' }, { views: 'desc' }],
            take: 4,
        }),
        prisma.post.findMany({
            where: { ...baseWhere, schedules: { some: { status: 'PUBLISHED' } } },
            include: { schedules: { orderBy: { createdAt: 'desc' }, take: 1 }, connectedAccount: { select: { username: true } } },
            orderBy: [{ likes: 'asc' }, { views: 'asc' }],
            take: 4,
        }),
        prisma.post.findMany({
            where: { ...baseWhere, createdAt: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } },
            select: { createdAt: true, schedules: { select: { status: true } } },
        }),
        prisma.project.findMany({
            where: { userId: userId },
            select: { id: true, name: true }
        })
    ])

    const chartData = get30DayActivityData(activityPosts)

    return (
        <AnalyticsClient
            postsCount={postsCount}
            publishedCount={publishedCount}
            pendingCount={pendingCount}
            accountsCount={accountsCount}
            chartData={chartData}
            topPosts={topPosts}
            bottomPosts={bottomPosts}
            projects={projects}
            selectedProjectId={projectId || ''}
        />
    )
}
