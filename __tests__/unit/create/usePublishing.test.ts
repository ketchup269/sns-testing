import { renderHook, act } from '@testing-library/react'
import { usePublishing } from '@/app/[locale]/(dashboard)/create/hooks/usePublishing'
import { publishNow, schedulePost, saveDraft, getSignedUploadUrl } from '@/app/[locale]/(dashboard)/create/actions'

jest.mock('@/app/[locale]/(dashboard)/create/actions', () => ({
  publishNow:          jest.fn(),
  schedulePost:        jest.fn(),
  saveDraft:           jest.fn(),
  getSignedUploadUrl:  jest.fn(),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    storage: {
      from: jest.fn().mockReturnValue({
        uploadToSignedUrl: jest.fn(),
        getPublicUrl:      jest.fn().mockReturnValue({
          data: { publicUrl: 'https://cdn.test/uploaded.jpg' }
        }),
      })
    }
  })
}))

const mockPublishNow    = publishNow    as jest.Mock
const mockSchedulePost  = schedulePost  as jest.Mock
const mockSaveDraft     = saveDraft     as jest.Mock
const mockGetSignedUrl  = getSignedUploadUrl as jest.Mock

const makeUrlItem = (id = '1'): any => ({
  type: 'url', url: 'https://cdn.test/img.jpg', isVideo: false, id
})
const makeFileItem = (name = 'photo.jpg'): any => ({
  type: 'file', file: new File(['data'], name, { type: 'image/jpeg' }), id: 'f1'
})

const defaultOptions = {
  caption: '',
  selectedAccountId: 'acc-1',
  selectedProjectId: '',
  isVideo: false,
  mediaItems: []
}

describe('usePublishing › uploadAllMedia', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should pass through URL items without uploading', async () => {
    const { result } = renderHook(() => usePublishing())
    mockPublishNow.mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, mediaItems: [makeUrlItem()] })
    })

    expect(mockGetSignedUrl).not.toHaveBeenCalled()
    expect(mockPublishNow).toHaveBeenCalled()
    const formData = mockPublishNow.mock.calls[0][0] as FormData
    expect(formData.get('mediaUrl')).toBe('https://cdn.test/img.jpg')
  })

  it('should upload File items and replace with public URL', async () => {
    const { result } = renderHook(() => usePublishing())
    mockGetSignedUrl.mockResolvedValue({ signedUrl: 'https://supa/sign', token: 'tok', path: 'p/f.jpg' })
    const { createClient } = require('@supabase/supabase-js')
    createClient().storage.from().uploadToSignedUrl.mockResolvedValue({ error: null })
    mockPublishNow.mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, mediaItems: [makeFileItem()] })
    })

    expect(mockGetSignedUrl).toHaveBeenCalledWith(expect.stringMatching(/^[a-z0-9]+_\d+\.jpg$/), 'image/jpeg')
    expect(mockPublishNow).toHaveBeenCalled()
    const formData = mockPublishNow.mock.calls[0][0] as FormData
    expect(formData.get('mediaUrl')).toBe('https://cdn.test/uploaded.jpg')
  })

  it('should set result.error and not call publishNow when mediaItems is empty', async () => {
    const { result } = renderHook(() => usePublishing())

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, mediaItems: [] })
    })

    expect(result.current.result?.error).toBeTruthy()
    expect(mockPublishNow).not.toHaveBeenCalled()
  })

  it('should set result.error and not call publishNow when upload fails', async () => {
    const { result } = renderHook(() => usePublishing())
    mockGetSignedUrl.mockResolvedValue({ error: 'Quota exceeded' })

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, mediaItems: [makeFileItem()] })
    })

    expect(result.current.result?.error).toBeTruthy()
    expect(mockPublishNow).not.toHaveBeenCalled()
  })
})

