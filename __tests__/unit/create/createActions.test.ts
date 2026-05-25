import { saveDraft, publishNow, schedulePost, getSignedUploadUrl, getProjectImageUploadUrl, registerProjectImages } from '@/app/[locale]/(dashboard)/create/actions'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth.utils'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user:             { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    post:             { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
    schedule:         { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
    connectedAccount: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    project:          { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    projectImage:     { findUnique: jest.fn(), findMany: jest.fn(), createMany: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
  }
}))

jest.mock('@/lib/auth.utils')
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: jest.fn().mockReturnValue({
        createSignedUploadUrl: jest.fn(),
        uploadToSignedUrl:     jest.fn(),
        getPublicUrl:          jest.fn(),
        remove:                jest.fn(),
      })
    }
  }
}))

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

global.fetch = jest.fn()
const mockFetch = fetch as jest.Mock

function fd(fields: Record<string, string | string[]> = {}): FormData {
  const f = new FormData()
  const defaults = {
    caption:            'Test caption',
    connectedAccountId: 'acc-1',
    mediaUrl:           'https://cdn.test/img.jpg',
    isVideo:            'false',
  }
  Object.entries({ ...defaults, ...fields }).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(val => f.append(k, val))
    else f.set(k, String(v))
  })
  return f
}

function mockAccount() {
  ;(prisma.connectedAccount.findUnique as jest.Mock).mockResolvedValue({
    instagramBusinessId: 'ig-123',
    pageAccessToken:     'token-abc',
  })
}

function mockIgSuccess() {
  mockFetch
    .mockResolvedValueOnce({ ok: true,  json: async () => ({ id: 'cont-1' }) })
    .mockResolvedValueOnce({ ok: true,  json: async () => ({ status_code: 'FINISHED' }) })
    .mockResolvedValueOnce({ ok: true,  json: async () => ({ id: 'ig-media-1' }) })
}

describe('saveDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return success and postId when single image is provided', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'post-1' })

    const result = await saveDraft(fd())

    expect(result).toEqual({ success: true, data: { postId: 'post-1' } })
    expect(prisma.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ imageUrl: 'https://cdn.test/img.jpg' })
    }))
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
    expect(revalidatePath).toHaveBeenCalledWith('/workflow')
  })

  it('should store imageUrl as JSON array when multiple mediaUrls provided', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'post-1' })

    await saveDraft(fd({ 'mediaUrls[]': ['u1', 'u2', 'u3'] }))

    expect(prisma.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ imageUrl: '["u1","u2","u3"]' })
    }))
  })

  it('should return error when connectedAccountId is missing', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    const result = await saveDraft(fd({ connectedAccountId: '' }))

    expect(result).toEqual({ error: 'Please select an Instagram account first.' })
    expect(prisma.post.create).not.toHaveBeenCalled()
  })

  it('should call projectImage.delete when libraryImageId is present', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'post-1' })
    ;(prisma.projectImage.delete as jest.Mock).mockResolvedValue({})

    await saveDraft(fd({ libraryImageId: 'lib-1' }))

    expect(prisma.projectImage.delete).toHaveBeenCalledWith({ where: { id: 'lib-1' } })
  })

  it('should not call projectImage.delete when libraryImageId is missing', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'post-1' })

    await saveDraft(fd({ libraryImageId: '' }))

    expect(prisma.projectImage.delete).not.toHaveBeenCalled()
  })

  it('should return error when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(Object.assign(new Error('Unauthorized'), { isAuthError: true }))

    const result = await saveDraft(fd())

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(prisma.post.create).not.toHaveBeenCalled()
  })
})

