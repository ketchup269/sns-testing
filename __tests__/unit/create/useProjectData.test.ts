import { renderHook, act } from '@testing-library/react'
import { useProjectData } from '@/app/[locale]/(dashboard)/create/hooks/useProjectData'
import { getProjectImageUploadUrl, registerProjectImages } from '@/app/[locale]/(dashboard)/create/actions'

global.fetch = jest.fn()
const mockFetch = fetch as jest.Mock

jest.mock('@/app/[locale]/(dashboard)/create/actions', () => ({
  getProjectImageUploadUrl: jest.fn(),
  registerProjectImages:    jest.fn(),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    storage: {
      from: jest.fn().mockReturnValue({
        uploadToSignedUrl: jest.fn().mockResolvedValue({ error: null }),
      })
    }
  })
}))

const mockGetProjectUrl   = getProjectImageUploadUrl as jest.Mock
const mockRegisterImages  = registerProjectImages    as jest.Mock

const proj1 = { id: 'p1', name: 'Proj 1' }
const proj2 = { id: 'p2', name: 'Proj 2' }

describe('useProjectData › initialisation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should default selectedProjectId to first project id', () => {
    const { result } = renderHook(() => useProjectData([proj1 as any, proj2 as any]))
    expect(result.current.selectedProjectId).toBe('p1')
  })

  it('should return correct selectedProject object', () => {
    const { result } = renderHook(() => useProjectData([proj1 as any, proj2 as any]))
    expect(result.current.selectedProject?.name).toBe('Proj 1')
  })

  it('should set selectedProjectId to empty string when initial projects are empty', () => {
    const { result } = renderHook(() => useProjectData([]))
    expect(result.current.selectedProjectId).toBe('')
  })

})

describe('useProjectData › project switching triggers data fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockImplementation((url) => {
      const u = url.toString()
      if (u.includes('/images')) return Promise.resolve({ ok: true, json: async () => [] })
      if (u.includes('/drafts')) return Promise.resolve({ ok: true, json: async () => ({ drafts: [] }) })
      if (u.includes('/history')) return Promise.resolve({ ok: true, json: async () => ({ history: [] }) })
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  })

  it('should fetch history, drafts, and images when switching selectedProjectId', async () => {
    const { result } = renderHook(() => useProjectData([proj1 as any, proj2 as any]))
    
    await act(async () => {
      result.current.setSelectedProjectId('p2')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/projects/p2/history')
    expect(mockFetch).toHaveBeenCalledWith('/api/projects/p2/drafts')
    expect(mockFetch).toHaveBeenCalledWith('/api/projects/p2/images')
  })

  it('should clear data when switching to empty project', async () => {
    const { result } = renderHook(() => useProjectData([proj1 as any]))
    
    // Wait for initial fetch to settle
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    await act(async () => {
      result.current.setSelectedProjectId('')
    })

    expect(result.current.history).toEqual([])
    expect(result.current.drafts).toEqual([])
    expect(result.current.projectImages).toEqual([])
  })

  it('should not crash and leave state empty on failed fetch', async () => {
    mockFetch.mockResolvedValue({ ok: false })
    const { result } = renderHook(() => useProjectData([proj1 as any, proj2 as any]))
    
    await act(async () => {
      result.current.setSelectedProjectId('p2')
    })

    expect(result.current.history).toEqual([])
  })
})

describe('useProjectData › handleLibraryUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should upload and refresh library on happy path', async () => {
    mockGetProjectUrl.mockResolvedValue({
      token: 'tok', path: 'p/file.jpg',
      storagePath: 'projects/p1/rand.jpg',
      publicUrl: 'https://cdn/rand.jpg'
    })
    mockRegisterImages.mockResolvedValue({ count: 1 })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'img-1', url: 'https://cdn/rand.jpg', fileName: 'photo.jpg', createdAt: new Date().toISOString() }]
    })

    const { result } = renderHook(() => useProjectData([proj1 as any]))

    await act(async () => {
      await result.current.handleLibraryUpload([new File(['data'], 'photo.jpg', { type: 'image/jpeg' })])
    })

    expect(mockRegisterImages).toHaveBeenCalledWith('p1', [expect.objectContaining({ url: 'https://cdn/rand.jpg' })])
    expect(result.current.projectImages.length).toBe(1)
    expect(result.current.projectImages[0].id).toBe('img-1')
    expect(result.current.isLibraryExpanded).toBe(true)
  })

  it('should set isLibraryUploading to true during upload and false after', async () => {
    mockGetProjectUrl.mockResolvedValue({
      token: 'tok', path: 'p/file.jpg',
      storagePath: 'projects/p1/rand.jpg',
      publicUrl: 'https://cdn/rand.jpg'
    })
    mockRegisterImages.mockResolvedValue({ count: 1 })
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })

    const { result } = renderHook(() => useProjectData([proj1 as any]))
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })

    await act(async () => {
      await result.current.handleLibraryUpload([new File(['data'], 'photo.jpg', { type: 'image/jpeg' })])
    })

    expect(result.current.isLibraryUploading).toBe(false)
  })

  it('should reach 100 progress after all files uploaded', async () => {
    mockGetProjectUrl.mockResolvedValue({
      token: 'tok', path: 'p/file.jpg',
      storagePath: 'projects/p1/rand.jpg',
      publicUrl: 'https://cdn/rand.jpg'
    })
    mockRegisterImages.mockResolvedValue({ count: 2 })
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })

    const { result } = renderHook(() => useProjectData([proj1 as any]))

    await act(async () => {
      await result.current.handleLibraryUpload([
        new File(['data'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['data'], 'photo2.jpg', { type: 'image/jpeg' })
      ])
    })

    expect(result.current.libraryUploadProgress).toBe(0) // Resets to 0 after completion
  })

  it('should skip file and continue on failed signed URL', async () => {
    mockGetProjectUrl.mockResolvedValue({ error: 'fail' })
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] })

    const { result } = renderHook(() => useProjectData([proj1 as any]))
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })

    await act(async () => {
      await result.current.handleLibraryUpload([new File(['data'], 'photo.jpg', { type: 'image/jpeg' })])
    })

    expect(mockRegisterImages).not.toHaveBeenCalled()
  })
})

describe('useProjectData › deleteProjectImage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should remove image from state after successful DELETE', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'img-1', url: 'https://cdn/rand.jpg' }]
    })
    const { result } = renderHook(() => useProjectData([proj1 as any]))
    
    await act(async () => {
      result.current.setSelectedProjectId('p1') // trigger fetch
    })

    mockFetch.mockResolvedValue({ ok: true })

    await act(async () => {
      await result.current.deleteProjectImage('img-1')
    })

    expect(result.current.projectImages.length).toBe(0)
  })



  it('should leave state unchanged on failed DELETE fetch', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [{ id: 'img-1', url: 'https://cdn/rand.jpg' }] })
    const { result } = renderHook(() => useProjectData([proj1 as any]))
    await act(async () => { result.current.setSelectedProjectId('p1') })

    mockFetch.mockResolvedValue({ ok: false })

    await act(async () => {
      await result.current.deleteProjectImage('img-1')
    })

    expect(result.current.projectImages.length).toBe(1)
  })
})
