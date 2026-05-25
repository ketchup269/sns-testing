import { requirePageAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import { ScheduleStatus } from '@/lib/prisma-client/client'
import { facebookService } from '@/lib/services/facebook.service'
import WorkflowClient from './WorkflowClient'

export const dynamic = 'force-dynamic'

const LIMIT = 8

type StatusKey = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'FAILED'

const STATUS_PAGE_PARAMS: Record<StatusKey, string> = {
    DRAFT:     'draft_page',
    PENDING:   'pending_page',
    PUBLISHED: 'published_page',
    FAILED:    'failed_page',
}

interface Post {
    id: string
    caption: string | null
    imageUrl: string
    mediaType: string
    createdAt: Date
    instagramMediaId: string | null
    connectedAccount: { username: string | null; pageAccessToken: string | null } | null
    schedules: { status: string; scheduledFor: Date }[]
    likes: number
    views: number
    reach: number
    saves: number
}

function parsePage(value: string | string[] | undefined): number {
    const n = parseInt(typeof value === 'string' ? value : '1', 10)
    return Math.max(1, isNaN(n) ? 1 : n)
}

function getPostStatus(post: Post): string {
    return post.schedules[0]?.status ?? 'DRAFT'
}

export default async function WorkflowPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await requirePageAuth()
    const userId = session.user.id

    const params = await searchParams

    // Resolve the current page for each column independently
    const pages: Record<StatusKey, number> = {
        DRAFT:     parsePage(params[STATUS_PAGE_PARAMS.DRAFT]),
        PENDING:   parsePage(params[STATUS_PAGE_PARAMS.PENDING]),
        PUBLISHED: parsePage(params[STATUS_PAGE_PARAMS.PUBLISHED]),
        FAILED:    parsePage(params[STATUS_PAGE_PARAMS.FAILED]),
    }

    // Query each column in parallel: count + paginated posts
    const statusKeys = Object.keys(pages) as StatusKey[]

    const columnResults = await Promise.all(
        statusKeys.map(async (status) => {
            const page = pages[status]
            const skip = (page - 1) * LIMIT

            // DRAFT = posts with no schedule rows (DRAFT is a UI concept, not in ScheduleStatus enum)
            // All other statuses use the Prisma ScheduleStatus enum
            const whereClause =
                status === 'DRAFT'
                    ? {
                          userId,
                          schedules: { none: {} },
                      }
                    : {
                          userId,
                          schedules: { some: { status: ScheduleStatus[status] } },
                      }

            const [totalCount, posts] = await Promise.all([
                prisma.post.count({ where: whereClause }),
                prisma.post.findMany({
                    where: whereClause,
                    include: {
                        schedules: { orderBy: { createdAt: 'desc' }, take: 1 },
                        connectedAccount: { select: { username: true, pageAccessToken: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: LIMIT,
                }),
            ])

            return {
                status,
                data: {
                    posts: posts as Post[],
                    currentPage: page,
                    totalPages: Math.max(1, Math.ceil(totalCount / LIMIT)),
                    totalCount,
                },
            }
        })
    )

    const columns = Object.fromEntries(
        columnResults.map(({ status, data }) => [status, data])
    ) as Record<StatusKey, typeof columnResults[0]['data']>

    // Enrich recently-published posts with live Instagram insights
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const toSync = columns.PUBLISHED.posts.filter(
        (p) =>
            p.instagramMediaId &&
            !p.instagramMediaId.startsWith('test_') &&
            p.connectedAccount?.pageAccessToken &&
            p.schedules[0] &&
            new Date(p.schedules[0].scheduledFor) > sevenDaysAgo
    )

    const insightsPromise = (async () => {
        const results: Record<string, { likes: number; views: number }> = {}
        if (toSync.length > 0) {
            await Promise.all(
                toSync.map(async (p) => {
                    try {
                        const insights = await facebookService.getMediaInsights(
                            p.instagramMediaId!,
                            p.connectedAccount!.pageAccessToken!
                        )
                        if (insights) {
                            results[p.id] = { likes: insights.likes, views: insights.views }
                            prisma.post
                                .update({
                                    where: { id: p.id },
                                    data: {
                                        likes: insights.likes,
                                        views: insights.views,
                                        reach: insights.reach,
                                        saves: insights.saves,
                                    },
                                })
                                .catch(() => {})
                        }
                    } catch {
                        // Silently ignore — don't block render
                    }
                })
            )
        }
        return results
    })()

    return <WorkflowClient columns={columns} insightsPromise={insightsPromise} />
}