describe('usePublishing › buildFormData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should include caption only when no hashtags are provided', async () => {
    const { result } = renderHook(() => usePublishing())
    mockPublishNow.mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, caption: 'hello', mediaItems: [makeUrlItem()] })
    })

    const formData = mockPublishNow.mock.calls[0][0] as FormData
    expect(formData.get('caption')).toBe('hello')
  })


  it('should set projectId when provided', async () => {
    const { result } = renderHook(() => usePublishing())
    mockPublishNow.mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, selectedProjectId: 'proj-1', mediaItems: [makeUrlItem()] })
    })

    const formData = mockPublishNow.mock.calls[0][0] as FormData
    expect(formData.get('projectId')).toBe('proj-1')
  })

  it('should NOT set projectId when empty string', async () => {
    const { result } = renderHook(() => usePublishing())
    mockPublishNow.mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, selectedProjectId: '', mediaItems: [makeUrlItem()] })
    })

    const formData = mockPublishNow.mock.calls[0][0] as FormData
    expect(formData.get('projectId')).toBeNull()
  })

  it('should set libraryImageId from first URL item that has one', async () => {
    const { result } = renderHook(() => usePublishing())
    mockPublishNow.mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.publish('now', { 
        ...defaultOptions, 
        mediaItems: [{ type: 'url', url: '...', libraryImageId: 'lib-42', id: '1', isVideo: false }] 
      })
    })

    const formData = mockPublishNow.mock.calls[0][0] as FormData
    expect(formData.get('libraryImageId')).toBe('lib-42')
  })

  it('should append all multiple URLs as mediaUrls[] and set first as mediaUrl', async () => {
    const { result } = renderHook(() => usePublishing())
    mockPublishNow.mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, mediaItems: [makeUrlItem('1'), makeUrlItem('2'), makeUrlItem('3')] })
    })

    const formData = mockPublishNow.mock.calls[0][0] as FormData
    expect(formData.getAll('mediaUrls[]').length).toBe(3)
    expect(formData.get('mediaUrl')).toBe('https://cdn.test/img.jpg')
  })
})

describe('usePublishing › publish — mode: now', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set result.success and call onSuccess when success', async () => {
    const onSuccess = jest.fn()
    const { result } = renderHook(() => usePublishing())
    mockPublishNow.mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, mediaItems: [makeUrlItem()] }, onSuccess)
    })

    expect(result.current.result?.success).toBe(true)
    expect(onSuccess).toHaveBeenCalledWith('now')
  })

  it('should set result.error when server action error', async () => {
    const { result } = renderHook(() => usePublishing())
    mockPublishNow.mockResolvedValue({ error: 'IG error' })

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, mediaItems: [makeUrlItem()] })
    })

    expect(result.current.result?.error).toBe('IG error')
  })

  it('should set result.error and no upload when scheduledFor is missing for schedule mode', async () => {
    const { result } = renderHook(() => usePublishing())

    await act(async () => {
      await result.current.publish('schedule', { ...defaultOptions, mediaItems: [makeUrlItem()] })
    })

    expect(result.current.result?.error).toBeTruthy()
    expect(mockSchedulePost).not.toHaveBeenCalled()
  })

  it('should call schedulePost and onSuccess when schedule mode success', async () => {
    const onSuccess = jest.fn()
    const { result } = renderHook(() => usePublishing())
    mockSchedulePost.mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.publish('schedule', { ...defaultOptions, scheduledFor: '2025-06-16T10:00:00Z', mediaItems: [makeUrlItem()] }, onSuccess)
    })

    expect(mockSchedulePost).toHaveBeenCalled()
    const formData = mockSchedulePost.mock.calls[0][0] as FormData
    expect(formData.get('scheduledFor')).toBe('2025-06-16T10:00:00.000Z')
    expect(onSuccess).toHaveBeenCalledWith('schedule')
  })
})

describe('usePublishing › saveAsDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set result.success and call onSuccess on success', async () => {
    const onSuccess = jest.fn()
    const { result } = renderHook(() => usePublishing())
    mockSaveDraft.mockResolvedValue({ success: true })

    await act(async () => {
      await result.current.saveAsDraft({ ...defaultOptions, mediaItems: [makeUrlItem()] }, onSuccess)
    })

    expect(result.current.result?.success).toBe(true)
    expect(onSuccess).toHaveBeenCalled()
  })

  it('should set result.error when server action error', async () => {
    const { result } = renderHook(() => usePublishing())
    mockSaveDraft.mockResolvedValue({ error: 'Draft failed' })

    await act(async () => {
      await result.current.saveAsDraft({ ...defaultOptions, mediaItems: [makeUrlItem()] })
    })

    expect(result.current.result?.error).toBe('Draft failed')
  })

  it('should not call saveDraft when upload fails', async () => {
    const { result } = renderHook(() => usePublishing())
    mockGetSignedUrl.mockResolvedValue({ error: 'fail' })

    await act(async () => {
      await result.current.saveAsDraft({ ...defaultOptions, mediaItems: [makeFileItem()] })
    })

    expect(mockSaveDraft).not.toHaveBeenCalled()
  })
})

describe('usePublishing › isPublishing flag', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should be false initially', () => {
    const { result } = renderHook(() => usePublishing())
    expect(result.current.isPublishing).toBe(false)
  })

  it('should clear result when clearResult is called', async () => {
    const { result } = renderHook(() => usePublishing())
    mockPublishNow.mockResolvedValue({ error: 'oops' })

    await act(async () => {
      await result.current.publish('now', { ...defaultOptions, mediaItems: [makeUrlItem()] })
    })

    expect(result.current.result?.error).toBe('oops')

    act(() => {
      result.current.clearResult()
    })

    expect(result.current.result).toBeNull()
  })
})