describe('schedulePost', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-06-15T12:00:00Z').getTime())
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should create post and PENDING schedule when future scheduledFor is provided', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'post-1' })
    ;(prisma.schedule.create as jest.Mock).mockResolvedValue({})

    const result = await schedulePost(fd({ scheduledFor: '2025-06-16T10:00:00Z' }))

    expect(result).toEqual({ success: true, data: { postId: 'post-1' } })
    expect(prisma.schedule.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'PENDING',
        scheduledFor: new Date('2025-06-16T10:00:00Z')
      })
    }))
  })

  it('should return error when past scheduledFor is provided', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')

    const result = await schedulePost(fd({ scheduledFor: '2025-06-14T10:00:00Z' }))

    expect(result).toEqual({ error: 'Scheduled time must be in the future.' })
    expect(prisma.post.create).not.toHaveBeenCalled()
  })

  it('should return error when scheduledFor is equal to now', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')

    const result = await schedulePost(fd({ scheduledFor: '2025-06-15T12:00:00Z' }))

    expect(result).toEqual({ error: 'Scheduled time must be in the future.' })
  })

  it('should return error when scheduledFor is missing', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    const f = fd()
    f.delete('scheduledFor')

    const result = await schedulePost(f)

    expect(result).toEqual({ error: 'Please select a date and time to schedule this post.' })
  })

  it('should return error when mediaUrl is missing', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    const f = fd({ scheduledFor: '2025-06-16T10:00:00Z' })
    f.delete('mediaUrl')

    const result = await schedulePost(f)

    expect(result).toEqual({ error: 'Please upload an image or video to schedule a post.' })
  })

  it('should return error when connectedAccountId is missing', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')

    const result = await schedulePost(fd({ connectedAccountId: '', scheduledFor: '2025-06-16T10:00:00Z' }))

    expect(result).toEqual({ error: 'Please select an Instagram account first.' })
  })

  it('should store imageUrl as JSON array when multiple mediaUrls provided', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'post-1' })

    await schedulePost(fd({ 'mediaUrls[]': ['u1', 'u2'], scheduledFor: '2025-06-16T10:00:00.000Z' }))

    expect(prisma.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ imageUrl: '["u1","u2"]' })
    }))
  })

  it('should return error when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(Object.assign(new Error('Unauthorized'), { isAuthError: true }))

    const result = await schedulePost(fd({ scheduledFor: '2025-06-16T10:00:00Z' }))

    expect(result).toEqual({ error: 'Unauthorized' })
  })
})

describe('publishNow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('should return success and postId when single image is published', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    mockAccount()
    mockIgSuccess()
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'post-1' })
    ;(prisma.schedule.create as jest.Mock).mockResolvedValue({})

    const promise = publishNow(fd())
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toEqual({ success: true, data: { postId: 'post-1' } })
    expect(prisma.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ instagramMediaId: 'ig-media-1' })
    }))
    expect(prisma.schedule.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'PUBLISHED' })
    }))
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
    expect(revalidatePath).toHaveBeenCalledWith('/workflow')
  })

  it('should return success when container polls FINISHED on second attempt', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    mockAccount()
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'cont-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'IN_PROGRESS' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'FINISHED' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'ig-media-1' }) })
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'post-1' })

    const promise = publishNow(fd())
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toEqual({ success: true, data: { postId: 'post-1' } })
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })

  it('should return error when container ERROR status is returned', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    mockAccount()
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'cont-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'ERROR' }) })

    const promise = publishNow(fd())
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result.error).toMatch(/IG Container Error|Container|too long/i)
    expect(prisma.schedule.create).not.toHaveBeenCalled()
  })

  it('should return error when container timeout occurs', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    mockAccount()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status_code: 'IN_PROGRESS' }) })

    const promise = publishNow(fd())
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result.error).toMatch(/too long/i)
    expect(prisma.schedule.create).not.toHaveBeenCalled()
  })

  it('should retry publish and succeed when fails with subcode 2207027', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    mockAccount()
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'cont-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'FINISHED' }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: { error_subcode: 2207027, message: 'not ready' } }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: { error_subcode: 2207027, message: 'not ready' } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'ig-media-1' }) })
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'post-1' })

    const promise = publishNow(fd())
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toEqual({ success: true, data: { postId: 'post-1' } })
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  it('should return error immediately when publish fails with non-retryable error', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    mockAccount()
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'cont-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'FINISHED' }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: { message: 'Permission denied', error_subcode: 9999 } }) })

    const promise = publishNow(fd())
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result.error).toMatch(/IG Publish Error/i)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('should return success for carousel with 3 images', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    mockAccount()
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'child-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'child-2' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'child-3' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'carousel-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status_code: 'FINISHED' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'carousel-media-1' }) })
    ;(prisma.post.create as jest.Mock).mockResolvedValue({ id: 'post-1' })

    const promise = publishNow(fd({ 'mediaUrls[]': ['u1', 'u2', 'u3'] }))
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toEqual({ success: true, data: { postId: 'post-1' } })
    const carouselFetchCall = mockFetch.mock.calls[3]
    const body = carouselFetchCall[1].body
    expect(body).toContain('"media_type":"CAROUSEL"')
    expect(body).toContain('child-1')
    expect(body).toContain('child-2')
    expect(body).toContain('child-3')
    expect(prisma.post.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ imageUrl: '["u1","u2","u3"]' })
    }))
  })

  it('should return error when connectedAccountId is missing', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    const promise = publishNow(fd({ connectedAccountId: '' }))
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toEqual({ error: 'Please select an Instagram account first.' })
  })

  it('should return error when mediaUrl is missing', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    const f = fd()
    f.delete('mediaUrl')
    const promise = publishNow(f)
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toEqual({ error: 'Please upload an image or video.' })
  })

  it('should return error when account is not in DB', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    ;(prisma.connectedAccount.findUnique as jest.Mock).mockResolvedValue(null)
    const promise = publishNow(fd())
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toEqual({ error: 'Instagram account not properly configured.' })
  })

  it('should return error when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(Object.assign(new Error('Unauthorized'), { isAuthError: true }))
    const promise = publishNow(fd())
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toEqual({ error: 'Unauthorized' })
  })
})

