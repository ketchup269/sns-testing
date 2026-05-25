import { renderHook, act } from '@testing-library/react'
import { useProjects } from '@/app/[locale]/(dashboard)/projects/hooks/useProjects'

const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh })
}))

global.fetch = jest.fn()
const mockFetch = fetch as jest.Mock

const mockProj = {
  id: 'p1', name: 'Alpha', description: 'Desc',
  defaultHashtags: ['#tag1'], objective: 'awareness',
  ageRange: '18-24', gender: '', location: '', profession: '',
  toneStyle: '', writingStyleNotes: '', exampleCaptions: '',
  postingFrequency: '', preferredTimeSlots: '', campaignDuration: '',
  preferredCtaTypes: '', wordsToAvoid: '', toneRestrictions: '',
  customPromptNotes: '', campaignSpecificInstructions: '',
}

describe('useProjects › openModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should open modal and clear fields when no arg is provided', () => {
    const { result } = renderHook(() => useProjects([]))

    act(() => {
      result.current.openModal()
    })

    expect(result.current.isModalOpen).toBe(true)
    expect(result.current.name).toBe('')
    expect(result.current.description).toBe('')
    expect(result.current.hashtags).toBe('')
  })

  it('should open modal and pre-fill fields when project is provided', () => {
    const { result } = renderHook(() => useProjects([]))

    act(() => {
      result.current.openModal(mockProj as any)
    })

    expect(result.current.isModalOpen).toBe(true)
    expect(result.current.name).toBe('Alpha')
    expect(result.current.description).toBe('Desc')
    expect(result.current.hashtags).toBe('#tag1')
    expect(result.current.objective).toBe('awareness')
    expect(result.current.ageRange).toBe('18-24')
  })

  it('should set isModalOpen false when closeModal is called', () => {
    const { result } = renderHook(() => useProjects([]))

    act(() => {
      result.current.openModal()
      result.current.closeModal()
    })

    expect(result.current.isModalOpen).toBe(false)
  })

  it('should clear previous field values when openModal is called after edit', () => {
    const { result } = renderHook(() => useProjects([]))

    act(() => {
      result.current.openModal(mockProj as any)
      result.current.closeModal()
      result.current.openModal()
    })

    expect(result.current.name).toBe('')
    expect(result.current.hashtags).toBe('')
  })
})

describe('useProjects › openViewModal / closeViewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set viewingProject when openViewModal is called', () => {
    const { result } = renderHook(() => useProjects([]))

    act(() => {
      result.current.openViewModal(mockProj as any)
    })

    expect(result.current.viewingProject?.id).toBe('p1')
  })

  it('should clear viewingProject when closeViewModal is called', () => {
    const { result } = renderHook(() => useProjects([]))

    act(() => {
      result.current.openViewModal(mockProj as any)
      result.current.closeViewModal()
    })

    expect(result.current.viewingProject).toBeNull()
  })
})

describe('useProjects › handleSave — create', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create new project on success', async () => {
    const { result } = renderHook(() => useProjects([]))
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'p2', name: 'New' }) })

    act(() => {
      result.current.openModal()
      result.current.setName('New')
      result.current.setDescription('New Desc')
      result.current.setHashtags('#new')
    })

    await act(async () => {
      await result.current.handleSave({ preventDefault: jest.fn() } as any)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({ method: 'POST' }))
    expect(result.current.projects).toContainEqual({ id: 'p2', name: 'New' })
    expect(result.current.isModalOpen).toBe(false)
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('should parse space/comma separated hashtags and add # prefix', async () => {
    const { result } = renderHook(() => useProjects([]))
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'p2', name: 'New' }) })

    act(() => {
      result.current.openModal()
      result.current.setHashtags('food, travel #nature')
    })

    await act(async () => {
      await result.current.handleSave({ preventDefault: jest.fn() } as any)
    })

    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(fetchBody.defaultHashtags).toEqual(['#food', '#travel', '#nature'])
  })

  it('should not add double prefix if hashtag already has #', async () => {
    const { result } = renderHook(() => useProjects([]))
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'p2', name: 'New' }) })

    act(() => {
      result.current.openModal()
      result.current.setHashtags('#food')
    })

    await act(async () => {
      await result.current.handleSave({ preventDefault: jest.fn() } as any)
    })

    const fetchBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(fetchBody.defaultHashtags).toEqual(['#food'])
  })

  it('should set error and keep modal open on API failure', async () => {
    const { result } = renderHook(() => useProjects([]))
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) })

    act(() => {
      result.current.openModal()
    })

    await act(async () => {
      await result.current.handleSave({ preventDefault: jest.fn() } as any)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.isModalOpen).toBe(true)
  })
})

describe('useProjects › handleSave — edit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update existing project on success', async () => {
    const { result } = renderHook(() => useProjects([mockProj as any]))
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ...mockProj, name: 'Updated' }) })

    act(() => {
      result.current.openModal(mockProj as any)
      result.current.setName('Updated')
    })

    await act(async () => {
      await result.current.handleSave({ preventDefault: jest.fn() } as any)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/projects/p1', expect.objectContaining({ method: 'PUT' }))
    expect(result.current.projects.find(p => p.id === 'p1')?.name).toBe('Updated')
  })
})

describe('useProjects › handleDelete', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should remove project from list on successful delete', async () => {
    const { result } = renderHook(() => useProjects([mockProj as any]))
    mockFetch.mockResolvedValue({ ok: true })

    await act(async () => {
      await result.current.handleDelete('p1')
    })

    expect(result.current.projects.length).toBe(0)
    expect(mockRefresh).toHaveBeenCalled()
  })


  it('should set error and unchanged list on API failure', async () => {
    const { result } = renderHook(() => useProjects([mockProj as any]))
    mockFetch.mockResolvedValue({ ok: false })

    await act(async () => {
      await result.current.handleDelete('p1')
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.projects.length).toBe(1)
  })
})
