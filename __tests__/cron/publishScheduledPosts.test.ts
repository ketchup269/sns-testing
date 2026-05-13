import { POST } from '@/app/api/cron/route'
import { prisma } from '@/lib/prisma'
import { facebookService } from '@/lib/services/facebook.service'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        schedule: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
        post: { findMany: jest.fn(), update: jest.fn() }
    }
}))

jest.mock('@/lib/services/facebook.service', () => ({
    facebookService: { getMediaInsights: jest.fn() }
}))

global.fetch = jest.fn()
const mockFetch = fetch as jest.Mock

describe('Cron Job: publishScheduledPosts', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        process.env.NODE_ENV = 'test'
    })

    it('should process pending schedules and sync insights successfully', async () => {
        const mockSchedule = {
            id: 'sched-1',
            post: {
                id: 'post-1',
                imageUrl: 'http://img',
                caption: 'Caption',
                mediaType: 'IMAGE',
                connectedAccount: {
                    instagramBusinessId: 'ig-123',
                    pageAccessToken: 'token-abc'
                }
            }
        }
        ;(prisma.schedule.findMany as jest.Mock).mockResolvedValue([{ id: 'sched-1' }])
        ;(prisma.schedule.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
        ;(prisma.schedule.findUnique as jest.Mock).mockResolvedValue(mockSchedule)

        // Step 1: Create Container Success
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'cont-1' }) })
        // Step 2: Poll Container Success (FINISHED)
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'FINISHED' }) })
        // Step 3: Publish Media Success
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'media-1' }) })

        // Insights sync part
        ;(prisma.post.findMany as jest.Mock).mockResolvedValue([{
            id: 'post-sync',
            instagramMediaId: 'media-sync',
            connectedAccount: { pageAccessToken: 'tok' }
        }])
        ;(facebookService.getMediaInsights as jest.Mock).mockResolvedValue({ views: 10, reach: 5, saves: 2, likes: 1 })

        const res = await POST(new Request('http://localhost'))
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.publishedResults[0].success).toBe(true)
        expect(prisma.schedule.update).toHaveBeenCalledWith({
            where: { id: 'sched-1' },
            data: { status: 'PUBLISHED' }
        })
        expect(prisma.post.update).toHaveBeenCalledWith({
            where: { id: 'post-sync' },
            data: { views: 10, reach: 5, saves: 2, likes: 1 }
        })
    })

    it('should mark schedule as FAILED if IG container creation fails', async () => {
        ;(prisma.schedule.findMany as jest.Mock).mockResolvedValue([{ id: 'sched-1' }])
        ;(prisma.schedule.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
        ;(prisma.schedule.findUnique as jest.Mock).mockResolvedValue({
            id: 'sched-1',
            post: { 
                connectedAccount: { 
                    instagramBusinessId: 'ig', 
                    pageAccessToken: 'tok' 
                },
                mediaType: 'IMAGE'
            }
        })

        mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { message: 'Creation failed' } }) })

        const res = await POST(new Request('http://localhost'))
        const json = await res.json()

        expect(json.publishedResults[0].success).toBe(false)
        expect(json.publishedResults[0].error).toBe('IG Container Error: Creation failed')
        expect(prisma.schedule.update).toHaveBeenCalledWith({
            where: { id: 'sched-1' },
            data: { status: 'FAILED' }
        })
    })

    it('should handle container polling timeout and mark as FAILED', async () => {
        ;(prisma.schedule.findMany as jest.Mock).mockResolvedValue([{ id: 'sched-1' }])
        ;(prisma.schedule.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
        ;(prisma.schedule.findUnique as jest.Mock).mockResolvedValue({
            id: 'sched-1',
            post: { 
                connectedAccount: { instagramBusinessId: 'ig', pageAccessToken: 'tok' },
                mediaType: 'IMAGE'
            }
        })

        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'cont-1' }) })
        // Always return IN_PROGRESS
        mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status_code: 'IN_PROGRESS' }) })

        const res = await POST(new Request('http://localhost'))
        const json = await res.json()

        expect(json.publishedResults[0].success).toBe(false)
        expect(json.publishedResults[0].error).toMatch(/Timed out waiting/)
        expect(prisma.schedule.update).toHaveBeenCalledWith({
            where: { id: 'sched-1' },
            data: { status: 'FAILED' }
        })
    })
})
