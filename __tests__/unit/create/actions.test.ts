import { saveDraft, schedulePost, publishNow, getSignedUploadUrl, getProjectImageUploadUrl, registerProjectImages } from '@/app/(dashboard)/create/actions'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth.utils'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        post: { create: jest.fn() },
        schedule: { create: jest.fn() },
        connectedAccount: { findUnique: jest.fn() },
        project: { findUnique: jest.fn() },
        projectImage: { createMany: jest.fn(), delete: jest.fn() },
    }
}))

jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        storage: {
            from: jest.fn().mockReturnThis(),
            createSignedUploadUrl: jest.fn(),
            getPublicUrl: jest.fn(),
        }
    }
}))

jest.mock('@/lib/auth.utils')
jest.mock('next/cache')

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>


const mockPrismaPostCreate = prisma.post.create as jest.Mock
const mockPrismaScheduleCreate = prisma.schedule.create as jest.Mock
const mockPrismaConnectedAccountFindUnique = prisma.connectedAccount.findUnique as jest.Mock
const mockPrismaProjectFindUnique = prisma.project.findUnique as jest.Mock
const mockPrismaProjectImageCreateMany = prisma.projectImage.createMany as jest.Mock
const mockPrismaProjectImageDelete = prisma.projectImage.delete as jest.Mock

const mockSupabaseStorageCreateSignedUploadUrl = supabaseAdmin.storage.from('').createSignedUploadUrl as jest.Mock
const mockSupabaseStorageGetPublicUrl = supabaseAdmin.storage.from('').getPublicUrl as jest.Mock

global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

function makeFormData(overrides: Record<string, string | string[]> = {}): FormData {
    const fd = new FormData()
    const defaults = {
        caption: 'Test caption',
        connectedAccountId: 'account-1',
        mediaUrl: 'https://cdn.example.com/image.jpg',
        isVideo: 'false',
        scheduledFor: '2025-06-20T12:00:00Z',
    }
    const merged = { ...defaults, ...overrides }
    for (const [key, value] of Object.entries(merged)) {
        if (Array.isArray(value)) {
            fd.delete(key)
            value.forEach(v => fd.append(key, v))
        } else {
            fd.set(key, value)
        }
    }
    return fd
}