describe('getSignedUploadUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return signedUrl data on happy path', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    const mockCreateSignedUrl = supabaseAdmin.storage.from('media').createSignedUploadUrl as jest.Mock
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://supa/sign', token: 'tok', path: 'path/file.jpg' },
      error: null
    })

    const result = await getSignedUploadUrl('file.jpg', 'image/jpeg')

    expect(result).toEqual({ signedUrl: 'https://supa/sign', token: 'tok', path: 'path/file.jpg' })
  })

  it('should return error when supabase returns error', async () => {
    mockRequireAuth.mockResolvedValue('test-user-id')
    const mockCreateSignedUrl = supabaseAdmin.storage.from('media').createSignedUploadUrl as jest.Mock
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'Quota exceeded' }
    })

    const result = await getSignedUploadUrl('file.jpg', 'image/jpeg')

    expect(result).toEqual({ error: 'Quota exceeded' })
  })

  it('should return error without crashing when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(Object.assign(new Error('Unauthorized'), { isAuthError: true }))
    const result = await getSignedUploadUrl('file.jpg', 'image/jpeg')

    expect(result).toEqual({ error: expect.any(String) })
  })
})

describe('getProjectImageUploadUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 5 fields for own project', async () => {
    mockRequireAuth.mockResolvedValue('user-1')
    ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'proj-1' })
    const mockFrom = supabaseAdmin.storage.from('media') as any
    mockFrom.createSignedUploadUrl.mockResolvedValue({
      data: { signedUrl: 's', token: 't', path: 'p' },
      error: null
    })
    mockFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn/public' } })

    const result = await getProjectImageUploadUrl('proj-1', 'file.jpg')
    const result2 = await getProjectImageUploadUrl('proj-1', 'file.jpg')

    expect(result).toEqual({
      signedUrl: 's', token: 't', path: 'p',
      storagePath: expect.stringMatching(/^projects\/proj-1\//),
      publicUrl: 'https://cdn/public'
    })
    // two calls with same fileName produce DIFFERENT storagePaths (random prefix)
    expect((result as any).storagePath).not.toEqual((result2 as any).storagePath)
  })

  it('should return error when project not found', async () => {
    mockRequireAuth.mockResolvedValue('user-1')
    ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await getProjectImageUploadUrl('proj-1', 'file.jpg')

    expect(result).toEqual({ error: 'Project not found' })
  })

  it('should return error when wrong user project is requested', async () => {
    mockRequireAuth.mockResolvedValue('user-2')
    ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null) // query with userId: 'user-2' fails

    const result = await getProjectImageUploadUrl('proj-1', 'file.jpg')

    expect(result).toEqual({ error: 'Project not found' })
  })

  it('should return error when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(Object.assign(new Error('Unauthorized'), { isAuthError: true }))
    const result = await getProjectImageUploadUrl('proj-1', 'file.jpg')

    expect(result).toEqual({ error: expect.any(String) })
  })
})

describe('registerProjectImages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should insert rows with correct data', async () => {
    mockRequireAuth.mockResolvedValue('user-1')
    ;(prisma.projectImage.createMany as jest.Mock).mockResolvedValue({ count: 3 })

    const result = await registerProjectImages('proj-1', [
      { url: 'u1', storagePath: 's1', fileName: 'f1' },
      { url: 'u2', storagePath: 's2', fileName: 'f2' },
      { url: 'u3', storagePath: 's3', fileName: 'f3' }
    ])

    expect(result).toEqual({ count: 3 })
    expect(prisma.projectImage.createMany).toHaveBeenCalledWith({
      data: [
        { projectId: 'proj-1', userId: 'user-1', url: 'u1', storagePath: 's1', fileName: 'f1' },
        { projectId: 'proj-1', userId: 'user-1', url: 'u2', storagePath: 's2', fileName: 'f2' },
        { projectId: 'proj-1', userId: 'user-1', url: 'u3', storagePath: 's3', fileName: 'f3' }
      ]
    })
  })

  it('should return error when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(Object.assign(new Error('Unauthorized'), { isAuthError: true }))
    const result = await registerProjectImages('proj-1', [])

    expect(result).toEqual({ error: expect.any(String) })
  })
})