describe('Create Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2025-06-15T12:00:00Z').getTime())
        mockRequireAuth.mockResolvedValue('user-1')
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('saveDraft', () => {
        it('should return success and create post with single image correctly', async () => {
            const formData = makeFormData()
            mockPrismaPostCreate.mockResolvedValue({ id: 'post-1' })

            const result = await saveDraft(formData)

            expect(result).toEqual({ success: true, data: { postId: 'post-1' } })
            expect(mockPrismaPostCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    imageUrl: 'https://cdn.example.com/image.jpg',
                    mediaType: 'IMAGE'
                })
            }))
            expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
            expect(mockRevalidatePath).toHaveBeenCalledWith('/workflow')
        })

        it('should return success and create post with JSON array imageUrl when multiple mediaUrls provided', async () => {
            const formData = makeFormData({ 'mediaUrls[]': ['url1', 'url2', 'url3'] })
            mockPrismaPostCreate.mockResolvedValue({ id: 'post-1' })

            await saveDraft(formData)

            expect(mockPrismaPostCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    imageUrl: '["url1","url2","url3"]'
                })
            }))
        })

        it('should return error if connectedAccountId is missing', async () => {
            const formData = makeFormData({ connectedAccountId: '' })
            const result = await saveDraft(formData)
            expect(result).toEqual({ error: 'Please select an Instagram account first.' })
        })

        it('should consume the library image when libraryImageId is provided', async () => {
            const formData = makeFormData({ libraryImageId: 'lib-1' })
            mockPrismaPostCreate.mockResolvedValue({ id: 'post-1' })

            await saveDraft(formData)

            expect(mockPrismaProjectImageDelete).toHaveBeenCalledWith({ where: { id: 'lib-1' } })
        })

        it('should NOT attempt library image deletion when libraryImageId is NOT provided', async () => {
            mockPrismaPostCreate.mockResolvedValue({ id: 'post-1' })
            await saveDraft(makeFormData())
            expect(mockPrismaProjectImageDelete).not.toHaveBeenCalled()
        })

        it('should return error when unauthenticated', async () => {
            mockRequireAuth.mockRejectedValue({ isAuthError: true })
            const result = await saveDraft(makeFormData())
            expect(result).toEqual({ error: 'Unauthorized' })
        })
    })

    describe('schedulePost', () => {
        it('should return success and save with PENDING schedule when scheduled for future time', async () => {
            const tomorrow = new Date('2025-06-16T12:00:00Z').toISOString()
            const formData = makeFormData({ scheduledFor: tomorrow })
            mockPrismaPostCreate.mockResolvedValue({ id: 'post-1' })

            const result = await schedulePost(formData)

            expect(result).toEqual({ success: true, data: { postId: 'post-1' } })
            expect(mockPrismaScheduleCreate).toHaveBeenCalledWith({
                data: { postId: 'post-1', scheduledFor: new Date(tomorrow), status: 'PENDING' }
            })
        })

        it('should return error when scheduled time is in the past', async () => {
            const yesterday = new Date('2025-06-14T12:00:00Z').toISOString()
            const result = await schedulePost(makeFormData({ scheduledFor: yesterday }))
            expect(result).toEqual({ error: 'Scheduled time must be in the future.' })
        })

        it('should return error when scheduled time is current time', async () => {
            const now = new Date('2025-06-15T12:00:00Z').toISOString()
            const result = await schedulePost(makeFormData({ scheduledFor: now }))
            expect(result).toEqual({ error: 'Scheduled time must be in the future.' })
        })

        it('should return error when scheduledFor is missing', async () => {
            const result = await schedulePost(makeFormData({ scheduledFor: '' }))
            expect(result).toEqual({ error: 'Please select a date and time to schedule this post.' })
        })

        it('should return error when mediaUrl is missing', async () => {
            const formData = makeFormData()
            formData.delete('mediaUrl')
            const result = await schedulePost(formData)
            expect(result).toEqual({ error: 'Please upload an image or video to schedule a post.' })
        })

        it('should store imageUrl as JSON array when multiple mediaUrls provided', async () => {
            mockPrismaPostCreate.mockResolvedValue({ id: 'p-1' })
            const formData = makeFormData({ 'mediaUrls[]': ['a', 'b', 'c'] })
            await schedulePost(formData)
            expect(mockPrismaPostCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ imageUrl: '["a","b","c"]' })
            }))
        })
    })

    describe('publishNow', () => {
        const setupIgSuccess = () => {
            mockPrismaConnectedAccountFindUnique.mockResolvedValue({
                instagramBusinessId: 'ig-123',
                pageAccessToken: 'token-abc'
            })
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1' }) } as any) // create
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'FINISHED' }) } as any) // poll
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'ig-media-1' }) } as any) // publish
            mockPrismaPostCreate.mockResolvedValue({ id: 'post-1' })
        }

        it('should return success and publish single image correctly', async () => {
            setupIgSuccess()
            const promise = publishNow(makeFormData())
            await jest.runAllTimersAsync()
            const result = await promise

            expect(result).toEqual({ success: true, data: { postId: 'post-1' } })
            expect(mockPrismaPostCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ instagramMediaId: 'ig-media-1' })
            }))
            expect(mockPrismaScheduleCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ status: 'PUBLISHED' })
            }))
        })

        it('should return success after container polling FINISHED on second poll', async () => {
            mockPrismaConnectedAccountFindUnique.mockResolvedValue({
                instagramBusinessId: 'ig-123',
                pageAccessToken: 'token-abc'
            })
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'IN_PROGRESS' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'FINISHED' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'ig-media-1' }) } as any)
            mockPrismaPostCreate.mockResolvedValue({ id: 'post-1' })

            const promise = publishNow(makeFormData())
            await jest.runAllTimersAsync()
            const result = await promise
            expect(result.success).toBe(true)
            expect(mockFetch).toHaveBeenCalledTimes(4)
        })

        it('should return error when poll returns ERROR status', async () => {
            mockPrismaConnectedAccountFindUnique.mockResolvedValue({ instagramBusinessId: 'ig-123', pageAccessToken: 'token-abc' })
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'ERROR' }) } as any)

            const promise = publishNow(makeFormData())
            await jest.runAllTimersAsync()
            const result = await promise
            expect(result.error).toMatch(/IG Container Error|Instagram is taking too long to process your image/)
        })

        it('should return error when container timeout occurs', async () => {
            mockPrismaConnectedAccountFindUnique.mockResolvedValue({ instagramBusinessId: 'ig-123', pageAccessToken: 'token-abc' })
            mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status_code: 'IN_PROGRESS' }) } as any)

            const promise = publishNow(makeFormData())
            await jest.runAllTimersAsync()
            const result = await promise
            expect(result.error).toMatch(/too long to process/)
        })

        it('should retry up to 3 times and succeed if publish fails with subcode 2207027', async () => {
            mockPrismaConnectedAccountFindUnique.mockResolvedValue({ instagramBusinessId: 'ig-123', pageAccessToken: 'token-abc' })
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1' }) } as any) // create
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'FINISHED' }) } as any) // poll
            // attempts
            mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { error_subcode: 2207027, message: 'not ready' } }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { error_subcode: 2207027, message: 'not ready' } }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'ig-media-1' }) } as any)
            mockPrismaPostCreate.mockResolvedValue({ id: 'post-1' })

            const promise = publishNow(makeFormData())
            await jest.runAllTimersAsync()
            const result = await promise
            expect(result.success).toBe(true)
            expect(mockFetch).toHaveBeenCalledTimes(5)
        })

        it('should return error after 1 attempt when publish fails with non-retryable error', async () => {
            mockPrismaConnectedAccountFindUnique.mockResolvedValue({ instagramBusinessId: 'ig-123', pageAccessToken: 'token-abc' })
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'container-1' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'FINISHED' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: { message: 'hard fail' } }) } as any)

            const promise = publishNow(makeFormData())
            await jest.runAllTimersAsync()
            const result = await promise
            expect(result.error).toMatch(/IG Publish Error/)
            expect(mockFetch).toHaveBeenCalledTimes(3)
        })

        it('should publish carousel with correct metadata when 3 images provided', async () => {
            mockPrismaConnectedAccountFindUnique.mockResolvedValue({ instagramBusinessId: 'ig-123', pageAccessToken: 'token-abc' })
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'child-1' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'child-2' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'child-3' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'carousel-1' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'FINISHED' }) } as any)
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'ig-media-carousel' }) } as any)
            mockPrismaPostCreate.mockResolvedValue({ id: 'post-1' })

            const formData = makeFormData({ 'mediaUrls[]': ['u1', 'u2', 'u3'] })
            const promise = publishNow(formData)
            await jest.runAllTimersAsync()
            const result = await promise

            expect(result.success).toBe(true)
            expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                body: expect.stringContaining('"is_carousel_item":true')
            }))
            expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
                body: expect.stringContaining('"media_type":"CAROUSEL"')
            }))
            expect(mockPrismaPostCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ imageUrl: '["u1","u2","u3"]' })
            }))
        })

        it('should return error if connectedAccountId is missing', async () => {
            const formData = makeFormData({ connectedAccountId: '' })
            const promise = publishNow(formData)
            await jest.runAllTimersAsync()
            const result = await promise
            expect(result).toEqual({ error: 'Please select an Instagram account first.' })
        })

        it('should return error if mediaUrl is missing', async () => {
            const formData = makeFormData()
            formData.delete('mediaUrl')
            const promise = publishNow(formData)
            await jest.runAllTimersAsync()
            const result = await promise
            expect(result).toEqual({ error: 'Please upload an image or video.' })
        })

        it('should return error if account not found in DB', async () => {
            mockPrismaConnectedAccountFindUnique.mockResolvedValue(null)
            const promise = publishNow(makeFormData())
            await jest.runAllTimersAsync()
            const result = await promise
            expect(result).toEqual({ error: 'Instagram account not properly configured.' })
        })

        it('should return error when unauthenticated', async () => {
            mockRequireAuth.mockRejectedValue({ isAuthError: true })
            const promise = publishNow(makeFormData())
            await jest.runAllTimersAsync()
            const result = await promise
            expect(result).toEqual({ error: 'Unauthorized' })
        })
    })

    describe('getSignedUploadUrl', () => {
        it('should return signedUrl, token, and path on success', async () => {
            const mockData = { signedUrl: 'https://url', token: 'tok', path: 'path' }
            mockSupabaseStorageCreateSignedUploadUrl.mockResolvedValue({ data: mockData, error: null })

            const result = await getSignedUploadUrl('file.jpg', 'image/jpeg')
            expect(result).toEqual(mockData)
        })

        it('should return error when Supabase createSignedUploadUrl fails', async () => {
            mockSupabaseStorageCreateSignedUploadUrl.mockResolvedValue({ data: null, error: { message: 'Quota exceeded' } })
            const result = await getSignedUploadUrl('file.jpg', 'image/jpeg')
            expect(result).toEqual({ error: 'Quota exceeded' })
        })

        it('should return error when unauthenticated', async () => {
            mockRequireAuth.mockRejectedValue({ isAuthError: true })
            const result = await getSignedUploadUrl('f.jpg', 'i/j')
            expect(result.error).toBeDefined()
        })
    })

    describe('getProjectImageUploadUrl', () => {
        it('should return 5 fields including storagePath and publicUrl when user owns project', async () => {
            mockPrismaProjectFindUnique.mockResolvedValue({ id: 'proj-1' })
            mockSupabaseStorageCreateSignedUploadUrl.mockResolvedValue({ data: { signedUrl: 's', token: 't', path: 'p' }, error: null })
            mockSupabaseStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'pub' } })

            const result = await getProjectImageUploadUrl('proj-1', 'img.jpg')

            expect(result).toEqual(expect.objectContaining({
                signedUrl: 's',
                token: 't',
                path: 'p',
                storagePath: expect.stringContaining('projects/proj-1/'),
                publicUrl: 'pub'
            }))
        })

        it('should return error when project is non-existent or belongs to another user', async () => {
            mockPrismaProjectFindUnique.mockResolvedValue(null)
            const result = await getProjectImageUploadUrl('proj-1', 'img.jpg')
            expect(result).toEqual({ error: 'Project not found' })
        })
    })

    describe('registerProjectImages', () => {
        it('should insert correct number of rows with valid userId', async () => {
            mockPrismaProjectImageCreateMany.mockResolvedValue({ count: 3 })
            const images = [{ url: 'u', storagePath: 's', fileName: 'f' }, { url: 'u2', storagePath: 's2', fileName: 'f2' }]
            const result = await registerProjectImages('proj-1', images as any)

            expect(result).toEqual({ count: 3 })
            expect(mockPrismaProjectImageCreateMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({ userId: 'user-1', projectId: 'proj-1' })
                ])
            })
        })

        it('should return error when unauthenticated', async () => {
            mockRequireAuth.mockRejectedValue({ isAuthError: true })
            const result = await registerProjectImages('p1', [])
            expect(result.error).toBeDefined()
        })
    })
})
